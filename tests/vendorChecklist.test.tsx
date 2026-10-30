import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import VendorChecklist from '../components/VendorChecklist';
import type { VendorGroup } from '../types/plan';

const groups: VendorGroup[] = [
  { category: 'Venue', items: ['Capacity for 120?', 'Cancellation rules?'] },
  { category: 'Catering', items: ['Per-plate inclusive?'] },
];

describe('VendorChecklist', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders groups, items and a zero-progress bar initially', () => {
    render(<VendorChecklist groups={groups} planKey="test-plan" />);

    expect(screen.getByText('Venue')).toBeInTheDocument();
    expect(screen.getByText(/0 of 3 done/i)).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('ticks an item and updates progress and status text', async () => {
    const user = userEvent.setup();
    render(<VendorChecklist groups={groups} planKey="test-plan" />);

    const first = screen.getByTestId('vendor-check-0-0');
    expect(first).not.toBeChecked();
    await user.click(first);

    expect(first).toBeChecked();
    expect(screen.getByText(/1 of 3 done/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
  });

  it('persists ticks in localStorage and restores them', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<VendorChecklist groups={groups} planKey="test-plan" />);

    await user.click(screen.getByTestId('vendor-check-1-0'));
    expect(window.localStorage.getItem('eventcraft:checklist')).toContain('test-plan');

    unmount();
    render(<VendorChecklist groups={groups} planKey="test-plan" />);
    expect(screen.getByTestId('vendor-check-1-0')).toBeChecked();
    expect(screen.getByText(/1 of 3 done/i)).toBeInTheDocument();
  });

  it('scopes ticks per plan key (a new plan starts unticked)', async () => {
    const user = userEvent.setup();
    const firstPlan = render(<VendorChecklist groups={groups} planKey="plan-v1" />);
    await user.click(screen.getByTestId('vendor-check-0-0'));
    firstPlan.unmount();

    render(<VendorChecklist groups={groups} planKey="plan-v2" />);
    expect(screen.getByTestId('vendor-check-0-0')).not.toBeChecked();
  });

  it('unticking removes the item from progress', async () => {
    const user = userEvent.setup();
    render(<VendorChecklist groups={groups} planKey="test-plan" />);

    const checkbox = screen.getByTestId('vendor-check-0-1');
    await user.click(checkbox);
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(screen.getByText(/0 of 3 done/i)).toBeInTheDocument();
  });
});
