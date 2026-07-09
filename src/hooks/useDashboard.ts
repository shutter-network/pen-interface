import { useReadContracts, useChainId } from 'wagmi'
import { getContracts } from '../config/contracts'
import { SeatTokenAbi } from '../abis/SeatToken'
import { BondingTrancheAbi } from '../abis/BondingTranche'
import { PrincipalManagerAbi } from '../abis/PrincipalManager'

export function useDashboard() {
  const chainId = useChainId()
  const c = getContracts(chainId)

  const { data, isLoading } = useReadContracts({
    contracts: [
      { address: c.seatToken,        abi: SeatTokenAbi,        functionName: 'totalSupply' },
      { address: c.seatToken,        abi: SeatTokenAbi,        functionName: 'supplyCap' },
      { address: c.bondingTranche,   abi: BondingTrancheAbi,   functionName: 'currentSeatPrice' },
      { address: c.bondingTranche,   abi: BondingTrancheAbi,   functionName: 'refundPrice' },
      { address: c.bondingTranche,   abi: BondingTrancheAbi,   functionName: 'trancheCount' },
      { address: c.principalManager, abi: PrincipalManagerAbi, functionName: 'totalManagedAssets' },
      { address: c.principalManager, abi: PrincipalManagerAbi, functionName: 'accountedPrincipal' },
      { address: c.principalManager, abi: PrincipalManagerAbi, functionName: 'availableYield' },
      { address: c.principalManager, abi: PrincipalManagerAbi, functionName: 'liquidAssets' },
      { address: c.principalManager, abi: PrincipalManagerAbi, functionName: 'deployedAssets' },
    ],
    query: { refetchInterval: 30_000 },
  })

  const [
    totalSupply, supplyCap, currentSeatPrice, refundPrice, trancheCount,
    totalManagedAssets, accountedPrincipal, availableYield, liquidAssets, deployedAssets,
  ] = data ?? []

  return {
    isLoading,
    totalSupply:        totalSupply?.result as bigint | undefined,
    supplyCap:          supplyCap?.result as bigint | undefined,
    currentSeatPrice:   currentSeatPrice?.result as bigint | undefined,
    refundPrice:        refundPrice?.result as bigint | undefined,
    trancheCount:       trancheCount?.result as bigint | undefined,
    totalManagedAssets: totalManagedAssets?.result as bigint | undefined,
    accountedPrincipal: accountedPrincipal?.result as bigint | undefined,
    availableYield:     availableYield?.result as bigint | undefined,
    liquidAssets:       liquidAssets?.result as bigint | undefined,
    deployedAssets:     deployedAssets?.result as bigint | undefined,
  }
}
