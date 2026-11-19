"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import {
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Mic,
  RotateCcw,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { DemoAgentUIMessage } from "@/lib/demo-agent/agent";
import { APP_SCREENS, type AppScreen } from "@/lib/demo-agent/pages";
import type { Qualification } from "@/lib/demo-agent/qualify";
import { DEPLOY_URL, NOMADWEALTH_URL } from "@/lib/brand";
import { useSpeechInput, useSpeechOutput, type ListenError } from "@/components/use-speech";

/** NomadWealth's mailing list (admin app, CORS enabled). Body: { email, source? }. */
const WAITLIST_ENDPOINT = "https://admin.nomadwealth.app/api/waitlist";

/** localStorage key for the "read replies aloud" preference (per viewer). */
const VOICE_KEY = "nomad-demo-guide-voice";

interface Lead {
  /** Tag for the mailing list's `source` column. */
  source: string;
  /** Last structured answers from record_qualification, or null if none yet. */
  qualification: Qualification | null;
}

const SUGGESTIONS = [
  "How does currency conversion work?",
  "Show me the whole trip",
  "Is my data private?",
  "How do I get my own copy?",
];

/**
 * The live demo's guide: a chat panel that answers visitors from the sample
 * trip, opens /app screens as it explains, and offers the next step once the
 * visitor is qualified. Server side: /api/demo-agent + lib/demo-agent.
 *
 * Mounted only by the shell layout when DEMO_AGENT is on (lib/demo.ts). The
 * conversation lives in this component's state only; nothing is stored.
 */
