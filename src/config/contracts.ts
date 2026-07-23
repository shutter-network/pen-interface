import { sepolia, mainnet } from 'wagmi/chains'

export type ContractAddresses = {
  seatToken:        `0x${string}`
  bondingTranche:   `0x${string}`
  principalManager: `0x${string}`
  // The governing Safe multisig — optional, only surfaced for reference (Links tab).
  safe?:            `0x${string}`
}

function addr(value: string | undefined, name: string): `0x${string}` {
  if (!value) throw new Error(`Missing env var: ${name}`)
  if (!value.startsWith('0x')) throw new Error(`Invalid address in ${name}: ${value}`)
  return value as `0x${string}`
}

// Like addr() but returns undefined instead of throwing when the var is unset —
// for addresses that are informational rather than required for the app to run.
function optionalAddr(value: string | undefined): `0x${string}` | undefined {
  if (!value || !value.startsWith('0x')) return undefined
  return value as `0x${string}`
}

function buildAddresses(prefix: string): ContractAddresses {
  return {
    seatToken:        addr(import.meta.env[`VITE_${prefix}_SEAT_TOKEN`],        `VITE_${prefix}_SEAT_TOKEN`),
    bondingTranche:   addr(import.meta.env[`VITE_${prefix}_BONDING_TRANCHE`],   `VITE_${prefix}_BONDING_TRANCHE`),
    principalManager: addr(import.meta.env[`VITE_${prefix}_PRINCIPAL_MANAGER`], `VITE_${prefix}_PRINCIPAL_MANAGER`),
    safe:             optionalAddr(import.meta.env[`VITE_${prefix}_SAFE`]),
  }
}

const PREFIX: Record<number, string> = {
  [sepolia.id]:  'SEPOLIA',
  [mainnet.id]:  'MAINNET',
}

export function isSupportedChain(chainId: number): boolean {
  const prefix = PREFIX[chainId]
  if (!prefix) return false
  return !!import.meta.env[`VITE_${prefix}_SEAT_TOKEN`]
}

// Returns chain objects for every chain that has addresses configured in env
export function getSupportedChains(): typeof sepolia[] {
  return ([sepolia, mainnet] as typeof sepolia[]).filter(c => isSupportedChain(c.id))
}

const addressCache: Partial<Record<number, ContractAddresses>> = {}

export function getContracts(chainId: number): ContractAddresses {
  if (addressCache[chainId]) return addressCache[chainId]!

  let prefix: string
  if (chainId === sepolia.id) prefix = 'SEPOLIA'
  else if (chainId === mainnet.id) prefix = 'MAINNET'
  else throw new Error(`Unsupported chain: ${chainId}`)

  const contracts = buildAddresses(prefix)
  addressCache[chainId] = contracts
  return contracts
}
