import { useChainId } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { WalletButtons } from './WalletButtons'

function BurgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}

interface TopBarProps {
  onOpenDrawer: () => void
}

export function TopBar({ onOpenDrawer }: TopBarProps) {
  const chainId = useChainId()
  const isTestnet = chainId === sepolia.id

  return (
    <header className="sticky top-0 z-10 h-16 flex items-center justify-between px-4 md:px-6 bg-brand-600 text-white shadow-lg">
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenDrawer}
          className="md:hidden w-9 h-9 -ml-1 flex items-center justify-center rounded-lg text-white/90 hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <BurgerIcon />
        </button>
        {isTestnet && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 border border-amber-500">
            Sepolia
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <WalletButtons />
      </div>
    </header>
  )
}
