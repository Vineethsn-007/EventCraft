import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DemoBanner from '../components/DemoBanner';

describe('DemoBanner', () => {
  it('shows the demo reason with a clear label and announces it politely', () => {
    render(<DemoBanner reason="GROQ_API_KEY is not configured on the server, so a deterministic sample plan is shown." />);

    const banner = screen.getByTestId('demo-banner');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Demo mode:');
    expect(banner).toHaveTextContent(/not configured/i);
    expect(banner).toHaveAttribute('role', 'status');
  });

  it('shows the AI-unavailable variant wording', () => {
    render(<DemoBanner reason="The AI planning service is unavailable right now, so a deterministic sample plan is shown." />);
    expect(screen.getByTestId('demo-banner')).toHaveTextContent(/unavailable/i);
  });
});
