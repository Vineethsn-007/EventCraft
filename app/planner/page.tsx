import type { Metadata } from 'next';
import PlannerView from '@/components/PlannerView';

export const metadata: Metadata = {
  title: 'Plan Your Event',
  description:
    'Generate a complete event plan in seconds: budget breakdown, working-backward timeline, vendor checklist and personalized ideas.',
  openGraph: {
    title: 'EventCraft AI — Planner',
    description:
      'Budget, timeline, vendor checklist and personalized ideas for weddings, birthdays and community events.',
    type: 'website',
  },
};

/** `?type=wedding|birthday|community|other` prefills the event form. */
export default function PlannerPage({
  searchParams,
}: {
  searchParams?: { type?: string };
}) {
  return <PlannerView initialEventType={searchParams?.type} />;
}
