"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Browser-native voice for the demo guide: speech recognition for input and
 * speech synthesis for replies. No service of ours is involved; the browser
 * does both (Chrome sends recognition audio to Google's speech service,
 * Safari to Apple's, which the panel and privacy policy disclose). Each half
 * reports `supported` so the UI hides what the browser lacks.
 */

// The Web Speech recognition API is not in TypeScript's DOM lib.
interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Browser support never changes after load, so there is nothing to subscribe to. */
const noSubscribe = () => () => {};
const hasSynthesis = () => typeof window !== "undefined" && "speechSynthesis" in window;

export type ListenError = "not-allowed" | "no-speech" | "other";

export function useSpeechInput(opts: {
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
  onError?: (e: ListenError) => void;
}) {
  const supported = useSyncExternalStore(noSubscribe, () => recognitionCtor() !== null, () => false);
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const handlers = useRef(opts);
  useLayoutEffect(() => {
    handlers.current = opts;
  });

  const stop = useCallback(() => {
    rec.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor || rec.current) return;
    const r = new Ctor();
    r.lang = document.documentElement.lang || navigator.language || "en-US";
    r.interimResults = true;
    r.continuous = false;
    let finalText = "";
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      handlers.current.onInterim((finalText + interim).trim());
    };
    r.onerror = (e) => {
      handlers.current.onError?.(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "not-allowed"
          : e.error === "no-speech"
            ? "no-speech"
            : "other",
      );
    };
    r.onend = () => {
      rec.current = null;
      setListening(false);
      if (finalText.trim()) handlers.current.onFinal(finalText.trim());
    };
    rec.current = r;
    setListening(true);
    try {
      r.start();
    } catch {
      rec.current = null;
      setListening(false);
      handlers.current.onError?.("other");
    }
  }, []);

  useEffect(() => () => rec.current?.abort(), []);

  return { supported, listening, start, stop };
}

/** Make chat text pleasant to hear: no markdown symbols or raw URLs. */
export function speakableText(text: string): string {
  return text
    .replace(/https?:\/\/\S+/g, "the link")
    .replace(/[*_#`>|]/g, "")
    .replace(/€\s?(\d[\d.,]*\d|\d)/g, "$1 euros")
    .replace(/\s+/g, " ")
    .trim();
}

/** Sentence-sized chunks: some engines cut off a single long utterance. */
export function speechChunks(text: string, max = 220): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      out.push(cur.trim());
      cur = "";
    }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function useSpeechOutput() {
  const supported = useSyncExternalStore(noSubscribe, hasSynthesis, () => false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => () => {
    if (hasSynthesis()) window.speechSynthesis.cancel();
  }, []);

  const cancel = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const chunks = speechChunks(speakableText(text));
    if (chunks.length === 0) return;
    const lang = document.documentElement.lang || "en";
    const voices = synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
    const voice =
      voices.find((v) => /natural|neural|premium|enhanced/i.test(v.name)) ??
      voices.find((v) => /google|samantha|daniel/i.test(v.name)) ??
      voices[0];
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      if (voice) u.voice = voice;
      u.rate = 1.05;
      if (i === 0) u.onstart = () => setSpeaking(true);
      if (i === chunks.length - 1) {
        u.onend = () => setSpeaking(false);
        u.onerror = () => setSpeaking(false);
      }
      synth.speak(u);
    });
  }, []);

  return { supported, speaking, speak, cancel };
}
