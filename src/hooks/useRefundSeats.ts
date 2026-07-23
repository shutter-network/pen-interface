import { useState, useEffect } from 'react'
import { useReadContracts, useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi'
import { useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { getContracts } from '../config/contracts'
import { BondingTrancheAbi } from '../abis/BondingTranche'
import { SeatTokenAbi } from '../abis/SeatToken'
import { PrincipalManagerAbi } from '../abis/PrincipalManager'
import { usePaymentAsset } from './usePaymentAsset'

export type RefundStep = 'idle' | 'ready' | 'confirming' | 'refunding' | 'success' | 'error'

export function useRefundSeats() {
  const { address } = useAccount()
  const chainId = useChainId()
  const c = getContracts(chainId)
  const { data: asset } = usePaymentAsset()

  const queryClient = useQueryClient()
  const [seats, setSeats] = useState(1n)
  const [step, setStep] = useState<RefundStep>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Static reads — none depend on `seats`, so they never refetch when seats change
  const { data: staticReads } = useReadContracts({
    contracts: [
      { address: c.seatToken,        abi: SeatTokenAbi,        functionName: 'balanceOf', args: [address ?? '0x0000000000000000000000000000000000000000'] },
      { address: c.bondingTranche,   abi: BondingTrancheAbi,   functionName: 'refundPrice' },
      { address: c.principalManager, abi: PrincipalManagerAbi, functionName: 'totalManagedAssets' },
      { address: c.seatToken,        abi: SeatTokenAbi,        functionName: 'totalSupply' },
    ],
    // Read-only — runs without a wallet so the refund price / solvency banner
    // render before connecting. balanceOf falls back to the zero address (→ 0).
    query: { enabled: !!c.seatToken },
  })

  // Dynamic read — reruns on every seats change; keepPreviousData prevents clearing while loading
  const { data: quoteRefundResult } = useReadContract({
    address: c.bondingTranche,
    abi: BondingTrancheAbi,
    functionName: 'quoteRefund',
    args: [seats],
    query: { enabled: seats > 0n, placeholderData: keepPreviousData },
  })

  const seatBalance      = staticReads?.[0]?.result as bigint | undefined
  const refundPrice      = staticReads?.[1]?.result as bigint | undefined
  const totalManaged     = staticReads?.[2]?.result as bigint | undefined
  const totalSupply      = staticReads?.[3]?.result as bigint | undefined
  const refundAmount     = quoteRefundResult as bigint | undefined

  // Mirrors the contract check: managedAssets >= totalSupply * refundPrice
  const isSolvent = totalManaged !== undefined && totalSupply !== undefined && refundPrice !== undefined
    ? totalManaged >= totalSupply * refundPrice
    : true // optimistic until loaded

  const { writeContractAsync, data: txHash } = useWriteContract()
  const { isLoading: txLoading, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (isSuccess) { queryClient.invalidateQueries(); setStep('success') }
  }, [isSuccess])

  async function refund() {
    if (!address || !isSolvent) return
    setErrorMsg(null)
    setStep('refunding')
    try {
      await writeContractAsync({
        address: c.bondingTranche,
        abi: BondingTrancheAbi,
        functionName: 'refund',
        args: [seats, address],
      })
    } catch (e: unknown) {
      const msg = (e as { shortMessage?: string; message?: string })?.shortMessage ?? (e as { message?: string })?.message ?? ''
      if (msg.includes('PrincipalInsolvent') || msg.includes('RefundObligationExceeds')) {
        setErrorMsg('Treasury is insolvent — refunds are currently paused.')
      } else if (msg.includes('User rejected')) {
        setErrorMsg('Transaction rejected.')
      } else {
        setErrorMsg(msg.slice(0, 120) || 'Refund failed.')
      }
      setStep('ready')
    }
  }

  function reset() { setSeats(1n); setStep('idle'); setErrorMsg(null) }
  function clearError() { setErrorMsg(null) }

  return {
    seats, setSeats,
    seatBalance, refundAmount, refundPrice,
    isSolvent,
    asset,
    txHash,
    step, txLoading, errorMsg,
    refund, reset, clearError,
  }
}
