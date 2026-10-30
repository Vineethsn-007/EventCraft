import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'EventCraft AI — Celebration & Event Planner',
    template: '%s — EventCraft AI',
  },
  description:
    'GenAI-powered planning for weddings, birthdays and community events: budgets, timelines, vendor checklists and personalized ideas.',
  applicationName: 'EventCraft AI',
  openGraph: {
    title: 'EventCraft AI — Celebration & Event Planner',
    description:
      'Turn a few details into a full event plan in seconds: budgets, timelines, vendor checklists and personalized ideas.',
    type: 'website',
    siteName: 'EventCraft AI',
  },
  twitter: {
    card: 'summary',
    title: 'EventCraft AI — Celebration & Event Planner',
    description:
      'Turn a few details into a full event plan in seconds: budgets, timelines, vendor checklists and personalized ideas.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0F1115' },
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
  ],
};

// Applies the stored light/dark choice before first paint (no flash).
// CSP allows inline scripts ('unsafe-inline' in script-src).
const themeInit = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <a href="#main-content" className="skip-link no-print">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}