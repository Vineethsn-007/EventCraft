'use client';

import { useState, type FormEvent } from 'react';

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

interface RefineChatProps {
  messages: ChatMessage[];
  onSubmit: (refinement: string) => void;
  busy: boolean;
}

/** Follow-up chat: refinements are sent to /api/plan with the current plan as context. */
export default function RefineChat({ messages, onSubmit, busy }: RefineChatProps) {
  const [draft, setDraft] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (text.length < 2 || busy) return;
    onSubmit(text);
    setDraft('');
  }

  return (
    <section aria-label="Refine plan chat" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold">Refine the plan</h3>
      <p className="mt-1 text-xs text-slate-600">
        Ask for changes — e.g. “increase food budget”, “make it pet-friendly”, “add a sangeet evening”.
      </p>

      {messages.length > 0 && (
        <ul className="mt-3 space-y-2" data-testid="chat-history">
          {messages.map((message, index) => (
            <li
              key={index}
              className={`rounded-lg px-3 py-2 text-sm ${
                message.role === 'user' ? 'bg-brand-50 text-brand-800' : 'bg-slate-100 text-slate-800'
              }`}
            >
              <span className="mr-1 font-semibold">{message.role === 'user' ? 'You:' : 'AI:'}</span>
              {message.text}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-3 flex items-stretch gap-2">
        <label htmlFor="refinement" className="sr-only">
          Describe the change you want to the plan
        </label>
        <textarea
          id="refinement"
          rows={2}
          value={draft}
          maxLength={500}
          placeholder="e.g. Move 5% from Decor to Catering"
          onChange={(event) => setDraft(event.target.value)}
          disabled={busy}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-600"
        />
        <button
          type="submit"
          disabled={busy || draft.trim().length < 2}
          data-testid="refine-button"
          className="shrink-0 rounded-md bg-brand-600 px-4 text-sm font-semibold text-on-primary hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </section>
  );
}
