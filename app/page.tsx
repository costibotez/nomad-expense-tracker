import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Globe2, LockKeyhole, Map, Plus, ReceiptText } from "lucide-react";
import { CookieNotice, CookiePreferences } from "@/components/cookie-notice";
import { TripCard } from "@/components/ui";
import { routes } from "@/lib/routes";
import dashboard from "@/docs/screenshots/dashboard.png";
import add from "@/docs/screenshots/add.png";
import trip from "@/docs/screenshots/trip.png";

const features = [
  { icon: Plus, number: "01", title: "Add it and get back out there.", text: "Log what you spent in the currency you paid. The date picks the right trip leg, and the app works out the euro equivalent.", image: add, alt: "The add expense screen with amount, currency and categories" },
  { icon: ReceiptText, number: "02", title: "See the whole journey clearly.", text: "From a morning coffee to a flight across the world, see your spending by country, category, month or trip leg.", image: dashboard, alt: "The overview screen showing the trip card and spending totals" },
  { icon: Map, number: "03", title: "Make room for a change of plans.", text: "Build your itinerary one leg at a time. Update dates and destinations as you go, and keep the story of your trip together.", image: trip, alt: "The trip screen showing itinerary legs" },
];

export default function HomePage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <Link href="/" className="landing-logo" aria-label="Nomad Expenses home"><span className="logo-mark">N<span>✳</span></span><span>nomad<br />expenses</span></Link>
        <nav aria-label="Main navigation" className="landing-nav"><a href="#how-it-works">How it works</a><a href="#features">Features</a><a href="#faq">FAQ</a></nav>
        <div className="landing-header-actions">
          <a className="landing-github" href="https://github.com/costibotez/nomad-expense-tracker" aria-label="View Nomad Expenses on GitHub">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="currentColor"><path d="M12 .297a12 12 0 0 0-3.794 23.386c.6.111.82-.26.82-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.839 1.237 1.839 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.776.418-1.305.762-1.605-2.665-.304-5.467-1.334-5.467-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.323 3.301 1.23a11.5 11.5 0 0 1 6.006 0c2.291-1.553 3.297-1.23 3.297-1.23.653 1.653.242 2.874.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.625-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .32.216.694.825.576A12.001 12.001 0 0 0 12 .297Z" /></svg>
            <span>GitHub</span>
          </a>
          <Link className="landing-nav-cta" href={routes.app}>Sign in <ArrowUpRight size={16} /></Link>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="status-dot" /> MADE FOR LIFE ON THE MOVE</p>
            <h1>More memories.<br /><span>Less money math.</span></h1>
            <p className="hero-description">A self-hosted expense tracker for trips across countries and currencies. Know what the whole adventure costs, on infrastructure you control.</p>
            <div className="hero-actions"><a className="landing-button" href="https://github.com/costibotez/nomad-expense-tracker#-quick-start-under-5-minutes">Get the tracker <ArrowRight size={18} /></a><a className="text-link" href="#how-it-works">See how it works <ArrowDown size={16} /></a></div>
            <p className="hero-note"><Check size={15} /> Free to self-host <span>·</span> Your trip, your data</p>
          </div>
          <div className="hero-visual" aria-label="Nomad Expenses app preview">
            <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
            <div className="hero-card"><TripCard label="Whole trip" name="Chiang Mai to Almaty" mark="EUR" markCaption="Every currency, one total" stacked /></div>
            <div className="hero-phone"><Image src={dashboard} alt="Nomad Expenses overview with trip totals" priority sizes="(max-width: 700px) 180px, 230px" /></div>
            <div className="floating-label"><Globe2 size={18} /><span>All your currencies<br /><strong>One clear picture</strong></span></div>
          </div>
          <div className="hero-bottom"><span>EXPLORE MORE</span><ArrowDown size={15} /><span className="hero-bottom-right">A LITTLE MORE CLARITY, WHEREVER YOU GO ↗</span></div>
        </section>
        <section id="how-it-works" className="intro-section section-wrap">
          <p className="eyebrow">THE BIG PICTURE</p>
          <div className="intro-grid"><h2>A long trip is full of numbers.<br /><span>It shouldn’t feel like homework.</span></h2><p>Different currencies, changing plans, little purchases that add up. Nomad Expenses brings it all together so you can spend less time calculating and more time experiencing.</p></div>
          <div className="problem-grid"><div><span>01 / THE SPENDING</span><h3>A little here.<br />A little there.</h3><p>Expenses happen everywhere. Capture them while they’re fresh.</p></div><div><span>02 / THE CURRENCIES</span><h3>Baht today.<br />Yen tomorrow.</h3><p>Keep the original amount and see it all in euro.</p></div><div><span>03 / THE QUESTION</span><h3>What did it<br />all add up to?</h3><p>Get an honest view of the whole trip, at a glance.</p></div></div>
        </section>
        <section id="features" className="features-section">
          <div className="section-wrap"><div className="features-heading"><div><p className="eyebrow">A BETTER WAY TO KEEP TRACK</p><h2>One trip. One place.<br /><span>All the details.</span></h2></div><p>Everything you need to understand your spending, without slowing down the journey.</p></div>
            {features.map(({ icon: Icon, number, title, text, image, alt }, index) => <article className={`feature-row ${index % 2 ? "feature-reverse" : ""}`} key={number}><div className="feature-copy"><span className="feature-icon"><Icon size={22} /></span><p className="eyebrow">{number} / {index === 0 ? "QUICK ENTRY" : index === 1 ? "THE OVERVIEW" : "YOUR ITINERARY"}</p><h3>{title}</h3><p>{text}</p><Link href={routes.app} className="feature-link">Open the app <ArrowUpRight size={16} /></Link></div><div className="feature-image"><div className="feature-image-label">NOMAD EXPENSES <span>✳</span></div><Image src={image} alt={alt} sizes="(max-width: 700px) 190px, 250px" /></div></article>)}
          </div>
        </section>
        <section className="privacy-section section-wrap"><div className="privacy-icon"><LockKeyhole size={25} /></div><div><p className="eyebrow">YOURS TO KEEP</p><h2>Your trip is personal.<br /><span>Your data should be too.</span></h2><p>A shared password protects your tracker. Your data lives in your own database, with no analytics or advertising trackers. Share a read-only overview only when you choose to.</p></div><Link href={routes.app} className="privacy-arrow" aria-label="Open the app"><ArrowUpRight size={26} /></Link></section>
        <section id="faq" className="faq-section section-wrap"><div><p className="eyebrow">GOOD TO KNOW</p><h2>A few things<br /><span>you might ask.</span></h2></div><div className="faq-list"><details><summary>How does currency conversion work?<span>+</span></summary><p>The app looks up the exchange rate for the date of each expense and saves it, so past totals stay consistent. You can also enter a rate manually.</p></details><details><summary>Can I share my trip?<span>+</span></summary><p>Yes. Create a read-only link from the Trip screen to share totals and charts without sharing individual expenses or notes.</p></details><details><summary>Can I use it on my phone?<span>+</span></summary><p>Yes. It is designed for mobile and can be added to your home screen for a full-screen experience.</p></details><details><summary>How do I access the tracker?<span>+</span></summary><p>The tracker uses one shared password configured by its owner. There are no individual user accounts.</p></details></div></section>
        <section className="final-cta"><p className="eyebrow">READY WHEN YOU ARE</p><h2>Go somewhere.<br /><span>We’ll keep count.</span></h2><p>Set up your own copy and take it wherever you go.</p><a className="landing-button landing-button-light" href="https://github.com/costibotez/nomad-expense-tracker#-quick-start-under-5-minutes">Get the tracker <ArrowRight size={18} /></a></section>
      </main>
      <footer className="landing-footer"><span>✳ &nbsp; NOMAD EXPENSES</span><span>Made by <a href="https://www.nomad-developer.co.uk/">Nomad Developer</a></span><div className="footer-links"><Link href="/legal/privacy">Privacy</Link><Link href="/legal/cookies">Cookies</Link><Link href="/legal/terms">Terms</Link><Link href="/legal/refunds">Refunds</Link><Link href="/legal/license">Licence</Link><Link href="/security">Security</Link><a href="mailto:contact@nomad-developer.co.uk">Contact</a><CookiePreferences /><a href="#">Back to top ↑</a></div></footer>
      <CookieNotice />
    </div>
  );
}
