import { useAccount } from 'wagmi'
import { useSeatActivity } from '../../hooks/useSeatActivity'
import { formatSeats, formatUnixDate, formatDuration } from '../../lib/format'

interface Props {
  onGoToBuy?: () => void
}

export function ActivityView({ onGoToBuy }: Props) {
  const { address } = useAccount()
  const a = useSeatActivity()

  if (!address) {
    return (
      <div className="text-center py-10 text-bone-400 dark:text-bone-500">
        Connect your wallet to see your seat activity.
      </div>
    )
  }

  if (a.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 rounded bg-bone-200 dark:bg-bone-800 animate-pulse" />
        <div className="h-24 rounded bg-bone-200 dark:bg-bone-800 animate-pulse" />
      </div>
    )
  }

  if (a.status === 'no-seats') {
    return (
      <div className="text-center py-10">
        <div className="text-base font-semibold text-bone-900 dark:text-white mb-1">You don't hold any seats yet</div>
        <div className="text-sm text-bone-500 dark:text-bone-400 mb-4">
          Buy seats to join the endowment. Your activity tracker starts on mint.
        </div>
        {onGoToBuy && (
          <button
            onClick={onGoToBuy}
            className="inline-block px-4 py-2 rounded-lg bg-moss-600 hover:bg-moss-700 text-white text-sm font-semibold transition-colors"
          >
            Buy seats
          </button>
        )}
      </div>
    )
  }

  if (!a.status) return null

  return (
    <div className="space-y-5">
      <StatusCard a={a} />
      <ActivityExplainer onGoToBuy={onGoToBuy} />
    </div>
  )
}

function StatusCard({ a }: { a: ReturnType<typeof useSeatActivity> }) {
  const { status, balance, lastActivityAt, inactivityPeriod, secondsRemaining, progressPct } = a

  const tone =
    status === 'reclaimable' ? 'danger' :
    status === 'warning'     ? 'warn'   : 'ok'

  const border =
    tone === 'danger' ? 'border-red-200 dark:border-red-800'
    : tone === 'warn' ? 'border-amber-200 dark:border-amber-800'
    :                   'border-bone-200 dark:border-bone-800'

  const bg =
    tone === 'danger' ? 'bg-red-50 dark:bg-red-950/30'
    : tone === 'warn' ? 'bg-amber-50 dark:bg-amber-950/20'
    :                   'bg-bone-50 dark:bg-bone-950/40'

  const barFill =
    tone === 'danger' ? 'bg-red-500'
    : tone === 'warn' ? 'bg-amber-500'
    :                   'bg-moss-500'

  const headline =
    status === 'reclaimable' ? 'At risk of reclaim'
    : status === 'warning'   ? 'Inactivity window closing'
    :                          'Active'

  const headlineTone =
    tone === 'danger' ? 'text-red-700 dark:text-red-400'
    : tone === 'warn' ? 'text-amber-700 dark:text-amber-400'
    :                   'text-moss-700 dark:text-moss-400'

  return (
    <div className={`rounded-xl border ${border} ${bg} p-5 space-y-4`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`text-xs font-semibold uppercase tracking-wider ${headlineTone}`}>{headline}</div>
          <div className="text-lg font-semibold text-bone-900 dark:text-white mt-1">
            {balance !== undefined && `${formatSeats(balance)} seat${balance !== 1n ? 's' : ''}`}
          </div>
        </div>
        <div className="text-right">
          {status === 'reclaimable' ? (
            <>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">Now</div>
              <div className="text-xs text-bone-500 dark:text-bone-400">reclaim eligible</div>
            </>
          ) : secondsRemaining !== undefined ? (
            <>
              <div className="text-2xl font-bold text-bone-900 dark:text-white tabular-nums">{formatDuration(secondsRemaining)}</div>
              <div className="text-xs text-bone-500 dark:text-bone-400">until reclaim eligible</div>
            </>
          ) : null}
        </div>
      </div>

      {progressPct !== undefined && (
        <div>
          <div className="h-2 rounded-full bg-bone-200 dark:bg-bone-800 overflow-hidden">
            <div className={`h-full ${barFill} transition-all`} style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-bone-500 dark:text-bone-400 mt-1.5 tabular-nums">
            <span>{progressPct.toFixed(0)}% of window elapsed</span>
            {inactivityPeriod !== undefined && (
              <span>window: {formatDuration(inactivityPeriod)}</span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-bone-200 dark:border-bone-800">
        <div>
          <div className="text-xs text-bone-500 dark:text-bone-400 mb-0.5">Last activity</div>
          <div className="text-sm font-medium text-bone-900 dark:text-white">
            {lastActivityAt !== undefined && lastActivityAt > 0n ? formatUnixDate(lastActivityAt) : 'Never recorded'}
          </div>
        </div>
        <div>
          <div className="text-xs text-bone-500 dark:text-bone-400 mb-0.5">Reclaim eligible</div>
          <div className="text-sm font-medium text-bone-900 dark:text-white">
            {a.reclaimAt !== undefined && a.reclaimAt > 0n ? formatUnixDate(a.reclaimAt) : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityExplainer({ onGoToBuy }: { onGoToBuy?: () => void }) {
  return (
    <div className="rounded-xl border border-bone-200 dark:border-bone-800 bg-bone-50 dark:bg-bone-900/60 p-5 space-y-3">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-bone-500 dark:text-bone-400">How to stay active</div>
        <div className="text-sm text-bone-700 dark:text-bone-200 mt-1">
          Any of these refreshes your activity timestamp on-chain:
        </div>
      </div>

      <ul className="space-y-2.5 text-sm">
        <li className="flex items-start gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-moss-500 mt-2 flex-shrink-0" />
          <div>
            <div className="font-medium text-bone-900 dark:text-white">Vote on a governance proposal</div>
            <div className="text-bone-500 dark:text-bone-400 text-xs mt-0.5">
              Casting a ranked-choice ballot on any open proposal refreshes activity automatically.
            </div>
          </div>
        </li>
        <li className="flex items-start gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-moss-500 mt-2 flex-shrink-0" />
          <div>
            <div className="font-medium text-bone-900 dark:text-white">Buy additional seats</div>
            <div className="text-bone-500 dark:text-bone-400 text-xs mt-0.5">
              Every mint resets your activity clock.{onGoToBuy && (
                <> <button onClick={onGoToBuy} className="text-moss-600 dark:text-moss-400 hover:underline">Buy seats →</button></>
              )}
            </div>
          </div>
        </li>
      </ul>
    </div>
  )
}
