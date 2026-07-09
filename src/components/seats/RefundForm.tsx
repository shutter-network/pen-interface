import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { useRefundSeats } from '../../hooks/useRefundSeats'
import { formatAsset, formatSeats } from '../../lib/format'
import { getExplorerUrl } from '../../config/constants'

export function RefundForm() {
  const { address } = useAccount()
  const chainId = useChainId()
  const explorerUrl = getExplorerUrl(chainId)
  const {
    seats, setSeats,
    seatBalance, refundAmount, refundPrice, currentSeatPrice,
    isSolvent, asset,
    txHash,
    step, txLoading, errorMsg,
    refund, reset, clearError,
  } = useRefundSeats()

  const ASSET_DECIMALS = asset?.decimals ?? 6
  const ASSET_SYMBOL = asset?.symbol ?? ''
  const [confirmed, setConfirmed] = useState(false)
  const [inputStr, setInputStr] = useState(seats.toString())
  useEffect(() => { setInputStr(seats.toString()) }, [seats])

  if (!address) {
    return (
      <div className="text-center py-10 text-bone-400 dark:text-bone-500">
        Connect your wallet to refund seats.
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="text-center py-10">
        <div className="text-3xl mb-3">✓</div>
        <div className="text-lg font-semibold text-bone-900 dark:text-white mb-1">Refund complete</div>
        <div className="text-sm text-bone-400 dark:text-bone-500 mb-4">{formatSeats(seats)} seat{seats !== 1n ? 's' : ''} refunded.</div>
        {explorerUrl && txHash && (
          <a
            href={`${explorerUrl}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-moss-500 hover:text-moss-600 dark:hover:text-moss-400 font-mono mb-6"
          >
            {txHash.slice(0, 10)}…{txHash.slice(-6)} ↗
          </a>
        )}
        <div>
          <button onClick={() => { reset(); setConfirmed(false) }} className="text-moss-500 hover:text-moss-600 text-sm font-medium">
            Refund more
          </button>
        </div>
      </div>
    )
  }

  const maxSeats = seatBalance ?? 0n
  const insufficientSeats = seats > maxSeats || maxSeats === 0n

  return (
    <div className="space-y-5">
      {/* Solvency banner */}
      {!isSolvent && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          <span className="font-semibold">Refunds paused.</span> The treasury's managed assets are below its principal obligation. Refunds will resume once solvency is restored.
        </div>
      )}

      {/* Price warning — always shown */}
      {refundPrice !== undefined && currentSeatPrice !== undefined && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm">
          <div className="font-semibold text-amber-700 dark:text-amber-400 mb-1">Refund price is fixed below purchase price</div>
          <div className="flex gap-6 text-xs">
            <div>
              <span className="text-bone-500 dark:text-bone-400">Refund price</span>
              <div className="font-bold text-amber-700 dark:text-amber-400 tabular-nums">{formatAsset(refundPrice, ASSET_DECIMALS, ASSET_SYMBOL)}<span className="font-normal text-bone-400"> / seat</span></div>
            </div>
            <div>
              <span className="text-bone-500 dark:text-bone-400">Current buy price</span>
              <div className="font-bold text-bone-900 dark:text-white tabular-nums">{formatAsset(currentSeatPrice, ASSET_DECIMALS, ASSET_SYMBOL)}<span className="font-normal text-bone-400"> / seat</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Balance */}
      {seatBalance !== undefined && (
        <div className="text-xs text-bone-400 dark:text-bone-500">
          Your seats: <span className="text-bone-700 dark:text-bone-300 font-medium">{formatSeats(seatBalance)}</span>
        </div>
      )}

      {/* Seat input */}
      <div>
        <label className="block text-sm font-medium text-bone-700 dark:text-bone-300 mb-1.5">
          Seats to refund
        </label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSeats(q => q > 1n ? q - 1n : 1n)}
            className="w-9 h-9 rounded-lg border border-bone-200 dark:border-bone-700 text-lg font-medium text-bone-500 dark:text-bone-400 hover:bg-bone-50 dark:hover:bg-bone-800 transition-colors"
          >−</button>
          <input
            type="text"
            inputMode="numeric"
            value={inputStr}
            onChange={e => {
              const raw = e.target.value.replace(/[^0-9]/g, '')
              const v = parseInt(raw, 10)
              if (!isNaN(v) && v > 0) {
                const clamped = BigInt(Math.min(v, Number(maxSeats)))
                setSeats(clamped)
                setInputStr(clamped.toString())
              } else {
                setInputStr(raw)
              }
            }}
            onBlur={() => {
              const v = parseInt(inputStr, 10)
              if (isNaN(v) || v < 1) setInputStr(seats.toString())
            }}
            className="flex-1 text-center text-xl font-bold rounded-lg border border-bone-200 dark:border-bone-700 bg-bone-50 dark:bg-bone-900 text-bone-900 dark:text-white py-2.5 focus:outline-none focus:ring-2 focus:ring-moss-500 tabular-nums"
          />
          <button
            onClick={() => setSeats(q => q < maxSeats ? q + 1n : maxSeats)}
            className="w-9 h-9 rounded-lg border border-bone-200 dark:border-bone-700 text-lg font-medium text-bone-500 dark:text-bone-400 hover:bg-bone-50 dark:hover:bg-bone-800 transition-colors"
          >+</button>
        </div>
        {maxSeats > 0n && (
          <button
            onClick={() => setSeats(maxSeats)}
            className="mt-1.5 text-xs text-moss-500 hover:text-moss-600"
          >
            Max: {formatSeats(maxSeats)}
          </button>
        )}
      </div>

      {/* Refund amount */}
      {refundAmount !== undefined && (
        <div className="rounded-xl bg-bone-50 dark:bg-bone-900 border border-bone-200 dark:border-bone-800 p-4">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-bone-700 dark:text-bone-300">You receive</span>
            <span className="text-bone-900 dark:text-white tabular-nums">{formatAsset(refundAmount, ASSET_DECIMALS, ASSET_SYMBOL)}</span>
          </div>
        </div>
      )}

      {/* Confirmation checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={e => setConfirmed(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-bone-300 text-moss-600 focus:ring-moss-500"
        />
        <span className="text-xs text-bone-500 dark:text-bone-400 leading-relaxed">
          I understand the refund price ({refundPrice ? formatAsset(refundPrice, ASSET_DECIMALS, ASSET_SYMBOL) : '…'} per seat) is materially below the current purchase price. This action burns my seats permanently.
        </span>
      </label>

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

      {/* Action */}
      <button
        onClick={refund}
        disabled={!isSolvent || !confirmed || insufficientSeats || txLoading}
        className="w-full py-3 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 active:scale-[0.97] active:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all"
      >
        {txLoading ? 'Refunding…' : `Refund ${formatSeats(seats)} Seat${seats !== 1n ? 's' : ''}`}
      </button>
    </div>
  )
}
