import { useReadContract, useReadContracts, useChainId } from 'wagmi'
import { getContracts } from '../config/contracts'
import { BondingTrancheAbi } from '../abis/BondingTranche'
import { ERC20Abi } from '../abis/ERC20'

export type PaymentAsset = {
  address: `0x${string}`
  symbol: string
  decimals: number
}

export function usePaymentAsset(): { data: PaymentAsset | undefined; isLoading: boolean } {
  const chainId = useChainId()
  const c = getContracts(chainId)

  // Step 1: get asset address from BondingTranche
  const { data: assetAddress, isLoading: assetLoading } = useReadContract({
    address: c.bondingTranche,
    abi: BondingTrancheAbi,
    functionName: 'asset',
  })

  // Step 2: fetch symbol + decimals from the asset contract (enabled once address is known)
  const { data: meta, isLoading: metaLoading } = useReadContracts({
    contracts: [
      { address: assetAddress, abi: ERC20Abi, functionName: 'symbol' },
      { address: assetAddress, abi: ERC20Abi, functionName: 'decimals' },
    ],
    query: { enabled: !!assetAddress },
  })

  const symbol   = meta?.[0]?.result as string  | undefined
  const decimals = meta?.[1]?.result as number | undefined

  const data: PaymentAsset | undefined =
    assetAddress && symbol !== undefined && decimals !== undefined
      ? { address: assetAddress, symbol, decimals }
      : undefined

  return { data, isLoading: assetLoading || metaLoading }
}
