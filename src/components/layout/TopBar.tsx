import { useState } from 'react'
import { useChainId } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { WalletButtons } from './WalletButtons'

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

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

  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  )

  function toggleDark() {
    setDark(d => {
      const next = !d
      if (next) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
      localStorage.setItem('pen-theme', next ? 'dark' : 'light')
      return next
    })
  }

  return (
    <header className="sticky top-0 z-10 h-14 flex items-center justify-between px-4 md:px-6 border-b border-bone-200 dark:border-bone-800 bg-bone-50/80 dark:bg-bone-950/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenDrawer}
          className="md:hidden w-9 h-9 -ml-1 flex items-center justify-center rounded-lg text-bone-600 dark:text-bone-300 hover:bg-bone-100 dark:hover:bg-bone-800 transition-colors"
          aria-label="Open menu"
        >
          <BurgerIcon />
        </button>
        {isTestnet && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            Sepolia
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={toggleDark}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-bone-500 dark:text-bone-400 hover:bg-bone-100 dark:hover:bg-bone-800 transition-colors"
          aria-label="Toggle dark mode"
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>
        <WalletButtons />
      </div>
    </header>
  )
}
