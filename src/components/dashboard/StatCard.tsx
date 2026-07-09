interface StatCardProps {
  label: string
  value: string | undefined
  sub?: string
  highlight?: boolean
  loading?: boolean
}

export function StatCard({ label, value, sub, highlight, loading }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${
      highlight
        ? 'border-brand-200 bg-brand-50'
        : 'border-bone-200 bg-bone-50'
    }`}>
      <div className="text-xs font-medium text-bone-500 uppercase tracking-wide mb-1.5">{label}</div>
      {loading || value === undefined ? (
        <div className="h-7 w-24 rounded bg-bone-100 animate-pulse" />
      ) : (
        <div className={`text-xl font-bold tabular-nums ${highlight ? 'text-brand-700' : 'text-bone-950'}`}>
          {value}
        </div>
      )}
      {sub && <div className="mt-1 text-xs text-bone-500">{sub}</div>}
    </div>
  )
}
