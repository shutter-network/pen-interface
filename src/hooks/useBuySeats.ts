import { useState, useEffect } from 'react'
import { useReadContracts, useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi'
import { useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { getContracts } from '../config/contracts'
import { BondingTrancheAbi } from '../abis/BondingTranche'
import { ERC20Abi } from '../abis/ERC20'
import { usePaymentAsset } from './usePaymentAsset'

export type BuyStep = 'idle' | 'quoting' | 'needs-approve' | 'approving' | 'ready' | 'purchasing' | 'success' | 'error'

export function useBuySeats() {
  const { address } = useAccount()
  const chainId = useChainId()
  const c = getContracts(chainId)
  const { data: asset } = usePaymentAsset()

  const queryClient = useQueryClient()
  const [quantity, setQuantity] = useState(1n)
  const [step, setStep] = useState<BuyStep>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  // Recipient of the SEATs. `undefined` means "buy for myself" (the connected
  // wallet). Payment (approve/allowance/balance) always comes from the buyer;
  // only the on-chain `recipient` of the mint differs.
  const [recipient, setRecipient] = useState<`0x${string}` | undefined>(undefined)

  // Static reads — balance and allowance don't depend on quantity.
  // Kept separate so they never refetch (and flicker) when quantity changes.
  const { data: staticReads, refetch: refetchStatic } = useReadContracts({
    contracts: [
      {
        address: asset?.address,
        abi: ERC20Abi,
        functionName: 'allowance',
        args: [address ?? '0x0000000000000000000000000000000000000000', c.bondingTranche],
      },
      {
        address: asset?.address,
        abi: ERC20Abi,
        functionName: 'balanceOf',
        args: [address ?? '0x0000000000000000000000000000000000000000'],
      },
    ],
    query: { enabled: !!address && !!asset?.address },
  })

  // Dynamic read — quote changes with every quantity update.
  const {
    data: quotedCost,
    status: quoteStatus,
    isFetching: quoteIsFetching,
  } = useReadContract({
    address: c.bondingTranche,
    abi: BondingTrancheAbi,
    functionName: 'quotePurchase',
    args: [quantity],
    query: {
      // Read-only quote — runs even without a connected wallet so the cost
      // breakdown is visible before connecting.
      enabled: quantity > 0n,
      placeholderData: keepPreviousData,
      retry: (_, error) => {
        const msg = (error as { message?: string; shortMessage?: string })?.shortMessage
          ?? (error as { message?: string })?.message
          ?? ''
        if (msg.includes('revert') || msg.includes('execution reverted')) return false
        return true
      },
    },
  })

  const allowance = staticReads?.[0]?.result as bigint | undefined
  const balance   = staticReads?.[1]?.result as bigint | undefined
  // Price is fixed per tranche — pay exactly the quoted cost, no slippage buffer.
  const maxCost   = quotedCost
  const quoteFailed   = quoteStatus === 'error'
  const quotePending  = quoteIsFetching || quoteStatus === 'pending'
  const insufficientBalance = balance !== undefined && maxCost !== undefined && balance < maxCost

  useEffect(() => {
    if (!maxCost || allowance === undefined) return
    if (step === 'success' || step === 'approving' || step === 'purchasing') return
    // Once we've reached `ready`, don't regress to `needs-approve` on a stale
    // allowance refetch — only advance forward (needs-approve → ready).
    if (step === 'ready' && allowance >= maxCost) return
    setStep(allowance >= maxCost ? 'ready' : 'needs-approve')
  }, [maxCost, allowance, step])

  const { writeContractAsync: writeApprove, data: approveTxHash } = useWriteContract()
  const { isLoading: approveLoading, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveTxHash })

  useEffect(() => {
    if (approveSuccess) { refetchStatic(); setStep('ready') }
  }, [approveSuccess])

  const { writeContractAsync: writePurchase, data: purchaseTxHash } = useWriteContract()
  const { isLoading: purchaseLoading, isSuccess: purchaseSuccess } = useWaitForTransactionReceipt({ hash: purchaseTxHash })

  useEffect(() => {
    if (purchaseSuccess) {
      queryClient.invalidateQueries()
      setStep('success')
    }
  }, [purchaseSuccess])

  async function approve() {
    if (!maxCost || !asset) return
    setErrorMsg(null)
    setStep('approving')
    try {
      await writeApprove({ address: asset.address, abi: ERC20Abi, functionName: 'approve', args: [c.bondingTranche, maxCost] })
    } catch (e: unknown) {
      setErrorMsg(parseContractError(e))
      setStep('needs-approve')
    }
  }

  async function purchase() {
    if (!address || !maxCost) return
    setErrorMsg(null)
    setStep('purchasing')
    try {
      await writePurchase({
        address: c.bondingTranche,
        abi: BondingTrancheAbi,
        functionName: 'purchase',
        args: [recipient ?? address, quantity, maxCost],
      })
    } catch (e: unknown) {
      setErrorMsg(parseContractError(e))
      setStep('ready')
    }
  }

  function reset() { setQuantity(1n); setStep('idle'); setErrorMsg(null); setRecipient(undefined) }
  function clearError() { setErrorMsg(null) }

  return {
    quantity, setQuantity,
    recipient, setRecipient,
    quotedCost, balance,
    quoteFailed, quotePending, insufficientBalance,
    asset,
    step,
    approveLoading,
    purchaseLoading,
    errorMsg,
    purchaseTxHash,
    approve, purchase, reset, clearError,
  }
}

function parseContractError(e: unknown): string {
  const msg = (e as { shortMessage?: string; message?: string })?.shortMessage
    ?? (e as { message?: string })?.message
    ?? 'Transaction failed'
  if (msg.includes('SoldOut')) return 'All seats in this tranche are sold out.'
  if (msg.includes('PurchaseCostExceedsLimit')) return 'Price moved — please refresh and try again.'
  if (msg.includes('PrincipalManagerPaused') || msg.includes('Paused')) return 'Purchases are temporarily paused.'
  if (msg.includes('InsufficientSeatsAvailable')) return 'Not enough seats available. Reduce quantity.'
  if (msg.includes('User rejected')) return 'Transaction rejected.'
  return msg.slice(0, 120)
}
