import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileMenu } from '@/components/MobileMenu';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ======================================================================
       Sticky glass navbar
       ====================================================================== */}
      <nav className="sticky top-0 left-0 right-0 z-50 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-6">
          <Link href="/" className="font-semibold tracking-wider text-xl">
            EventCraft AI
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/planner" className="text-muted-foreground hover:text-foreground transition-colors">
              Plan Your Event
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <MobileMenu />
          </div>
        </div>
      </nav>

      <main id="main-content">

      {/* ======================================================================
       Hero Section
       ====================================================================== */}
      <section className="relative pt-12 pb-8 md:pt-20 md:pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center">
            <h1 className="font-semibold tracking-wider text-4xl md:text-5xl mb-4">
              Turn a few details into a full event plan in seconds
            </h1>
            <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
              Share your event type, guest count, budget, and vision — and let AI
              generate a complete plan with budget breakdown, timeline, and vendor
              checklists.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/planner" className="btn btn-primary">
                Plan my event
              </Link>
            </div>
          </div>
        </div>

      {/* Animated line-art hero (SVG confetti/bunting). Sits BEHIND the text
           and is stroke-only low-opacity so it never covers the headline. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-30">
          <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
            <g fill="none" stroke="var(--primary)" strokeWidth={1.5} strokeLinecap="round">
              <path d="M140 120 L220 165 L300 120 L380 165 L460 120 L540 165 L620 120 L700 165" />
              <path d="M240 70 L320 115 L400 70 L480 115 L560 70 L640 115" />
              <path d="M60 240 Q160 120 260 240 Q360 120 460 240 Q560 120 660 240" />
            </g>
            <g fill="var(--primary)">
              <circle cx="120" cy="90" r="4" />
              <circle cx="230" cy="40" r="3" />
              <circle cx="420" cy="55" r="4" />
              <circle cx="640" cy="45" r="3" />
              <circle cx="740" cy="130" r="4" />
              <circle cx="720" cy="250" r="3" />
              <circle cx="90" cy="310" r="3" />
            </g>
          </svg>
        </div>
      </section>

      {/* ======================================================================
       How It Works Section
       ====================================================================== */}
      <section id="how-it-works" className="py-24 md:py-32 bg-[var(--bg-elevated)]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center section-header mb-8">
            <h2 className="font-semibold tracking-wider text-3xl mb-3">
              How It Works
            </h2>
            <div className="line" />
            <ol className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:justify-center">
              <li>
                <div className="px-6 py-8 rounded-xl border-[var(--border)] transition-all hover:border-[var(--primary)]">
                  <div className="text-5xl font-bold text-[var(--primary)]">1</div>
                  <h3 className="mt-3 text-lg font-medium">Tell us about your event</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Share event type, date, budget, guest count, city, theme, and special notes.
                  </p>
                </div>
              </li>
              <li>
                <div className="px-6 py-8 rounded-xl border-[var(--border)] transition-all hover:border-[var(--primary)]">
                  <div className="text-5xl font-bold text-[var(--primary)]">2</div>
                  <h3 className="mt-3 text-lg font-medium">AI builds your plan</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    One Groq call generates budget categories with percentages and tips, a
                    backward-timeline, vendor checklists, and 5 personalized ideas.
                  </p>
                </div>
              </li>
              <li>
                <div className="px-6 py-8 rounded-xl border-[var(--border)] transition-all hover:border-[var(--primary)]">
                  <div className="text-5xl font-bold text-[var(--primary)]">3</div>
                  <h3 className="mt-3 text-lg font-medium">Refine and export</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Chat with AI to adjust the plan, toggle vendor checkboxes, copy as text
                    or print/save PDF.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* ======================================================================
       Bento Grid Section
       ====================================================================== */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center section-header mb-10">
            <h2 className="font-semibold tracking-wider text-3xl mb-3">
              What You Get
            </h2>
            <div className="line" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/planner?type=wedding" className="tile cursor-pointer group" aria-label="Smart Budget tile">
              <div className="text-sm font-medium uppercase tracking-wider text-[var(--rose)] mb-2">Smart Budget</div>
              <svg className="w-6 h-6 mx-auto mb-2 group-hover:fill-[var(--primary)] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M4 20h16M7 16v-4M12 16V9M17 16V5" />
              </svg>
              <p className="text-xs text-muted-foreground mt-2">Budget categories with percentages and tips, amounts summing exactly to your total.</p>
            </Link>

            <Link href="/planner?type=birthday" className="tile cursor-pointer group" aria-label="Timeline tile">
              <div className="text-sm font-medium uppercase tracking-wider text-[var(--amber)] mb-2">Timeline</div>
              <svg className="w-6 h-6 mx-auto mb-2 group-hover:fill-[var(--primary)] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M4 6h16v14H4V6Zm0 5h16M9 3v6M15 3v6" />
              </svg>
              <p className="text-xs text-muted-foreground mt-2">Milestones working backward from your event date, with dated checkpoints.</p>
            </Link>

            <Link href="/planner?type=community" className="tile cursor-pointer group" aria-label="Vendor Checklist tile">
              <div className="text-sm font-medium uppercase tracking-wider text-[var(--teal)] mb-2">Vendor Checklist</div>
              <svg className="w-6 h-6 mx-auto mb-2 group-hover:fill-[var(--primary)] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M4 5h16v14H4V5Zm4 6l2.5 2.5L14.5 9" />
              </svg>
              <p className="text-xs text-muted-foreground mt-2">Interactive vendor checklist with tick state saved in localStorage and progress bar.</p>
            </Link>

            <Link href="/planner?type=other" className="tile cursor-pointer group" aria-label="Personalized Ideas tile">
              <div className="text-sm font-medium uppercase tracking-wider text-[var(--primary)] mb-2">Personalized Ideas</div>
              <svg className="w-6 h-6 mx-auto mb-2 group-hover:fill-[var(--primary)] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M12 3a6 6 0 0 1 6 6c0 2.4-1.3 3.5-2.2 4.7-.5.7-.8 1.4-.8 2.3h-6c0-.9-.3-1.6-.8-2.3C7.3 12.5 6 11.4 6 9a6 6 0 0 1 6-6ZM9.5 19h5M10.5 21.5h3" />
              </svg>
              <p className="text-xs text-muted-foreground mt-2">5 personalized ideas for theme, activities, and food, tailored to your event.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================================
       Event Types Section
       ====================================================================== */}
      <section id="event-types" className="py-24 md:py-32 bg-[var(--bg-elevated)]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center section-header mb-10">
            <h2 className="font-semibold tracking-wider text-3xl mb-3">
              Event Types
            </h2>
            <div className="line" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/planner?type=wedding" className="tile p-8 flex flex-col items-center justify-end group-hover:translate-y-2 transition-transform" aria-label="Wedding event type">
              <svg className="w-12 h-12 mb-3 stroke-[var(--rose)] group-hover:stroke-[var(--primary)] transition-colors" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21s-7.2-4.5-9.6-8.8A5.4 5.4 0 0 1 12 6.7a5.4 5.4 0 0 1 9.6 5.5C19.2 16.5 12 21 12 21Z" />
              </svg>
              <h3 className="mt-3 text-lg font-medium">Wedding</h3>
            </Link>

            <Link href="/planner?type=birthday" className="tile p-8 flex flex-col items-center justify-end group-hover:translate-y-2 transition-transform" aria-label="Birthday event type">
              <svg className="w-12 h-12 mb-3 stroke-[var(--amber)] group-hover:stroke-[var(--primary)] transition-colors" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 20h16M6 20v-6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6M12 12V9m0-3.2a1.4 1.4 0 1 0-1.4-2.3c-.7.9 1.4 2.3 1.4 2.3Z" />
              </svg>
              <h3 className="mt-3 text-lg font-medium">Birthday</h3>
            </Link>

            <Link href="/planner?type=community" className="tile p-8 flex flex-col items-center justify-end group-hover:translate-y-2 transition-transform" aria-label="Community event type">
              <svg className="w-12 h-12 mb-3 stroke-[var(--teal)] group-hover:stroke-[var(--primary)] transition-colors" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM3 20c0-3 2.7-5 6-5s6 2 6 5m1.8-4.6c2.2.5 3.7 2 3.7 4.6" />
              </svg>
              <h3 className="mt-3 text-lg font-medium">Community</h3>
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================================
       Live Sample Preview Section
       ====================================================================== */}
      <section id="live-sample" className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center section-header mb-10">
            <h2 className="font-semibold tracking-wider text-3xl mb-3">
              Live Sample Preview
            </h2>
            <div className="line" />
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              See a full generated plan using demo mode — no API key needed. Experience
              the budget breakdown, timeline, and vendor checklist as they appear in the
              planner.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border-[var(--border)] p-6">
              <h3 className="text-sm font-medium uppercase tracking-wider text-[var(--rose)] mb-2">Budget Breakdown</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Venue</span>
                  <span>₹2,10,000 (42%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--rose)]">Catering</span>
                  <span>₹1,80,000 (36%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--teal)]">Decor</span>
                  <span>₹60,000 (12%)</span>
                </div>
                <span className="font-medium text-[var(--primary)] mt-2">Amounts sum exactly to ₹5,00,000</span>
              </div>
            </div>

            <div className="rounded-xl border-[var(--border)] p-6">
              <h3 className="text-sm font-medium uppercase tracking-wider text-[var(--amber)] mb-2">Timeline</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span>30 days before</span><span>Book venue</span></li>
                <li className="flex justify-between"><span>14 days before</span><span>Finalize catering</span></li>
                <li className="flex justify-between"><span>7 days before</span><span>Send invitations</span></li>
                <li className="flex justify-between"><span>Event day</span><span>Celebrate!</span></li>
              </ul>
            </div>

            <div className="rounded-xl border-[var(--border)] p-6">
              <h3 className="text-sm font-medium uppercase tracking-wider text-[var(--teal)] mb-2">Vendor Checklist</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-3">
                  <input type="checkbox" className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)] mt-0.5" defaultChecked aria-label="Venue capacity question" disabled />
                  <span>Venue capacity for 200+ guests?</span>
                </li>
                <li className="flex items-start gap-3">
                  <input type="checkbox" className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)] mt-0.5" defaultChecked aria-label="Catering per-plate question" disabled />
                  <span>Per-plate price includes service?</span>
                </li>
              </ul>
              <div className="mt-3 text-xs text-muted-foreground">2 of 2 done (100%)</div>
            </div>

            <div className="rounded-xl border-[var(--border)] p-6">
              <h3 className="text-sm font-medium uppercase tracking-wider text-[var(--primary)] mb-2">Personalized Ideas</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-3">
                  <span className="mr-1" aria-hidden="true">🍽️</span>
                  <span><strong>Theme color story</strong> — Carry one theme colour plus gold or white through invitations, table linen, and the entry arch for a cohesive look.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mr-1" aria-hidden="true">🎪</span>
                  <span><strong>Memory lane wall</strong> — Pin photos and notes about the couple near the entrance; guests add wishes as they arrive.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================================
       FAQ Accordion Section
       ====================================================================== */}
      <section id="faq" className="py-24 md:py-32 bg-[var(--bg-elevated)]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center section-header mb-10">
            <h2 className="font-semibold tracking-wider text-3xl mb-3">
              Frequently Asked Questions
            </h2>
            <div className="line" />
          </div>

          <div className="space-y-3">
            <details className="group">
              <summary className="cursor-pointer flex items-center justify-between py-3 px-0 text-lg font-medium text-foreground">
                Are the AI suggestions accurate?
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div className="p-3 mt-2 bg-[var(--bg-soft)] rounded-lg border border-[var(--border)]">
                <p className="text-sm text-muted-foreground">AI suggestions are estimates based on your inputs. Always verify vendor prices and contracts directly. Demo mode uses deterministic templates computed from your data.</p>
              </div>
            </details>

            <details className="group">
              <summary className="cursor-pointer flex items-center justify-between py-3 px-0 text-lg font-medium text-foreground">
                What happens without a Groq API key?
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div className="p-3 mt-2 bg-[var(--bg-soft)] rounded-lg border border-[var(--border)]">
                <p className="text-sm text-muted-foreground">The app runs in deterministic demo mode, computing a full sample plan from your inputs. No data is sent anywhere, and the plan is identical for the same inputs every time.</p>
              </div>
            </details>

            <details className="group">
              <summary className="cursor-pointer flex items-center justify-between py-3 px-0 text-lg font-medium text-foreground">
                Can I export my plan?
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div className="p-3 mt-2 bg-[var(--bg-soft)] rounded-lg border border-[var(--border)]">
                <p className="text-sm text-muted-foreground">Yes — Copy as text or Print / Save PDF. The print stylesheet forces a light background, hides navigation and chat, and lays out all plan sections clearly.</p>
              </div>
            </details>

            <details className="group">
              <summary className="cursor-pointer flex items-center justify-between py-3 px-0 text-lg font-medium text-foreground">
                Which events are supported?
                <svg className="w-4 h-4 transition-transform group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div className="p-3 mt-2 bg-[var(--bg-soft)] rounded-lg border border-[var(--border)]">
                <p className="text-sm text-muted-foreground">Wedding, Birthday, Community, and Other. Each event type has tailored budget categories, timeline milestones, vendor questions, and personalized ideas.</p>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ======================================================================
       Closing CTA Band
       ====================================================================== */}
      <section className="py-16 md:py-24" style={{ background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-elevated) 100%)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="relative pt-px" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-center text-xl font-semibold tracking-wider text-[var(--primary)] mb-2">Ready to plan your next event?</h2>
            <p className="text-center text-sm text-muted-foreground mb-8 max-w-xl mx-auto">Share a few details and get a complete AI-powered plan in seconds.</p>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link href="/planner" className="btn btn-primary w-full md:w-auto">Start Planning</Link>
            <Link href="/planner?type=wedding" className="btn btn-ghost w-full md:w-auto">See Wedding Plan Example</Link>
          </div>
        </div>
      </section>
      </main>

      {/* ======================================================================
       Footer
       ====================================================================== */}
      <footer className="py-8 bg-[var(--bg)] text-[var(--muted-soft)]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8">
            <div>
              <h4 className="font-medium text-foreground mb-3">EventCraft AI</h4>
              <p className="text-sm">AI-powered celebration and event planner — budgets, timelines, vendor checklists, and personalized ideas.</p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/planner" className="hover:text-foreground transition-colors">Planner</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-3">Event Types</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/planner?type=wedding" className="hover:text-foreground transition-colors">Wedding</a></li>
                <li><a href="/planner?type=birthday" className="hover:text-foreground transition-colors">Birthday</a></li>
                <li><a href="/planner?type=community" className="hover:text-foreground transition-colors">Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Press</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center gap-4">
            <p className="text-sm">AI suggestions are estimates; verify vendor prices and contracts.</p>
            <span className="text-xs">Powered by Groq · Llama 3.3 · EventCraft AI · Hackathon Project</span>
          </div>
        </div>
      </footer>
    </div>
  );
}