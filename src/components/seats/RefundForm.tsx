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
    seatBalance, refundAmount, refundPrice,
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

  if (step === 'success') {
    return (
      <div className="text-center py-10">
        <div className="text-3xl mb-3">✓</div>
        <div className="text-lg font-semibold text-bone-950 mb-1">Refund complete</div>
        <div className="text-sm text-bone-500 mb-4">{formatSeats(seats)} SEAT{seats !== 1n ? 's' : ''} refunded.</div>
        {explorerUrl && txHash && (
          <a
            href={`${explorerUrl}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs text-brand-600 hover:text-brand-700 font-mono mb-6"
          >
            {txHash.slice(0, 10)}…{txHash.slice(-6)} ↗
          </a>
        )}
        <div>
          <button onClick={() => { reset(); setConfirmed(false) }} className="text-brand-600 hover:text-brand-700 text-sm font-medium">
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
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">Refunds paused.</span> The treasury's managed assets are below its principal obligation. Refunds will resume once solvency is restored.
        </div>
      )}

      {/* Price warning — always shown */}
      {refundPrice !== undefined && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Refund amount is fixed at {formatAsset(refundPrice, ASSET_DECIMALS, ASSET_SYMBOL)} / SEAT regardless of purchase price.
        </div>
      )}

      {/* Balance */}
      {seatBalance !== undefined && (
        <div className="text-xs text-bone-500">
          Your SEATs: <span className="text-bone-700 font-medium">{formatSeats(seatBalance)}</span>
        </div>
      )}

      {/* Seat input */}
      <div>
        <label className="block text-sm font-medium text-bone-700 mb-1.5">
          SEATs to refund
        </label>
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
          className="w-full text-center text-xl font-bold rounded-lg border border-bone-300 bg-bone-50 text-bone-950 py-2.5 focus:outline-none focus:ring-2 focus:ring-moss-500 tabular-nums"
        />
        {maxSeats > 0n && (
          <button
            onClick={() => setSeats(maxSeats)}
            className="mt-1.5 text-xs text-brand-600 hover:text-brand-700"
          >
            Max: {formatSeats(maxSeats)}
          </button>
        )}
      </div>

      {/* Refund amount */}
      {refundAmount !== undefined && (
        <div className="rounded-xl bg-bone-50 border border-bone-200 p-4">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-bone-700">You receive</span>
            <span className="text-bone-950 tabular-nums">{formatAsset(refundAmount, ASSET_DECIMALS, ASSET_SYMBOL)}</span>
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
        <span className="text-xs text-bone-500 leading-relaxed">
          I understand this action burns my SEATs permanently.
        </span>
      </label>

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

      {/* Action */}
      {!address ? (
        <button
          disabled
          className="w-full py-3 rounded-xl font-semibold text-sm bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all"
        >
          Connect wallet
        </button>
      ) : (
        <button
          onClick={refund}
          disabled={!isSolvent || !confirmed || insufficientSeats || txLoading}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-red-600 hover:bg-red-700 active:scale-[0.97] active:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all"
        >
          {txLoading ? 'Refunding…' : `Refund ${formatSeats(seats)} SEAT${seats !== 1n ? 's' : ''}`}
        </button>
      )}
    </div>
  )
}
