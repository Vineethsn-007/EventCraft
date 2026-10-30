import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import PlanTabs from '../components/PlanTabs';
import { buildFallbackPlan } from '../lib/fallback';
import type { PlanRequest } from '../types/plan';

const request: PlanRequest = {
  eventType: 'BIRTHDAY',
  eventName: 'Mira at 5',
  date: '2099-08-20',
  guestCount: 30,
  budget: 50_000,
  city: 'Kochi',
  theme: 'unicorns',
  notes: '',
};

describe('PlanTabs (ARIA tabs pattern)', () => {
  it('renders four tabs with roles and panels, Budget active first', () => {
    render(<PlanTabs plan={buildFallbackPlan(request)} />);

    for (const key of ['budget', 'timeline', 'vendors', 'ideas']) {
      expect(screen.getByRole('tab', { name: new RegExp(key, 'i') })).toBeInTheDocument();
    }
    const activeTab = screen.getByRole('tab', { name: /budget/i });
    expect(activeTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(/budget/i);
    expect(screen.getByRole('table', { hidden: true })).toBeInTheDocument();
  });

  it('shows only the active panel on click', async () => {
    const user = userEvent.setup();
    render(<PlanTabs plan={buildFallbackPlan(request)} />);

    await user.click(screen.getByRole('tab', { name: /ideas/i }));
    expect(screen.getByText(/5 personalized ideas/i)).toBeInTheDocument();
    expect(screen.queryByText(/Budget breakdown/i)).not.toBeInTheDocument();
  });

  it('supports arrow-key navigation through the tabs', async () => {
    const user = userEvent.setup();
    render(<PlanTabs plan={buildFallbackPlan(request)} />);

    const budget = screen.getByRole('tab', { name: /budget/i });
    budget.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /timeline/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /timeline/i })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /ideas/i })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowRight}'); // wraps back to budget
    expect(screen.getByRole('tab', { name: /budget/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('supports Home/End navigation', async () => {
    const user = userEvent.setup();
    render(<PlanTabs plan={buildFallbackPlan(request)} />);

    screen.getByRole('tab', { name: /budget/i }).focus();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: /ideas/i })).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: /budget/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders the vendor checklist inside its tab with progress bar', async () => {
    const user = userEvent.setup();
    render(<PlanTabs plan={buildFallbackPlan(request)} />);

    await user.click(screen.getByRole('tab', { name: /vendors/i }));
    expect(screen.getByTestId('checklist-progressbar')).toBeInTheDocument();
  });
});
