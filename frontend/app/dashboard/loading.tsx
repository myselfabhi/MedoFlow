import { MedoflowLoader } from '@/components/common/MedoflowLoader'

// Scoped to the dashboard subtree so the sidebar doesn't flash; we render
// just the mark + wordmark inside the main content area.
export default function DashboardLoading() {
  return (
    <div
      className="flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <MedoflowLoader size="xl" tone="brand" label="Loading dashboard" />
      <div className="text-center">
        <p className="mf-display text-[16px] text-navy">Medoflow</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          Accessing clinic module
        </p>
      </div>
    </div>
  )
}
