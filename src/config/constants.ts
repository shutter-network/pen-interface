import { sepolia, mainnet } from 'wagmi/chains'

const EXPLORER_URL_ENV: Record<number, string | undefined> = {
  [sepolia.id]:  import.meta.env.VITE_SEPOLIA_EXPLORER_URL,
  [mainnet.id]:  import.meta.env.VITE_MAINNET_EXPLORER_URL,
}

export function getExplorerUrl(chainId: number): string {
  return (EXPLORER_URL_ENV[chainId] ?? '').replace(/\/$/, '')
}

// Block at which PrincipalManager was deployed, per chain.
// Used as the fromBlock for eth_getLogs — avoids scanning from genesis.
const DEPLOY_BLOCK_ENV: Record<number, string | undefined> = {
  [sepolia.id]:  import.meta.env.VITE_SEPOLIA_PRINCIPAL_MANAGER_DEPLOY_BLOCK,
  [mainnet.id]:  import.meta.env.VITE_MAINNET_PRINCIPAL_MANAGER_DEPLOY_BLOCK,
}

export function getDeployBlock(chainId: number): bigint {
  const raw = DEPLOY_BLOCK_ENV[chainId]
  if (!raw) return 0n
  return BigInt(raw)
}
