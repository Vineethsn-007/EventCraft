import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import EventForm, { DEFAULT_FORM, type FormValues } from '../components/EventForm';

// Real Planner holds the state; mirror that here so controlled inputs update.
function Harness({ onSubmit }: { onSubmit: (values: FormValues) => void }) {
  const [values, setValues] = useState<FormValues>(DEFAULT_FORM);
  return <EventForm values={values} onChange={setValues} onSubmit={onSubmit} />;
}

describe('EventForm', () => {
  it('renders a visible label for every input', () => {
    render(<Harness onSubmit={vi.fn()} />);
    expect(screen.getByLabelText('Event type')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Event name/)).toBeInTheDocument();
    expect(screen.getByLabelText('Event date')).toBeInTheDocument();
    expect(screen.getByLabelText('Guest count')).toBeInTheDocument();
    expect(screen.getByLabelText('Total budget (INR)')).toBeInTheDocument();
    expect(screen.getByLabelText(/City/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Theme \/ vibe/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Special notes/)).toBeInTheDocument();
  });

  it('shows role="alert" errors linked via aria-describedby for an empty submit', async () => {
    const user = userEvent.setup();
    render(<Harness onSubmit={vi.fn()} />);

    await user.clear(screen.getByLabelText(/^Event name/));
    await user.clear(screen.getByLabelText(/City/));

    await user.click(screen.getByTestId('generate-button'));

    expect(screen.getByText(/Event name must be at least 2 characters/)).toBeInTheDocument();
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThanOrEqual(2);
    const input = screen.getByLabelText(/^Event name/);
    expect(input).toHaveAttribute('aria-describedby', 'eventName-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('calls onSubmit with the typed values once the form is valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText(/^Event name/));
    await user.type(screen.getByLabelText(/^Event name/), 'Priya turns 30');
    await user.clear(screen.getByLabelText(/City/));
    await user.type(screen.getByLabelText(/City/), 'Mumbai');
    await user.click(screen.getByTestId('generate-button'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ eventName: 'Priya turns 30', city: 'Mumbai' });
  });

  it('rejects a past date before submitting', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText('Event date'));
    await user.type(screen.getByLabelText('Event date'), '2020-01-01');
    await user.clear(screen.getByLabelText(/^Event name/));
    await user.type(screen.getByLabelText(/^Event name/), 'Retro party');
    await user.clear(screen.getByLabelText(/City/));
    await user.type(screen.getByLabelText(/City/), 'Delhi');
    await user.click(screen.getByTestId('generate-button'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByRole('alert').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByLabelText('Event date')).toHaveAttribute('aria-invalid', 'true');
  });

  it('rejects a zero guest count with an alert', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText(/^Event name/));
    await user.type(screen.getByLabelText(/^Event name/), 'Small gathering');
    await user.clear(screen.getByLabelText(/City/));
    await user.type(screen.getByLabelText(/City/), 'Goa');
    await user.clear(screen.getByLabelText('Guest count'));
    await user.type(screen.getByLabelText('Guest count'), '0');
    await user.click(screen.getByTestId('generate-button'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Guest count must be at least 1/)).toBeInTheDocument();
  });

  it('is disabled while a plan is generating', () => {
    render(<EventForm values={DEFAULT_FORM} onChange={vi.fn()} onSubmit={vi.fn()} disabled />);
    expect(screen.getByTestId('generate-button')).toBeDisabled();
  });
});
