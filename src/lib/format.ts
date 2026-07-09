import { formatUnits } from 'viem'

export function formatAsset(value: bigint, decimals = 6, symbol = ''): string {
  const num = parseFloat(formatUnits(value, decimals))
  const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return symbol ? `${formatted} ${symbol}` : formatted
}

export function formatAssetCompact(value: bigint, decimals = 6, symbol = ''): string {
  const num = parseFloat(formatUnits(value, decimals))
  let core: string
  if (num >= 1_000_000) core = `${(num / 1_000_000).toFixed(2)}M`
  else if (num >= 1_000) core = `${(num / 1_000).toFixed(1)}K`
  else core = num.toFixed(2)
  return symbol ? `${core} ${symbol}` : core
}

export function formatSeats(value: bigint): string {
  return Number(value).toLocaleString('en-US')
}

// Format a unix-seconds timestamp as an absolute date, e.g. "Jan 3, 2025".
export function formatUnixDate(unixSec: bigint): string {
  return new Date(Number(unixSec) * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// Human-readable duration ("3 days", "5 hours", "just now"). Rounds down.
export function formatDuration(seconds: bigint): string {
  const s = Number(seconds)
  if (s <= 0) return '0 seconds'
  const DAY = 86_400
  const HOUR = 3_600
  const MIN = 60
  if (s >= DAY) {
    const d = Math.floor(s / DAY)
    return `${d} day${d === 1 ? '' : 's'}`
  }
  if (s >= HOUR) {
    const h = Math.floor(s / HOUR)
    return `${h} hour${h === 1 ? '' : 's'}`
  }
  if (s >= MIN) {
    const m = Math.floor(s / MIN)
    return `${m} minute${m === 1 ? '' : 's'}`
  }
  return `${s} second${s === 1 ? '' : 's'}`
}
