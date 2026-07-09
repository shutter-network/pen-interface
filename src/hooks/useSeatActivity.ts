import { useReadContracts, useAccount, useChainId } from 'wagmi'
import { getContracts } from '../config/contracts'
import { SeatTokenAbi } from '../abis/SeatToken'

export type SeatActivityStatus = 'no-seats' | 'active' | 'warning' | 'reclaimable'

export interface SeatActivity {
  isLoading: boolean
  balance: bigint | undefined
  lastActivityAt: bigint | undefined     // unix seconds
  inactivityPeriod: bigint | undefined   // seconds
  isInactive: boolean | undefined
  reclaimAt: bigint | undefined          // unix seconds
  secondsRemaining: bigint | undefined   // clamped >= 0
  progressPct: number | undefined        // 0..100 (share of inactivity window consumed)
  status: SeatActivityStatus | undefined
}

// Treat the last 15% of the inactivity window as a warning zone.
const WARNING_FRACTION_NUM = 15n
const WARNING_FRACTION_DEN = 100n

export function useSeatActivity(): SeatActivity {
  const { address } = useAccount()
  const chainId = useChainId()
  const c = getContracts(chainId)

  const { data, isLoading } = useReadContracts({
    contracts: [
      { address: c.seatToken, abi: SeatTokenAbi, functionName: 'balanceOf',        args: [address ?? '0x0000000000000000000000000000000000000000'] },
      { address: c.seatToken, abi: SeatTokenAbi, functionName: 'lastActivityAt',   args: [address ?? '0x0000000000000000000000000000000000000000'] },
      { address: c.seatToken, abi: SeatTokenAbi, functionName: 'inactivityPeriod' },
      { address: c.seatToken, abi: SeatTokenAbi, functionName: 'isInactive',       args: [address ?? '0x0000000000000000000000000000000000000000'] },
    ],
    query: { enabled: !!address, refetchInterval: 60_000 },
  })

  const balance          = data?.[0]?.result as bigint | undefined
  // lastActivityAt / inactivityPeriod are uint48 in Solidity, viem returns them as number|bigint.
  // Normalize to bigint.
  const lastActivityRaw  = data?.[1]?.result as bigint | number | undefined
  const inactivityRaw    = data?.[2]?.result as bigint | number | undefined
  const isInactive       = data?.[3]?.result as boolean | undefined

  const lastActivityAt   = lastActivityRaw !== undefined ? BigInt(lastActivityRaw) : undefined
  const inactivityPeriod = inactivityRaw   !== undefined ? BigInt(inactivityRaw)   : undefined

  let reclaimAt: bigint | undefined
  let secondsRemaining: bigint | undefined
  let progressPct: number | undefined
  let status: SeatActivityStatus | undefined

  if (balance !== undefined && lastActivityAt !== undefined && inactivityPeriod !== undefined && isInactive !== undefined) {
    if (balance === 0n) {
      status = 'no-seats'
    } else {
      const nowSec = BigInt(Math.floor(Date.now() / 1000))

      if (lastActivityAt === 0n) {
        // Balance > 0 with no recorded activity — contract treats as inactive.
        reclaimAt = 0n
        secondsRemaining = 0n
        progressPct = 100
        status = 'reclaimable'
      } else {
        reclaimAt = lastActivityAt + inactivityPeriod
        secondsRemaining = reclaimAt > nowSec ? reclaimAt - nowSec : 0n

        const elapsed = nowSec > lastActivityAt ? nowSec - lastActivityAt : 0n
        const pctRaw = inactivityPeriod > 0n
          ? Number((elapsed * 10_000n) / inactivityPeriod) / 100
          : 100
        progressPct = Math.min(100, Math.max(0, pctRaw))

        if (isInactive) {
          status = 'reclaimable'
        } else {
          const warningThreshold = (inactivityPeriod * WARNING_FRACTION_NUM) / WARNING_FRACTION_DEN
          status = secondsRemaining <= warningThreshold ? 'warning' : 'active'
        }
      }
    }
  }

  return {
    isLoading,
    balance,
    lastActivityAt,
    inactivityPeriod,
    isInactive,
    reclaimAt,
    secondsRemaining,
    progressPct,
    status,
  }
}
