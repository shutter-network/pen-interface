import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useChainId } from 'wagmi'
import { useSwitchChain } from 'wagmi'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { WalletButtons } from './WalletButtons'
import { isSupportedChain, getSupportedChains } from '../../config/contracts'

function WrongNetwork() {
  const { switchChain } = useSwitchChain()
  const supported = getSupportedChains()
  const names = supported.map(c => c.name).join(' or ')

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-bone-950 mb-1">Wrong network</h2>
        <p className="text-sm text-bone-500 mb-6">
          Please switch to {names} to continue.
        </p>
        <div className="flex flex-col gap-2">
          {supported.map(c => (
            <button
              key={c.id}
              onClick={() => switchChain({ chainId: c.id })}
              className="px-5 py-2.5 rounded-xl bg-moss-500 hover:bg-moss-600 text-bone-950 text-sm font-semibold transition-colors"
            >
              Switch to {c.name}
            </button>
          ))}
        </div>
      </div>
      <div className="absolute top-4 right-4">
        <WalletButtons />
      </div>
    </div>
  )
}

export function Layout() {
  const chainId = useChainId()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()

  // Auto-close drawer on route change.
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  // ESC closes the drawer.
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  if (!isSupportedChain(chainId)) return <WrongNetwork />

  return (
    <div className="min-h-screen bg-white">
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Mobile backdrop */}
      {drawerOpen && (
        <button
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
          className="md:hidden fixed inset-0 z-30 bg-bone-950/60 backdrop-blur-[2px] cursor-default"
        />
      )}

      <div className="md:ml-[220px] flex flex-col min-h-screen">
        <TopBar onOpenDrawer={() => setDrawerOpen(true)} />
        <main className="flex-1 p-4 md:p-6 max-w-4xl">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
