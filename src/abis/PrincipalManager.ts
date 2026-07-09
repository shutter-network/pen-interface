export const PrincipalManagerAbi = [
  { name: 'totalManagedAssets', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'accountedPrincipal', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'availableYield', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'liquidAssets', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'deployedAssets', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'asset', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  {
    name: 'FundingExecuted',
    type: 'event',
    inputs: [
      { name: 'recipients', type: 'address[]', indexed: true },
      { name: 'amounts', type: 'uint256[]', indexed: false },
    ],
  },
] as const