export function DemoAgent() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, error, regenerate, addToolOutput, setMessages } = useChat<DemoAgentUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/demo-agent" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall({ toolCall }) {
      if (toolCall.dynamic) return;
      if (toolCall.toolName === "navigate") {
        const screen = APP_SCREENS[toolCall.input.screen as AppScreen];
        if (screen) router.push(screen.href);
        // No await: awaiting inside onToolCall can deadlock the chat.
        addToolOutput({
          tool: "navigate",
          toolCallId: toolCall.toolCallId,
          output: { opened: screen ? screen.label : "unknown screen" },
        });
      } else if (toolCall.toolName === "show_cta") {
        addToolOutput({ tool: "show_cta", toolCallId: toolCall.toolCallId, output: { shown: true } });
      }
    },
  });

  const busy = status === "submitted" || status === "streaming";

  // ---- Voice ----------------------------------------------------------------
  const [speakReplies, setSpeakReplies] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const output = useSpeechOutput();
  const spokenId = useRef<string | null>(null);
  const voiceInput = useSpeechInput({
    onInterim: (t) => setInput(t),
    onFinal: (t) => {
      // Talking to the guide implies wanting to hear it back.
      setVoicePref(true);
      send(t);
    },
    onError: (e: ListenError) =>
      setVoiceNote(
        e === "not-allowed"
          ? "Microphone access is blocked. Allow it in your browser to talk to the guide."
          : e === "no-speech"
            ? "I didn't catch that. Tap the mic and try again."
            : "Voice input isn't available right now. You can type instead.",
      ),
  });

  useEffect(() => {
    let saved = false;
    try {
      saved = localStorage.getItem(VOICE_KEY) === "1";
    } catch {
      /* storage blocked: default off */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only preference, read after hydration
    if (saved) setSpeakReplies(true);
  }, []);

  function setVoicePref(on: boolean) {
    setSpeakReplies(on);
    if (!on) output.cancel();
    try {
      localStorage.setItem(VOICE_KEY, on ? "1" : "0");
    } catch {
      /* per-viewer convenience only */
    }
  }

  // Read each finished reply aloud once (the whole tool loop is one message).
  useEffect(() => {
    if (status !== "ready" || !speakReplies || !output.supported) return;
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || spokenId.current === last.id) return;
    spokenId.current = last.id;
    const text = last.parts
      .map((p) => (p.type === "text" ? p.text : ""))
      .join(" ")
      .trim();
    if (text) output.speak(text);
  }, [status, messages, speakReplies, output]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function toggle() {
    if (open) {
      output.cancel();
      voiceInput.stop();
    }
    setOpen((o) => !o);
  }

  function send(text: string) {
    const t = text.trim().slice(0, 1000);
    if (!t || busy) return;
    output.cancel();
    setVoiceNote(null);
    sendMessage({ text: t });
    setInput("");
  }

  function toggleMic() {
    setVoiceNote(null);
    if (voiceInput.listening) {
      voiceInput.stop();
      return;
    }
    output.cancel();
    voiceInput.start();
  }

  // The latest qualification, sent with an email signup.
  const lead = latestLead(messages);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Ask the demo guide"
          // Clears the floating bottom nav (components/nav.tsx: 14px + 66px tall) and the home indicator.
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 92px)" }}
          className="fixed right-4 z-20 flex h-12 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-brand-ink shadow-[0_12px_32px_-10px_rgba(0,0,0,0.55)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Sparkles size={18} aria-hidden />
          <span className="hidden min-[400px]:inline">Ask the guide</span>
        </button>
      )}

      {open && (
        <section
          aria-label="Demo guide chat"
          style={{
            bottom: "max(8px, env(safe-area-inset-bottom))",
            height: "min(620px, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 24px))",
          }}
          className="fixed inset-x-2 z-50 flex flex-col overflow-hidden rounded-[22px] border border-line bg-surface text-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)] sm:inset-x-auto sm:right-4 sm:w-[400px]"
        >
          <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-brand-ink">
                <Sparkles size={16} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold">Demo guide</h2>
                <p className="truncate text-xs text-muted">AI assistant · answers from the sample trip</p>
              </div>
            </div>
            <div className="flex items-center">
              {output.supported && (
                <IconButton
                  onClick={() => setVoicePref(!speakReplies)}
                  pressed={speakReplies}
                  label={speakReplies ? "Stop reading replies aloud" : "Read replies aloud"}
                >
                  {speakReplies ? <Volume2 size={17} className="text-brand" /> : <VolumeX size={17} />}
                </IconButton>
              )}
              {messages.length > 0 && (
                <IconButton
                  onClick={() => {
                    output.cancel();
                    spokenId.current = null;
                    setMessages([]);
                  }}
                  label="Start a new chat"
                >
                  <RotateCcw size={16} />
                </IconButton>
              )}
              <IconButton onClick={toggle} label="Close the demo guide">
                <X size={18} />
              </IconButton>
            </div>
          </header>

          <div ref={scroller} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
            <Bubble role="assistant">
              Hi! I can walk you through this demo trip, answer questions about Nomad Expenses, and help you set up your
              own free copy. What would you like to see?
            </Bubble>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="min-h-9 rounded-full border border-line px-3 py-1.5 text-xs text-muted transition hover:border-brand hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className="space-y-2">
                {m.parts.map((part, i) => {
                  const key = `${m.id}-${i}`;
                  switch (part.type) {
                    case "text":
                      return part.text.trim() ? (
                        <Bubble key={key} role={m.role === "user" ? "user" : "assistant"}>
                          {part.text}
                        </Bubble>
                      ) : null;
                    case "tool-navigate":
                      return part.state === "output-available" ? (
                        <p key={key} className="flex items-center gap-1.5 text-xs text-muted">
                          <MapPin size={12} aria-hidden /> Opened {part.output.opened}
                        </p>
                      ) : null;
                    case "tool-show_cta":
                      return part.state === "input-available" || part.state === "output-available" ? (
                        <CtaCard key={key} kind={part.input.kind} reason={part.input.reason} lead={lead} />
                      ) : null;
                    default:
                      return null;
                  }
                })}
              </div>
            ))}

            {busy && (
              <p className="flex items-center gap-2 text-xs text-muted">
                <Loader2 size={13} className="animate-spin" aria-hidden /> Thinking…
              </p>
            )}
            {output.speaking && (
              <button
                type="button"
                onClick={output.cancel}
                className="flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs text-muted hover:text-ink"
              >
                <Square size={10} className="fill-current" aria-hidden /> Stop speaking
              </button>
            )}
            {voiceNote && (
              <p role="status" className="text-xs text-muted">
                {voiceNote}
              </p>
            )}
            {error && !busy && (
              <div role="alert" className="rounded-2xl border border-danger/40 bg-danger/10 p-3 text-xs">
                {friendlyError(error)}
                <button type="button" onClick={() => regenerate()} className="ml-2 font-semibold underline">
                  Try again
                </button>
              </div>
            )}
          </div>

          <form
            className="border-t border-line p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <div className="flex items-end gap-1.5 rounded-2xl bg-field px-3 py-2 focus-within:ring-2 focus-within:ring-brand">
              <label htmlFor="demo-agent-input" className="sr-only">
                Ask the demo guide
              </label>
              <textarea
                id="demo-agent-input"
                ref={inputRef}
                rows={1}
                maxLength={1000}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder={voiceInput.listening ? "Listening…" : "Ask about Nomad Expenses…"}
                // 16px stops iOS Safari zooming in on focus.
                className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-base text-ink placeholder:text-muted focus:outline-none sm:text-sm"
              />
              {voiceInput.supported && (
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={busy}
                  aria-pressed={voiceInput.listening}
                  aria-label={voiceInput.listening ? "Stop listening" : "Talk to the guide"}
                  className={
                    "grid size-9 shrink-0 place-items-center rounded-full transition disabled:opacity-40 " +
                    (voiceInput.listening ? "animate-pulse bg-danger text-white" : "text-muted hover:text-ink")
                  }
                >
                  <Mic size={18} />
                </button>
              )}
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-brand-ink transition disabled:opacity-40"
                aria-label="Send"
              >
                <ArrowUp size={18} />
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted">
              AI guide on sample data. Messages are processed by Anthropic via Vercel AI Gateway and are not stored by us.
              Voice uses your browser&apos;s speech service. Please don&apos;t share personal details.
            </p>
          </form>
        </section>
      )}
    </>
  );
}

