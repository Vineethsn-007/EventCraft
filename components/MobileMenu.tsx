'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

const LINKS: { href: string; label: string }[] = [
  { href: '/', label: 'Home' },
  { href: '/planner', label: 'Planner' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#features', label: 'Features' },
];

/**
 * Hamburger button + slide-over navigation for small screens.
 * Accessible: aria-expanded/aria-controls, Escape closes, Tab is trapped
 * between the toggle button and the menu links while open.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const getFocusables = (): HTMLElement[] => {
      const panel = panelRef.current;
      const button = buttonRef.current;
      if (!panel) return button ? [button] : [];
      const inner = Array.from(
        panel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
      );
      return button ? [button, ...inner] : inner;
    };

    // Move focus into the menu when it opens.
    const items = getFocusables();
    (items[1] ?? items[0])?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusables = getFocusables();
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) return;
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !focusables.includes(active as HTMLElement)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        className="rounded-md p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setOpen((value) => !value)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {open ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {open && (
        <div
          id="mobile-menu"
          ref={panelRef}
          className="mobile-menu open"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <ul>
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={close}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}