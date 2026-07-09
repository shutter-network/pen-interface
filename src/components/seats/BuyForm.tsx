import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { useBuySeats } from '../../hooks/useBuySeats'
import { formatAsset, formatSeats } from '../../lib/format'
import { getExplorerUrl } from '../../config/constants'

export function BuyForm() {
  const { address } = useAccount()
  const chainId = useChainId()
  const explorerUrl = getExplorerUrl(chainId)
  const {
    quantity, setQuantity,
    quotedCost, maxCost, balance,
    quoteFailed, quotePending, insufficientBalance,
    asset,
    step, approveLoading, purchaseLoading,
    purchaseTxHash,
    errorMsg, approve, purchase, reset, clearError,
  } = useBuySeats()

  const ASSET_SYMBOL = asset?.symbol ?? '…'
  const ASSET_DECIMALS = asset?.decimals ?? 6

  const [inputStr, setInputStr] = useState(quantity.toString())
  // Keep display in sync when the hook resets (e.g. after success)
  useEffect(() => { setInputStr(quantity.toString()) }, [quantity])

  const isLoading = approveLoading || purchaseLoading

  if (!address) {
    return (
      <div className="text-center py-10 text-bone-400 dark:text-bone-500">
        Connect your wallet to buy seats.
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="text-center py-10">
        <div className="text-3xl mb-3">✓</div>
        <div className="text-lg font-semibold text-bone-900 dark:text-white mb-1">Purchase complete</div>
        <div className="text-sm text-bone-400 dark:text-bone-500 mb-4">{formatSeats(quantity)} seat{quantity !== 1n ? 's' : ''} added to your wallet.</div>
        {explorerUrl && purchaseTxHash && (
          <a
            href={`${explorerUrl}/tx/${purchaseTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-moss-500 hover:text-moss-600 dark:hover:text-moss-400 font-mono mb-6"
          >
            {purchaseTxHash.slice(0, 10)}…{purchaseTxHash.slice(-6)} ↗
          </a>
        )}
        <div>
          <button onClick={reset} className="text-moss-500 hover:text-moss-600 text-sm font-medium">
            Buy more seats
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
        <div className="text-xs text-bone-400 dark:text-bone-500">
          Wallet balance: <span className="text-bone-700 dark:text-bone-300 font-medium">{formatAsset(balance, ASSET_DECIMALS, ASSET_SYMBOL)}</span>
        </div>
      )}

      {/* Quantity input */}
      <div>
        <label className="block text-sm font-medium text-bone-700 dark:text-bone-300 mb-1.5">
          Number of seats
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuantity(q => q > 1n ? q - 1n : 1n)}
            className="w-9 h-9 rounded-lg border border-bone-200 dark:border-bone-700 text-lg font-medium text-bone-500 dark:text-bone-400 hover:bg-bone-50 dark:hover:bg-bone-800 transition-colors"
          >−</button>
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
            className="flex-1 text-center text-xl font-bold rounded-lg border border-bone-200 dark:border-bone-700 bg-bone-50 dark:bg-bone-900 text-bone-900 dark:text-white py-2.5 focus:outline-none focus:ring-2 focus:ring-moss-500 tabular-nums"
          />
          <button
            onClick={() => setQuantity(q => q + 1n)}
            className="w-9 h-9 rounded-lg border border-bone-200 dark:border-bone-700 text-lg font-medium text-bone-500 dark:text-bone-400 hover:bg-bone-50 dark:hover:bg-bone-800 transition-colors"
          >+</button>
        </div>
      </div>

      {/* Quote failed — not enough seats available */}
      {quoteFailed && (
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400">
          Not enough seats available. Reduce quantity.
        </div>
      )}

      {/* Cost breakdown */}
      {quotedCost !== undefined && (
        <div className="rounded-xl bg-bone-50 dark:bg-bone-900 border border-bone-200 dark:border-bone-800 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-bone-500 dark:text-bone-400">Cost</span>
            <span className="font-medium tabular-nums text-bone-900 dark:text-white">{formatAsset(quotedCost, ASSET_DECIMALS, ASSET_SYMBOL)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-bone-500 dark:text-bone-400">Max (1% slippage)</span>
            <span className="font-medium tabular-nums text-bone-500 dark:text-bone-400">{maxCost ? formatAsset(maxCost, ASSET_DECIMALS, ASSET_SYMBOL) : '—'}</span>
          </div>
          <div className="border-t border-bone-200 dark:border-bone-700 pt-2 flex justify-between text-sm font-semibold">
            <span className="text-bone-700 dark:text-bone-300">You pay at most</span>
            <span className="text-bone-900 dark:text-white tabular-nums">{maxCost ? formatAsset(maxCost, ASSET_DECIMALS, ASSET_SYMBOL) : '—'}</span>
          </div>
        </div>
      )}

      {/* Insufficient balance warning */}
      {insufficientBalance && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          Insufficient {ASSET_SYMBOL} balance.
        </div>
      )}

      {/* Step indicator */}
      {needsApprove && (
        <div className="flex items-center gap-3 text-xs text-bone-400 dark:text-bone-500">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-moss-500 text-white flex items-center justify-center text-[10px] font-bold">1</span>
            Approve {ASSET_SYMBOL}
          </div>
          <div className="flex-1 border-t border-dashed border-bone-300 dark:border-bone-700" />
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-bone-200 dark:bg-bone-700 text-bone-400 flex items-center justify-center text-[10px] font-bold">2</span>
            Purchase
          </div>
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 flex items-start justify-between gap-3">
          <span className="flex-1">{errorMsg}</span>
          <button
            onClick={clearError}
            aria-label="Dismiss error"
            className="text-red-500 hover:text-red-700 dark:hover:text-red-300 font-bold leading-none pt-0.5"
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
          className="w-full py-3 rounded-xl font-semibold text-sm bg-moss-600 hover:bg-moss-700 active:scale-[0.97] active:bg-moss-800 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all"
        >
          {step === 'approving' || approveLoading ? 'Approving…' : `Approve ${ASSET_SYMBOL}`}
        </button>
      ) : (
        <button
          onClick={purchase}
          disabled={isLoading || !quotedCost || quotePending || quoteFailed || insufficientBalance || step === 'idle'}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-moss-600 hover:bg-moss-700 active:scale-[0.97] active:bg-moss-800 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all"
        >
          {step === 'purchasing' || purchaseLoading ? 'Purchasing…' : `Buy ${formatSeats(quantity)} Seat${quantity !== 1n ? 's' : ''}`}
        </button>
      )}
    </div>
  )
}
