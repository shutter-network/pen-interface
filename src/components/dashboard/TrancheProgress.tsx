import { useTranches } from '../../hooks/useTranches'
import { formatAsset, formatSeats } from '../../lib/format'

interface Props {
  totalSupply: bigint | undefined
  trancheCount: bigint | undefined
  assetDecimals?: number
  assetSymbol?: string
}

export function TrancheProgress({ totalSupply, trancheCount, assetDecimals = 6, assetSymbol = '' }: Props) {
  const { tranches, isLoading } = useTranches(trancheCount)

  if (isLoading || tranches.length === 0) {
    return <div className="h-20 rounded-xl bg-bone-50 animate-pulse" />
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
    <div className="rounded-xl border border-bone-200 bg-bone-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-bone-500 uppercase tracking-wide">Progress</span>
        <span className="text-xs text-bone-500">
          {formatSeats(sold)} / {formatSeats(cap)} SEATs
        </span>
      </div>

      {/* Segmented bar */}
      <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden mb-4">
        {tranches.map((t, i) => {
          const start = i === 0 ? 0n : tranches[i - 1].upperBound
          const width = Number(((t.upperBound - start) * 1000n) / cap) / 10
          const filled = sold >= t.upperBound
          const partial = !filled && sold > start
          const pct = partial ? Number(((sold - start) * 100n) / (t.upperBound - start)) : 0

          return (
            <div
              key={i}
              className="relative rounded-sm overflow-hidden bg-bone-200"
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

      {/* Per-tranche breakdown */}
      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 gap-y-1.5 text-xs">
        <div className="text-bone-500 uppercase tracking-wide font-medium">Tranche</div>
        <div />
        <div className="text-bone-500 uppercase tracking-wide font-medium text-right">SEATs</div>
        <div className="text-bone-500 uppercase tracking-wide font-medium text-right">Price / SEAT</div>

        {tranches.map((t, i) => {
          const start = i === 0 ? 0n : tranches[i - 1].upperBound
          const seatsInTranche = t.upperBound - start
          const isCurrent = i === currentIdx
          const isDone = sold >= t.upperBound
          const dotClass = isDone ? 'bg-moss-500' : isCurrent ? 'bg-moss-400' : 'bg-bone-300'
          const rowClass = isCurrent
            ? 'text-bone-950 font-semibold'
            : 'text-bone-500'

          return (
            <div key={i} className={`contents ${rowClass}`}>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                T{i + 1}
              </div>
              <div>
                {isCurrent && (
                  <span className="text-[10px] bg-moss-100 text-moss-800 px-1.5 py-0.5 rounded">current</span>
                )}
              </div>
              <div className="text-right tabular-nums">{formatSeats(seatsInTranche)}</div>
              <div className="text-right tabular-nums">{formatAsset(t.pricePerSeat, assetDecimals, assetSymbol)}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
