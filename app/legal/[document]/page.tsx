import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LegalLayout } from "@/components/legal-layout";

const titles = { privacy: "Privacy Policy", cookies: "Cookie Policy", terms: "Terms of Use", refunds: "Refund Policy", license: "Software Licence" } as const;
type Document = keyof typeof titles;

export function generateStaticParams() { return Object.keys(titles).map((document) => ({ document })); }
export async function generateMetadata({ params }: PageProps<"/legal/[document]">): Promise<Metadata> {
  const { document } = await params;
  return { title: `${titles[document as Document] ?? "Legal"} · Nomad Expenses` };
}

export default async function LegalPage({ params }: PageProps<"/legal/[document]">) {
  const { document } = await params;
  if (!Object.hasOwn(titles, document)) notFound();
  const content: Record<Document, React.ReactNode> = {
    privacy: <>
      <h2>The short version</h2><p>Nomad Expenses is a self-hosted travel expense tracker. The person who deploys an instance controls its hosting and database. This policy describes the public project website and the software as supplied; an independently operated deployment may have different providers and its operator is responsible for its own privacy information.</p>
      <h2>Who to contact</h2><p>Nomad Expenses is a project by Nomad Developer. For privacy questions or requests, contact <a href="mailto:contact@nomad-developer.co.uk">contact@nomad-developer.co.uk</a>.</p>
      <h2>Information involved</h2><p>The supplied tracker stores the name, trip legs, expense amounts, dates, currencies, categories and notes entered by its users in the database configured by the deployment operator. A share link displays aggregate trip information to anyone who has that link; individual expenses and notes are not shown. The deployment operator can revoke links.</p><p>When you contact us, we receive the information you choose to send, including your email address, and use it to reply. The website host may process technical request information such as IP address and browser details to operate and secure the site. The exact hosting provider, log retention and location depend on the deployment.</p>
      <h2>Cookies and third parties</h2><p>The supplied app uses an essential session cookie after sign-in and local storage to remember acknowledgement of the cookie notice. It includes no analytics or advertising tags. See the <Link href="/legal/cookies">Cookie Policy</Link>. Exchange-rate lookups are made from the server to external rate providers; the request concerns a currency and date and does not include expense notes or amounts. Hosting and database providers process data for the operator under their own terms.</p>
      <h2>Purpose, retention and rights</h2><p>Data is used to provide and secure the tracker, respond to enquiries and operate the website. Data in a self-hosted database remains there until the operator deletes it or applies their own retention policy. Contact messages are retained as needed to answer and manage enquiries. Where data-protection law applies, you may have rights to access, correct, delete, restrict or obtain a copy of personal data, and to complain to the relevant supervisory authority. Contact us about the project website; for an independently operated tracker, contact its operator.</p>
      <h2>Changes</h2><p>We will update this page when the project’s practices change. Deployments using additional services must update their own notice to match.</p>
    </>,
    cookies: <>
      <h2>What this site uses</h2><p>Cookies and local storage are small pieces of information stored on your device. The supplied software uses the following essential storage:</p><ul><li><strong>nomad_session</strong> — an HTTP-only authentication cookie set when you sign in, used to protect the tracker. It expires after one year or when you sign out.</li><li><strong>nomad-cookie-notice-v1</strong> — local storage used to remember that you dismissed the cookie notice. It stays until you clear it from your browser.</li></ul>
      <h2>Analytics and advertising</h2><p>No analytics or advertising cookies, pixels or tags are included in the current project. The notice is informational; it does not grant consent to optional tracking. If an operator adds optional technologies, they must update this policy and provide an appropriate choice before those technologies run.</p>
      <h2>Manage storage</h2><p>You can clear cookies and site data in your browser settings. Clearing the session cookie signs you out; clearing local storage will show the notice again. You can also reopen it using Cookie preferences in the footer.</p><p>Questions? Email <a href="mailto:contact@nomad-developer.co.uk">contact@nomad-developer.co.uk</a>.</p>
    </>,
    terms: <>
      <h2>About the project</h2><p>Nomad Expenses is a self-hosted tool for recording and reviewing travel spending. The website and project are provided by Nomad Developer. An individual deployment may be operated by someone else.</p>
      <h2>Your responsibilities</h2><p>If you deploy the tracker, you are responsible for your hosting and database accounts, their costs and terms, access to your shared password, backups, updates and the data you enter. Anyone with the password can use the tracker; anyone with an active share link can see the aggregate information it exposes.</p>
      <h2>Accuracy and availability</h2><p>Exchange rates and totals are provided to help with record keeping and may be unavailable or inaccurate. Check important figures independently. The tracker does not provide financial, tax or accounting advice. Availability depends on your deployment and its providers.</p>
      <h2>Software use</h2><p>Any rights to use or modify the code are determined by the licence supplied with the repository, if one is provided. No purchase or subscription is offered through this website.</p>
      <h2>Contact</h2><p>For questions about the project, email <a href="mailto:contact@nomad-developer.co.uk">contact@nomad-developer.co.uk</a>. Nothing here is intended to remove rights that cannot be excluded under applicable law.</p>
    </>,
    refunds: <><h2>Purchases and refunds</h2><p>Nomad Expenses currently offers no paid purchase, subscription or checkout through this website, so there is no project purchase to refund. Your hosting and database providers may charge for their services under their own terms; please contact them about those charges.</p><p>If you have a question, email <a href="mailto:contact@nomad-developer.co.uk">contact@nomad-developer.co.uk</a>.</p></>,
    license: <><h2>Using the software</h2><p>The Nomad Expenses source code is available to view on <a href="https://github.com/costibotez/nomad-expense-tracker">GitHub</a>. Check the repository for a licence before copying, modifying or redistributing the code. Public access to source code does not by itself grant a licence.</p><p>Questions about permission to use the software? Email <a href="mailto:contact@nomad-developer.co.uk">contact@nomad-developer.co.uk</a>.</p></>,
  };
  return <LegalLayout title={titles[document as Document]}>{content[document as Document]}</LegalLayout>;
}