function IconButton({
  onClick,
  label,
  pressed,
  children,
}: {
  onClick: () => void;
  label: string;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className="grid size-10 place-items-center rounded-full text-muted transition hover:bg-field hover:text-ink focus-visible:outline-2 focus-visible:outline-brand"
    >
      {children}
    </button>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={role === "user" ? "flex justify-end" : "flex"}>
      <p
        className={
          role === "user"
            ? "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-accent px-3 py-2 text-sm text-accent-ink"
            : "max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-field px-3 py-2 text-sm text-ink"
        }
      >
        {children}
      </p>
    </div>
  );
}

const CARD = "rounded-2xl border border-brand/50 bg-brand/10 p-3";
const CARD_BUTTON =
  "mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand px-3.5 text-sm font-semibold text-brand-ink transition hover:brightness-110";

function CtaCard({ kind, reason, lead }: { kind: "deploy" | "email" | "nomadwealth_pro"; reason: string; lead: Lead }) {
  if (kind === "email") return <EmailCard reason={reason} lead={lead} />;
  const deploy = kind === "deploy";
  return (
    <div className={CARD}>
      <p className="text-sm">{reason}</p>
      <a href={deploy ? DEPLOY_URL : NOMADWEALTH_URL} target="_blank" rel="noopener noreferrer" className={CARD_BUTTON}>
        {deploy ? "Deploy your own free copy" : "See NomadWealth Pro"} <ExternalLink size={13} aria-hidden />
      </a>
      <p className="mt-2 text-[11px] text-muted">
        {deploy
          ? "Free on your own Vercel and Neon. About 5 minutes, no terminal."
          : "Net worth across countries: investments, property and loans. €149 one-time."}
      </p>
    </div>
  );
}

function EmailCard({ reason, lead }: { reason: string; lead: Lead }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setState("sending");
    try {
      const res = await fetch(WAITLIST_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ email: trimmed, source: lead.source }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("done");
      // Tell the owner about the lead (email + structured answers, never the
      // chat). Best-effort: the visitor's signup has already succeeded.
      void fetch("/api/demo-agent/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmed, qualification: lead.qualification ?? {} }),
      }).catch(() => {});
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="flex items-center gap-2 rounded-2xl border border-line bg-field p-3 text-sm">
        <CheckCircle2 size={16} className="text-brand" aria-hidden /> Done. Check your inbox.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className={CARD}>
      <p className="text-sm">{reason}</p>
      <div className="mt-2 flex gap-2">
        <label htmlFor="demo-agent-email" className="sr-only">
          Email address
        </label>
        <input
          id="demo-agent-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="min-h-9 min-w-0 flex-1 rounded-full border border-line bg-surface px-3 text-base text-ink placeholder:text-muted focus:border-brand focus:outline-none sm:text-sm"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand px-3.5 text-sm font-semibold text-brand-ink disabled:opacity-50"
        >
          {state === "sending" ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <Mail size={13} aria-hidden />}
          Send
        </button>
      </div>
      {state === "error" && (
        <p role="alert" className="mt-2 text-xs text-danger">
          That didn&apos;t go through. Please try again.
        </p>
      )}
      <p className="mt-2 text-[11px] text-muted">Setup guide and NomadWealth news only. Unsubscribe any time.</p>
    </form>
  );
}

function latestLead(messages: DemoAgentUIMessage[]): Lead {
  for (let i = messages.length - 1; i >= 0; i--) {
    const parts = messages[i].parts;
    for (let j = parts.length - 1; j >= 0; j--) {
      const p = parts[j];
      if (p.type === "tool-record_qualification" && p.state === "output-available") {
        return { source: p.output.source, qualification: p.input };
      }
    }
  }
  return { source: "expenses-agent", qualification: null };
}

function friendlyError(error: Error): string {
  try {
    const parsed = JSON.parse(error.message) as { error?: string };
    if (parsed.error) return parsed.error;
  } catch {
    /* not JSON */
  }
  return "The guide couldn't answer just now.";
}
