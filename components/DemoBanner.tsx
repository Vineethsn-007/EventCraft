interface DemoBannerProps {
  reason: string;
}

/** Amber "Demo mode" notice; `role="status"` so screen readers announce it. */
export default function DemoBanner({ reason }: DemoBannerProps) {
  return (
    <div
      role="status"
      data-testid="demo-banner"
      className="mb-4 rounded-lg border border-amber-300 bg-amber-100 px-4 py-3 text-sm text-slate-900"
    >
      <span className="font-bold">Demo mode:</span> <span>{reason}</span>
    </div>
  );
}
