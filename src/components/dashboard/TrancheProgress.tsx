import { useTranches } from '../../hooks/useTranches'
import { formatAsset, formatSeats } from '../../lib/format'

interface Props {
  totalSupply: bigint | undefined
  trancheCount: bigint | undefined
  assetDecimals?: number
}

export function TrancheProgress({ totalSupply, trancheCount, assetDecimals = 6 }: Props) {
  const { tranches, isLoading } = useTranches(trancheCount)

  if (isLoading || tranches.length === 0) {
    return <div className="h-20 rounded-xl bg-bone-100 dark:bg-bone-900 animate-pulse" />
  }

  const cap = tranches[tranches.length - 1]?.upperBound ?? 0n
  const sold = totalSupply ?? 0n

  // Find current tranche index
  let currentIdx = 0
  for (let i = 0; i < tranches.length; i++) {
    if (sold < tranches[i].upperBound) { currentIdx = i; break }
    if (i === tranches.length - 1) currentIdx = i
  }

  return (
    <div className="rounded-xl border border-bone-200 dark:border-bone-800 bg-bone-50 dark:bg-bone-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-bone-500 dark:text-bone-400 uppercase tracking-wide">Tranche Progress</span>
        <span className="text-xs text-bone-400 dark:text-bone-500">
          {formatSeats(sold)} / {formatSeats(cap)} seats
        </span>
      </div>

      {/* Segmented bar */}
      <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden mb-3">
        {tranches.map((t, i) => {
          const start = i === 0 ? 0n : tranches[i - 1].upperBound
          const width = Number(((t.upperBound - start) * 1000n) / cap) / 10
          const filled = sold >= t.upperBound
          const partial = !filled && sold > start
          const pct = partial ? Number(((sold - start) * 100n) / (t.upperBound - start)) : 0

          return (
            <div
              key={i}
              className="relative rounded-sm overflow-hidden bg-bone-200 dark:bg-bone-700"
              style={{ width: `${width}%` }}
            >
              {filled && <div className="absolute inset-0 bg-moss-500" />}
              {partial && (
                <div className="absolute inset-y-0 left-0 bg-moss-500" style={{ width: `${pct}%` }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Tranche labels */}
      <div className="flex gap-2 flex-wrap">
        {tranches.map((t, i) => (
          <div key={i} className={`flex items-center gap-1.5 text-xs ${i === currentIdx ? 'text-moss-600 dark:text-moss-400 font-semibold' : 'text-bone-400 dark:text-bone-500'}`}>
            <span className={`w-2 h-2 rounded-full ${i < currentIdx ? 'bg-moss-500' : i === currentIdx ? 'bg-moss-400' : 'bg-bone-300 dark:bg-bone-600'}`} />
            T{i + 1} · {formatAsset(t.pricePerSeat, assetDecimals, '')}
            {i === currentIdx && <span className="text-[10px] bg-moss-100 dark:bg-moss-900/50 text-moss-600 dark:text-moss-400 px-1 rounded">current</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
