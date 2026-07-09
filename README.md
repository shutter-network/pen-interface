# PEN Frontend

Frontend for the **Perpetual Endowment Network** — a seat-based treasury protocol built on Ethereum. Members buy seats to join the endowment; the protocol invests the principal, distributes yield quarterly, and allows seat-holders to refund at a fixed price.

Built with React 19, wagmi v2, RainbowKit, and TanStack Query.

---

## Smart Contract Architecture

The protocol is composed of three contracts. Their addresses are configured per chain in `.env`.

### SeatToken

ERC-20 with 0 decimals — each unit represents one indivisible seat. Wallet balance = number of seats owned. The `BondingTranche` holds a privileged burn role used during refunds.

Key reads: `balanceOf(address)`, `totalSupply()`, `supplyCap()`

### BondingTranche

Controls seat pricing through a tranche system. Each tranche defines an upper seat count bound and a price per seat. As total supply crosses tranche boundaries, the price steps up.

Key reads:
- `asset()` — the ERC-20 payment token (e.g. USDC)
- `currentSeatPrice()` — price in the active tranche
- `refundPrice()` — fixed below-market price for redemptions
- `quotePurchase(quantity)` — exact cost for N seats at current price
- `quoteRefund(seats)` — exact payout for burning N seats
- `trancheCount()`, `tranche(i)` — tranche bounds and prices
- `purchase(recipient, quantity, maxCost)` — buy seats
- `refund(seats, recipient)` — burn seats and receive payment

### PrincipalManager

Treasury vault that manages the collected principal. Tracks liquid assets (in-contract) and deployed assets (in an ERC-4626 vault). Computes available yield above the principal obligation and disburses it to recipients via `executeFunding(recipients, amounts)`.

Key reads: `totalManagedAssets()`, `accountedPrincipal()`, `availableYield()`, `liquidAssets()`, `deployedAssets()`

Key event: `FundingExecuted(address[] recipients, uint256[] amounts)` — emitted on every disbursement round.

---

## Key User Flows

### Buy Seats

1. User sets quantity → `quotePurchase(quantity)` is called for an exact price quote
2. A 1% slippage buffer is applied: `maxCost = quotedCost + quotedCost * 100 / 10000`
3. If `allowance(user, bondingTranche) < maxCost`: prompt **Approve** first
4. After approval (or if already approved): call `purchase(userAddress, quantity, maxCost)`
5. On receipt confirmation: invalidate all queries (wallet balance, seat count, supply update)

The two-step state machine (`needs-approve → approving → ready → purchasing → success`) guards against step regression on refetch — for example, `allowance` going stale after a `queryClient.invalidateQueries()` cannot overwrite a terminal state.

### Refund Seats

1. User sets seat count → `quoteRefund(seats)` returns the payout amount
2. User confirms the price warning (refund price is materially below buy price)
3. Single call: `refund(seats, userAddress)` — no ERC-20 approval needed
   - The contract calls `seatToken.burn(msg.sender, seats)` using a privileged role, then transfers payment to the recipient
4. On receipt: invalidate all queries

Solvency check: the UI reads `totalManagedAssets() >= totalSupply() * refundPrice()` and disables the refund button when the treasury is insolvent.

### Dashboard

- **Seat stats**: `totalSupply`, `supplyCap`, `currentSeatPrice`, `refundPrice` — single multicall, 30-second auto-refresh
- **Tranche progress**: all tranches fetched via `useTranches`, rendered as a bar showing progress toward the next price step
- **Treasury stats**: `totalManagedAssets`, `accountedPrincipal`, `availableYield`, `liquidAssets`, `deployedAssets`
- **Disbursements**: `eth_getLogs` from `PRINCIPAL_MANAGER_DEPLOY_BLOCK` for `FundingExecuted` events. Block timestamps are fetched for the 5 most recent events so dates are shown. Falls back gracefully when the RPC caps the log range.

---

## Frontend Architecture

