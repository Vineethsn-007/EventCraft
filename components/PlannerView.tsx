import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MobileMenu } from '@/components/MobileMenu';
import Planner from '@/components/Planner';

/**
 * Planner page shell: sticky header, main landmark hosting the live
 * Planner state machine (form → /api/plan → tabs → refine → export),
 * and the footer with disclaimer + hackathon credit.
 */
export default function PlannerView({ initialEventType }: { initialEventType?: string }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-semibold tracking-wider">
            EventCraft AI
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-muted transition-colors hover:text-foreground">
              Home
            </Link>
            <Link href="/#features" className="text-muted transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="/#faq" className="text-muted transition-colors hover:text-foreground">
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <MobileMenu />
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-7xl px-6 py-8">
        <Planner initialEventType={initialEventType} />
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--bg)] py-8 text-muted-soft">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-sm md:flex-row">
          <p>AI suggestions are estimates; verify vendor prices and contracts.</p>
          <span className="text-xs">Powered by Groq · Llama 3.3 · EventCraft AI · Hackathon Project</span>
        </div>
      </footer>
    </div>
  );
}
