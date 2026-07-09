import { usePublicClient, useChainId } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { parseAbiItem, type PublicClient } from 'viem'
import { formatUnits } from 'viem'
import { getContracts } from '../config/contracts'
import { getDeployBlock } from '../config/constants'
import { usePaymentAsset } from './usePaymentAsset'

const FUNDING_EXECUTED_EVENT = parseAbiItem(
  'event FundingExecuted(address[] indexed recipients, uint256[] amounts)'
)

const CHUNK_SIZE = 5_000n

async function getLogsChunked(
  client: PublicClient,
  address: `0x${string}`,
  fromBlock: bigint,
) {
  const latest = await client.getBlockNumber()

  // Try full range first — works on Alchemy / Infura with high limits
  try {
    return await client.getLogs({ address, event: FUNDING_EXECUTED_EVENT, fromBlock, toBlock: latest })
  } catch {
    // Fall back to 5k-block chunks — works on all providers
    const logs = []
    let from = fromBlock
    while (from <= latest) {
      const to = from + CHUNK_SIZE - 1n < latest ? from + CHUNK_SIZE - 1n : latest
      try {
        const chunk = await client.getLogs({
          address,
          event: FUNDING_EXECUTED_EVENT,
          fromBlock: from,
          toBlock: to,
        })
        logs.push(...chunk)
      } catch {
        // skip a failed chunk rather than aborting the whole query
      }
      from = to + 1n
    }
    return logs
  }
}

export function useDisbursements() {
  const chainId = useChainId()
  const c = getContracts(chainId)
  const client = usePublicClient()
  const { data: asset } = usePaymentAsset()

  const fromBlock = getDeployBlock(chainId)
  const decimals = asset?.decimals ?? 6
  const symbol   = asset?.symbol   ?? ''

  return useQuery({
    queryKey: ['disbursements', chainId, c.principalManager, symbol],
    queryFn: async () => {
      if (!client) return { total: 0n, count: 0, events: [] }

      const logs = await getLogsChunked(client, c.principalManager, fromBlock)

      let total = 0n
      const chronological = logs.map((log) => {
        const amounts = (log.args.amounts ?? []) as bigint[]
        const sum = amounts.reduce((a, b) => a + b, 0n)
        total += sum
        return {
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          amounts,
          recipientCount: amounts.length,
          total: sum,
          totalFormatted: `${parseFloat(formatUnits(sum, decimals)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`,
          timestamp: null as number | null,
        }
      })

      // Newest-first for the UI. .reverse() on a fresh array (from map) is
      // safe; the intent is clearer than mutating a variable we also alias.
      const newestFirst = [...chronological].reverse()

      // Fetch block timestamps for the 5 most-recent events shown in the UI.
      // Returned via a new object rather than mutating `newestFirst[i]`.
      const timestamps = await Promise.all(
        newestFirst.slice(0, 5).map(async (ev) => {
          if (!ev.blockNumber) return null
          try {
            const block = await client.getBlock({ blockNumber: ev.blockNumber })
            return Number(block.timestamp) * 1000
          } catch {
            return null
          }
        })
      )

      const events = newestFirst.map((ev, i) =>
        i < timestamps.length ? { ...ev, timestamp: timestamps[i] } : ev
      )

      return { total, count: logs.length, events }
    },
    staleTime: 60_000,
    retry: 1,
  })
}
