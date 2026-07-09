import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { useBuySeats } from '../../hooks/useBuySeats'
import { useDashboard } from '../../hooks/useDashboard'
import { useTranches } from '../../hooks/useTranches'
import { formatAsset, formatSeats } from '../../lib/format'
import { getExplorerUrl } from '../../config/constants'

type TrancheSegment = {
  trancheIndex: number
  seats: bigint
  pricePerSeat: bigint
  subtotal: bigint
}

function splitAcrossTranches(
  quantity: bigint,
  soldAtStart: bigint,
  tranches: { upperBound: bigint; pricePerSeat: bigint }[],
): TrancheSegment[] {
  const segments: TrancheSegment[] = []
  let remaining = quantity
  let cursor = soldAtStart
  for (let i = 0; i < tranches.length && remaining > 0n; i++) {
    const t = tranches[i]
    if (cursor >= t.upperBound) continue
    const availableInTranche = t.upperBound - cursor
    const seatsHere = remaining < availableInTranche ? remaining : availableInTranche
    if (seatsHere > 0n) {
      segments.push({
        trancheIndex: i,
        seats: seatsHere,
        pricePerSeat: t.pricePerSeat,
        subtotal: seatsHere * t.pricePerSeat,
      })
    }
    remaining -= seatsHere
    cursor += seatsHere
  }
  return segments
}

