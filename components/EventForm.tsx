'use client';

import { useState, type FormEvent } from 'react';
import { EVENT_TYPES, type EventType } from '../types/plan';
import { LIMITS, generateFormSchema } from '../lib/schema';

export interface FormValues {
  eventType: EventType;
  eventName: string;
  date: string;
  guestCount: string;
  budget: string;
  city: string;
  theme: string;
  notes: string;
}

/** Subset of zod issues keyed by the input they belong to. */
export type FormErrors = Partial<Record<keyof FormValues, string>>;

const MIN_DATE_BUFFER_DAYS = 0;

function defaultDate(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 30);
  return d.toISOString().slice(0, 10);
}

export const DEFAULT_FORM: FormValues = {
  eventType: 'WEDDING',
  eventName: '',
  date: defaultDate(),
  guestCount: '100',
  budget: '300000',
  city: '',
  theme: '',
  notes: '',
};

interface EventFormProps {
  values: FormValues;
  onChange: (values: FormValues) => void;
  /** Called after successful client-side validation. */
  onSubmit: (values: FormValues) => void;
  disabled?: boolean;
}

function toDateInputMin(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + MIN_DATE_BUFFER_DAYS);
  return d.toISOString().slice(0, 10);
}

/**
 * Typed conversion of free text form fields into the request's numeric fields.
 * Returns a discriminated result so callers can show a safe message instead of
 * trusting Number() coercion.
 */
export function parseFormValues(values: FormValues): { ok: boolean; errors: FormErrors } {
  const candidate = {
    eventType: values.eventType,
    eventName: values.eventName,
    date: values.date,
    guestCount: Number(values.guestCount),
    budget: Number(values.budget),
    city: values.city,
    theme: values.theme,
    notes: values.notes,
  };
  const parsed = generateFormSchema.safeParse(candidate);
  if (parsed.success) return { ok: true, errors: {} };
  const errors: FormErrors = {};
  for (const issue of parsed.error.issues) {
    const asKey = issue.path[0];
    if (typeof asKey === 'string' && !(asKey in errors)) {
      errors[asKey as keyof FormErrors] = issue.message;
    }
  }
  return { ok: false, errors };
}

/** Event details form. Every control has a visible <label>; errors are
 * aria-describedby-linked and announced via role="alert". */
export default function EventForm({ values, onChange, onSubmit, disabled = false }: EventFormProps) {
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = parseFormValues(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    onSubmit(values);
  }

  const fieldClass =
    'mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-600 disabled:bg-slate-100';
  const labelClass = 'block text-sm font-medium text-slate-800';

  function errorMarkup(id: keyof FormValues, message?: string) {
    if (!message) return null;
    return (
      <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-medium text-red-700">
        {message}
      </p>
    );
  }

  function describedBy(id: keyof FormValues): string | undefined {
    return errors[id] ? `${id}-error` : undefined;
  }

  return (
    <form
      noValidate // our zod errors (role="alert", aria-describedby) stay the single source of truth
      onSubmit={handleSubmit}
      className="no-print rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-lg font-semibold">Tell us about your event</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="eventType" className={labelClass}>
            Event type
          </label>
          <select
            id="eventType"
            name="eventType"
            value={values.eventType}
            onChange={(e) => onChange({ ...values, eventType: e.target.value as EventType })}
            className={fieldClass}
            disabled={disabled}
          >
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          {errorMarkup('eventType', errors.eventType)}
        </div>

        <div>
          <label htmlFor="eventName" className={labelClass}>
            Event name
          </label>
          <input
            id="eventName"
            name="eventName"
            type="text"
            value={values.eventName}
            maxLength={LIMITS.eventName}
            placeholder="e.g. Sharma–Iyer Wedding"
            onChange={(e) => onChange({ ...values, eventName: e.target.value })}
            className={fieldClass}
            aria-describedby={describedBy('eventName')}
            aria-invalid={Boolean(errors.eventName) || undefined}
            disabled={disabled}
          />
          {errorMarkup('eventName', errors.eventName)}
        </div>

        <div>
          <label htmlFor="date" className={labelClass}>
            Event date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            min={toDateInputMin()}
            value={values.date}
            onChange={(e) => onChange({ ...values, date: e.target.value })}
            className={fieldClass}
            aria-describedby={describedBy('date')}
            aria-invalid={Boolean(errors.date) || undefined}
            disabled={disabled}
          />
          {errorMarkup('date', errors.date)}
        </div>

        <div>
          <label htmlFor="guestCount" className={labelClass}>
            Guest count
          </label>
          <input
            id="guestCount"
            name="guestCount"
            type="number"
            min={1}
            max={LIMITS.maxGuests}
            value={values.guestCount}
            onChange={(e) => onChange({ ...values, guestCount: e.target.value })}
            className={fieldClass}
            aria-describedby={describedBy('guestCount')}
            aria-invalid={Boolean(errors.guestCount) || undefined}
            disabled={disabled}
          />
          {errorMarkup('guestCount', errors.guestCount)}
        </div>

        <div>
          <label htmlFor="budget" className={labelClass}>
            Total budget (INR)
          </label>
          <input
            id="budget"
            name="budget"
            type="number"
            min={LIMITS.minBudget}
            max={LIMITS.maxBudget}
            step={1000}
            value={values.budget}
            onChange={(e) => onChange({ ...values, budget: e.target.value })}
            className={fieldClass}
            aria-describedby={describedBy('budget')}
            aria-invalid={Boolean(errors.budget) || undefined}
            disabled={disabled}
          />
          {errorMarkup('budget', errors.budget)}
        </div>

        <div>
          <label htmlFor="city" className={labelClass}>
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            value={values.city}
            maxLength={LIMITS.city}
            placeholder="e.g. Bengaluru"
            onChange={(e) => onChange({ ...values, city: e.target.value })}
            className={fieldClass}
            aria-describedby={describedBy('city')}
            aria-invalid={Boolean(errors.city) || undefined}
            disabled={disabled}
          />
          {errorMarkup('city', errors.city)}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="theme" className={labelClass}>
            Theme / vibe <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="theme"
            name="theme"
            type="text"
            value={values.theme}
            maxLength={LIMITS.theme}
            placeholder="e.g. pastel floral, retro disco, eco-friendly"
            onChange={(e) => onChange({ ...values, theme: e.target.value })}
            className={fieldClass}
            aria-describedby={describedBy('theme')}
            disabled={disabled}
          />
          {errorMarkup('theme', errors.theme)}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="notes" className={labelClass}>
            Special notes <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={values.notes}
            maxLength={LIMITS.notes}
            placeholder="e.g. elders need step-free access; vegetarian menu only"
            onChange={(e) => onChange({ ...values, notes: e.target.value })}
            className={fieldClass}
            aria-describedby={describedBy('notes')}
            disabled={disabled}
          />
          {errorMarkup('notes', errors.notes)}
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="mt-4 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        data-testid="generate-button"
      >
        {disabled ? 'Generating…' : '✨ Generate Plan'}
      </button>
    </form>
  );
}
