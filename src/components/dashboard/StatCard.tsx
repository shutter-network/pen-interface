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
        ? 'border-moss-200 dark:border-moss-800 bg-moss-50 dark:bg-moss-950/40'
        : 'border-bone-200 dark:border-bone-800 bg-bone-50 dark:bg-bone-900'
    }`}>
      <div className="text-xs font-medium text-bone-500 dark:text-bone-400 uppercase tracking-wide mb-1.5">{label}</div>
      {loading || value === undefined ? (
        <div className="h-7 w-24 rounded bg-bone-200 dark:bg-bone-800 animate-pulse" />
      ) : (
        <div className={`text-xl font-bold tabular-nums ${highlight ? 'text-moss-600 dark:text-moss-400' : 'text-bone-900 dark:text-white'}`}>
          {value}
        </div>
      )}
      {sub && <div className="mt-1 text-xs text-bone-400 dark:text-bone-500">{sub}</div>}
    </div>
  )
}