export function BuyForm() {
  const { address } = useAccount()
  const chainId = useChainId()
  const explorerUrl = getExplorerUrl(chainId)
  const {
    quantity, setQuantity,
    quotedCost, balance,
    quoteFailed, quotePending, insufficientBalance,
    asset,
    step, approveLoading, purchaseLoading,
    purchaseTxHash,
    errorMsg, approve, purchase, reset, clearError,
  } = useBuySeats()

  const d = useDashboard()
  const { tranches } = useTranches(d.trancheCount)

  const ASSET_SYMBOL = asset?.symbol ?? '…'
  const ASSET_DECIMALS = asset?.decimals ?? 6

  const [inputStr, setInputStr] = useState(quantity.toString())
  // Keep display in sync when the hook resets (e.g. after success)
  useEffect(() => { setInputStr(quantity.toString()) }, [quantity])

  const isLoading = approveLoading || purchaseLoading

  const segments =
    d.totalSupply !== undefined && tranches.length > 0
      ? splitAcrossTranches(quantity, d.totalSupply, tranches)
      : []

  if (!address) {
    return (
      <div className="text-center py-10 text-bone-500">
        Connect your wallet to buy SEATs.
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="text-center py-10">
        <div className="text-3xl mb-3">✓</div>
        <div className="text-lg font-semibold text-bone-950 mb-1">Purchase complete</div>
        <div className="text-sm text-bone-500 mb-4">{formatSeats(quantity)} SEAT{quantity !== 1n ? 's' : ''} added to your wallet.</div>
        {explorerUrl && purchaseTxHash && (
          <a
            href={`${explorerUrl}/tx/${purchaseTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-brand-600 hover:text-brand-700 font-mono mb-6"
          >
            {purchaseTxHash.slice(0, 10)}…{purchaseTxHash.slice(-6)} ↗
          </a>
        )}
        <div>
          <button onClick={reset} className="text-brand-600 hover:text-brand-700 text-sm font-medium">
            Buy more SEATs
          </button>
        </div>
      </div>
    )
  }

  const needsApprove = step === 'needs-approve' || step === 'approving'

  return (
    <div className="space-y-5">
      {/* Balance */}
      {balance !== undefined && (
        <div className="text-xs text-bone-500">
          Wallet balance: <span className="text-bone-700 font-medium">{formatAsset(balance, ASSET_DECIMALS, ASSET_SYMBOL)}</span>
        </div>
      )}

      {/* Quantity input */}
      <div>
        <label className="block text-sm font-medium text-bone-700 mb-1.5">
          Number of SEATs
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={inputStr}
          onChange={e => {
            const raw = e.target.value.replace(/[^0-9]/g, '')
            setInputStr(raw)
            const v = parseInt(raw, 10)
            if (!isNaN(v) && v > 0) setQuantity(BigInt(v))
          }}
          onBlur={() => {
            const v = parseInt(inputStr, 10)
            if (isNaN(v) || v < 1) setInputStr(quantity.toString())
          }}
          className="w-full text-center text-xl font-bold rounded-lg border border-bone-300 bg-bone-50 text-bone-950 py-2.5 focus:outline-none focus:ring-2 focus:ring-moss-500 tabular-nums"
        />
      </div>

      {/* Quote failed — not enough seats available */}
      {quoteFailed && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-700">
          Not enough SEATs available. Reduce quantity.
        </div>
      )}

      {/* Per-tranche breakdown */}
      {segments.length > 0 && !quoteFailed && (
        <div className="rounded-xl bg-bone-50 border border-bone-200 p-4">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 gap-y-1.5 text-xs">
            <div className="text-bone-500 uppercase tracking-wide font-medium">Tranche</div>
            <div />
            <div className="text-bone-500 uppercase tracking-wide font-medium text-right">SEATs</div>
            <div className="text-bone-500 uppercase tracking-wide font-medium text-right">Price / SEAT</div>

            {segments.map(seg => (
              <div key={seg.trancheIndex} className="contents text-bone-700">
                <div>T{seg.trancheIndex + 1}</div>
                <div />
                <div className="text-right tabular-nums">{formatSeats(seg.seats)}</div>
                <div className="text-right tabular-nums">{formatAsset(seg.pricePerSeat, ASSET_DECIMALS, ASSET_SYMBOL)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost total */}
      {quotedCost !== undefined && (
        <div className="rounded-xl bg-bone-50 border border-bone-200 p-4">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-bone-700">You pay</span>
            <span className="text-bone-950 tabular-nums">{formatAsset(quotedCost, ASSET_DECIMALS, ASSET_SYMBOL)}</span>
          </div>
        </div>
      )}

      {/* Insufficient balance warning */}
      {insufficientBalance && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
          Insufficient {ASSET_SYMBOL} balance.
        </div>
      )}

      {/* Step indicator */}
      {needsApprove && (
        <div className="flex items-center gap-3 text-xs text-bone-500">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-moss-500 text-bone-950 flex items-center justify-center text-[10px] font-bold">1</span>
            Approve {ASSET_SYMBOL}
          </div>
          <div className="flex-1 border-t border-dashed border-bone-300" />
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-bone-200 text-bone-500 flex items-center justify-center text-[10px] font-bold">2</span>
            Purchase
          </div>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700 flex items-start justify-between gap-3">
          <span className="flex-1">{errorMsg}</span>
          <button
            onClick={clearError}
            aria-label="Dismiss error"
            className="text-red-600 hover:text-red-800 font-bold leading-none pt-0.5"
          >
            ×
          </button>
        </div>
      )}

      {/* Action button */}
      {needsApprove ? (
        <button
          onClick={approve}
          disabled={isLoading || quotePending || quoteFailed || insufficientBalance}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-moss-500 hover:bg-moss-600 active:scale-[0.97] active:bg-moss-700 disabled:opacity-50 disabled:cursor-not-allowed text-bone-950 transition-all"
        >
          {step === 'approving' || approveLoading ? 'Approving…' : `Approve ${ASSET_SYMBOL}`}
        </button>
      ) : (
        <button
          onClick={purchase}
          disabled={isLoading || !quotedCost || quotePending || quoteFailed || insufficientBalance || step === 'idle'}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-moss-500 hover:bg-moss-600 active:scale-[0.97] active:bg-moss-700 disabled:opacity-50 disabled:cursor-not-allowed text-bone-950 transition-all"
        >
          {step === 'purchasing' || purchaseLoading ? 'Purchasing…' : `Buy ${formatSeats(quantity)} SEAT${quantity !== 1n ? 's' : ''}`}
        </button>
      )}
    </div>
  )
}
