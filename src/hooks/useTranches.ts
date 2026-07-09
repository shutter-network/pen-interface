import { useReadContracts, useChainId } from 'wagmi'
import { getContracts } from '../config/contracts'
import { BondingTrancheAbi } from '../abis/BondingTranche'

export function useTranches(count: bigint | undefined) {
  const chainId = useChainId()
  const c = getContracts(chainId)
  const n = count ? Number(count) : 0

  const { data, isLoading } = useReadContracts({
    contracts: Array.from({ length: n }, (_, i) => ({
      address: c.bondingTranche,
      abi: BondingTrancheAbi,
      functionName: 'tranche' as const,
      args: [BigInt(i)] as const,
    })),
    query: { enabled: n > 0 },
  })

  const tranches = (data ?? []).map((d, i) => {
    const result = d.result as [bigint, bigint] | undefined
    return {
      index: i,
      upperBound: result?.[0] ?? 0n,
      pricePerSeat: result?.[1] ?? 0n,
    }
  })

  return { tranches, isLoading }
}