```
src/
├── main.tsx                 # Provider stack: wagmi → QueryClient → RainbowKit → Router
├── App.tsx                  # Routes: / → Dashboard, /seats → Seats
│
├── config/
│   ├── wagmi.ts             # getDefaultConfig (RainbowKit), connector patching
│   ├── contracts.ts         # Per-chain address resolution from env vars
│   └── constants.ts         # Slippage BPS, explorer URLs, deploy blocks, vote date
│
├── hooks/
│   ├── usePaymentAsset.ts   # Fetches asset address → symbol + decimals (3 RPC calls, shared/cached)
│   ├── useDashboard.ts      # 10-read multicall for overview stats
│   ├── useTranches.ts       # Reads all tranche bounds and prices
│   ├── useDisbursements.ts  # eth_getLogs + block timestamps for FundingExecuted events
│   ├── useBuySeats.ts       # Full buy state machine (quote → approve → purchase)
│   └── useRefundSeats.ts    # Full refund state machine (quote → refund)
│
├── components/
│   ├── layout/
│   │   ├── Layout.tsx       # Shell with Sidebar + TopBar + Outlet
│   │   ├── Sidebar.tsx      # Nav links, wallet seat count
│   │   └── TopBar.tsx       # Chain badge, dark mode toggle, RainbowKit ConnectButton
│   ├── dashboard/
│   │   ├── StatCard.tsx     # Reusable metric card with loading skeleton
│   │   └── TrancheProgress.tsx  # Tranche bar visualization
│   └── seats/
│       ├── BuyForm.tsx      # Approve + Buy UI driven by useBuySeats
│       └── RefundForm.tsx   # Refund UI driven by useRefundSeats
│
├── pages/
│   ├── Dashboard.tsx        # Overview page (stats + disbursements)
│   └── Seats.tsx            # Buy / Refund tabs
│
├── abis/                    # TypeScript ABI definitions for all three contracts + ERC-20
└── lib/
    └── format.ts            # formatAsset, formatAssetCompact, formatSeats, withSlippage, etc.
```

### Provider Stack

```
WagmiProvider (wagmiConfig)
  └── QueryClientProvider (TanStack Query)
        └── RainbowKitProvider (indigo theme, auto light/dark)
              └── BrowserRouter
                    └── App
```

### Data Fetching Pattern

`usePaymentAsset` is the shared foundation — it resolves the payment token address, symbol, and decimals in two chained RPC calls and is cached at the React Query level. All other hooks consume it rather than re-fetching independently.

Static and dynamic reads are kept in separate `useReadContracts` / `useReadContract` calls so that changing the user's input (quantity, seat count) only triggers a refetch of the quote — not the entire read batch. `keepPreviousData` on quote calls prevents the cost breakdown from disappearing while the new quote loads.

### Wallet Persistence Fix

wagmi v2 persists wallet connections to localStorage but strips connectors down to `{id, name, type, uid}`, removing all methods. On the next page load, wagmi's `getConnectorClient` calls `connector.getChainId()` unconditionally and throws before any write transaction can proceed.

`src/config/wagmi.ts` subscribes to the wagmi store and patches missing methods (`getChainId`, `getProvider`, `disconnect`, `emitter`) onto every connector as it appears in the connections map, ensuring transactions work immediately on page reload without waiting for a full reconnect cycle.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A wallet (MetaMask or any WalletConnect-compatible wallet)
- An RPC endpoint with high log limits (Alchemy or Infura) — public RPCs cap `eth_getLogs` range too tightly for the disbursements query

### Setup

```bash
npm install
cp .env.example .env
# fill in your values — see comments in .env.example
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_RPC_SEPOLIA` | Recommended | Alchemy/Infura Sepolia RPC — needed for disbursement log queries |
| `VITE_RPC_MAINNET` | Recommended | Alchemy/Infura Mainnet RPC |
| `VITE_SEPOLIA_SEAT_TOKEN` | Yes | SeatToken contract address on Sepolia |
| `VITE_SEPOLIA_BONDING_TRANCHE` | Yes | BondingTranche address on Sepolia |
| `VITE_SEPOLIA_PRINCIPAL_MANAGER` | Yes | PrincipalManager address on Sepolia |
| `VITE_SEPOLIA_PRINCIPAL_MANAGER_DEPLOY_BLOCK` | Recommended | Start block for log queries — avoids scanning from genesis |
| `VITE_SEPOLIA_EXPLORER_URL` | Optional | Block explorer base URL for transaction links (e.g. `https://sepolia.etherscan.io`) |
| `VITE_MAINNET_*` | Optional | Same set for mainnet — leave empty until deployed |

The payment asset address, symbol, and decimals are fetched on-chain from `BondingTranche.asset()` at runtime — they are not env vars.

### Chain Support

The app supports any chain that has contract addresses configured in `.env`. `getSupportedChains()` in `contracts.ts` determines which chains the RainbowKit modal offers. Switching chains in the wallet automatically re-resolves all contract addresses and re-fetches all data.

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 19 + Vite 8 |
| Wallet | wagmi v2, RainbowKit, viem v2 |
| Server state | TanStack Query v5 |
| Routing | React Router v6 |
| Styling | Tailwind CSS v4 |
