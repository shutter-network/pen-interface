import { useDashboard } from '../hooks/useDashboard'
import { useDisbursements } from '../hooks/useDisbursements'
import { StatCard } from '../components/dashboard/StatCard'
import { TrancheProgress } from '../components/dashboard/TrancheProgress'
import { formatAsset, formatAssetCompact, formatSeats } from '../lib/format'
import { useChainId } from 'wagmi'
import { getExplorerUrl } from '../config/constants'
import { usePaymentAsset } from '../hooks/usePaymentAsset'

export function Dashboard() {
  const chainId = useChainId()
  const explorerUrl = getExplorerUrl(chainId)
  const { data: asset } = usePaymentAsset()
  const ASSET_DECIMALS = asset?.decimals ?? 6
  const ASSET_SYMBOL = asset?.symbol ?? ''
  const d = useDashboard()
  const { data: disbursements, isLoading: disbLoading, isError: disbError } = useDisbursements()

  const soldPct = d.totalSupply !== undefined && d.supplyCap !== undefined && d.supplyCap > 0n
    ? `${((Number(d.totalSupply) / Number(d.supplyCap)) * 100).toFixed(1)}% of cap`
    : undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-bone-950">Metrics</h1>
      </div>

      {/* Seat stats */}
      <section>
        <div className="text-xs font-semibold text-bone-500 uppercase tracking-wider mb-3">SEATs</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="SEATs Active"
            value={d.totalSupply !== undefined ? formatSeats(d.totalSupply) : undefined}
            sub={soldPct}
            loading={d.isLoading}
          />
          <StatCard
            label="Supply Cap"
            value={d.supplyCap !== undefined ? formatSeats(d.supplyCap) : undefined}
            loading={d.isLoading}
          />
          <StatCard
            label="Buy Price"
            value={d.currentSeatPrice !== undefined ? formatAsset(d.currentSeatPrice, ASSET_DECIMALS, ASSET_SYMBOL) : undefined}
            sub="per SEAT (current tranche)"
            loading={d.isLoading}
            highlight
          />
          <StatCard
            label="Refund Price"
            value={d.refundPrice !== undefined ? formatAsset(d.refundPrice, ASSET_DECIMALS, ASSET_SYMBOL) : undefined}
            sub="per SEAT (fixed)"
            loading={d.isLoading}
          />
        </div>
      </section>

      {/* Tranches */}
      <section>
        <div className="text-xs font-semibold text-bone-500 uppercase tracking-wider mb-3">Tranches</div>
        <TrancheProgress totalSupply={d.totalSupply} trancheCount={d.trancheCount} assetDecimals={ASSET_DECIMALS} assetSymbol={ASSET_SYMBOL} />
      </section>

      {/* Treasury stats */}
      <section>
        <div className="text-xs font-semibold text-bone-500 uppercase tracking-wider mb-3">Treasury</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label="Total Managed Assets"
            value={d.totalManagedAssets !== undefined ? formatAssetCompact(d.totalManagedAssets, ASSET_DECIMALS, ASSET_SYMBOL) : undefined}
            sub={d.totalManagedAssets !== undefined ? formatAsset(d.totalManagedAssets, ASSET_DECIMALS, ASSET_SYMBOL) : undefined}
            loading={d.isLoading}
          />
          <StatCard
            label="Liquid Assets"
            value={d.liquidAssets !== undefined ? formatAssetCompact(d.liquidAssets, ASSET_DECIMALS, ASSET_SYMBOL) : undefined}
            sub="in PrincipalManager"
            loading={d.isLoading}
          />
          <StatCard
            label="Deployed (Vault)"
            value={d.deployedAssets !== undefined ? formatAssetCompact(d.deployedAssets, ASSET_DECIMALS, ASSET_SYMBOL) : undefined}
            sub="in ERC-4626 vault"
            loading={d.isLoading}
          />
          <StatCard
            label="Accounted Principal"
            value={d.accountedPrincipal !== undefined ? formatAssetCompact(d.accountedPrincipal, ASSET_DECIMALS, ASSET_SYMBOL) : undefined}
            sub="protocol obligation"
            loading={d.isLoading}
          />
          <StatCard
            label="Available Yield"
            value={d.availableYield !== undefined ? formatAssetCompact(d.availableYield, ASSET_DECIMALS, ASSET_SYMBOL) : undefined}
            sub="distributable"
            highlight={d.availableYield !== undefined && d.availableYield > 0n}
            loading={d.isLoading}
          />
          <StatCard
            label="Cumulative Disbursed"
            value={disbError ? '—' : disbursements?.total !== undefined ? formatAssetCompact(disbursements.total, ASSET_DECIMALS, ASSET_SYMBOL) : undefined}
            sub={disbError ? 'log query failed' : disbursements ? `${disbursements.count} funding round${disbursements.count !== 1 ? 's' : ''}` : undefined}
            loading={disbLoading && !disbError}
          />
        </div>
      </section>

      {/* Recent disbursements */}
      {!disbError && disbursements && disbursements.events.length > 0 && (
        <section>
          <div className="text-xs font-semibold text-bone-500 uppercase tracking-wider mb-3">Recent Disbursements</div>
          <div className="rounded-xl border border-bone-200 overflow-hidden divide-y divide-bone-200">
            {disbursements.events.slice(0, 5).map((ev, i) => {
              const roundNumber = disbursements.count - i
              const dateLabel = ev.timestamp
                ? new Date(ev.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : null
              const blockLabel = ev.blockNumber
                ? `block ${Number(ev.blockNumber).toLocaleString('en-US')}`
                : null
              return (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5 bg-bone-50 hover:bg-bone-100/60 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-moss-500 flex-shrink-0 self-start mt-2" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-bone-950">
                        Round {roundNumber}
                      </span>
                      {ev.recipientCount > 0 && (
                        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-bone-100 text-bone-700">
                          {ev.recipientCount} recipient{ev.recipientCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0 text-xs text-bone-500">
                      {dateLabel && <span>{dateLabel}</span>}
                      {dateLabel && blockLabel && <span>·</span>}
                      {blockLabel && <span>{blockLabel}</span>}
                      {explorerUrl && ev.transactionHash && (
                        <>
                          <span>·</span>
                          <a
                            href={`${explorerUrl}/tx/${ev.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-brand-600 hover:text-brand-700"
                          >
                            {ev.transactionHash.slice(0, 6)}…{ev.transactionHash.slice(-4)} ↗
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-bone-950 tabular-nums flex-shrink-0">
                    {ev.totalFormatted}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
