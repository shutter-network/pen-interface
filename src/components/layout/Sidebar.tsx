import { NavLink } from 'react-router-dom'
import shutterLogo from '../../assets/shutter.png'
import { useAccount, useChainId } from 'wagmi'
import { useReadContracts } from 'wagmi'
import { SeatTokenAbi } from '../../abis/SeatToken'
import { getContracts } from '../../config/contracts'
import { formatSeats } from '../../lib/format'

const NAV = [
  { to: '/',      label: 'Overview',  icon: '◎' },
  { to: '/seats', label: 'My Seats',  icon: '◈' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { address } = useAccount()
  const chainId = useChainId()
  const c = getContracts(chainId)

  const { data } = useReadContracts({
    contracts: [
      { address: c.seatToken, abi: SeatTokenAbi, functionName: 'balanceOf', args: [address ?? '0x0000000000000000000000000000000000000000'] },
      { address: c.seatToken, abi: SeatTokenAbi, functionName: 'totalSupply' },
    ],
    query: { enabled: !!address },
  })

  const balance     = data?.[0]?.result as bigint | undefined
  const totalSupply = data?.[1]?.result as bigint | undefined

  return (
    <aside
      className={`fixed top-0 left-0 h-full w-[220px] flex flex-col border-r border-bone-200 dark:border-bone-800 bg-bone-50 dark:bg-bone-950 z-40 transform transition-transform duration-200 ease-out md:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Space header */}
      <div className="p-5 border-b border-bone-200 dark:border-bone-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-bone-50 dark:bg-bone-900">
            <img src={shutterLogo} alt="Shutter" className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-bone-900 dark:text-white leading-tight">Shutter PEN</div>
            <div className="text-xs text-bone-500 dark:text-bone-400">Endowment Network</div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden w-8 h-8 -mr-1 flex items-center justify-center rounded-lg text-bone-500 dark:text-bone-400 hover:bg-bone-100 dark:hover:bg-bone-900 transition-colors"
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>
        </div>
        {totalSupply !== undefined && (
          <div className="text-xs text-bone-500 dark:text-bone-400">
            {formatSeats(totalSupply)} seat{totalSupply !== 1n ? 's' : ''} sold
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-moss-50 dark:bg-moss-950 text-moss-600 dark:text-moss-400'
                  : 'text-bone-600 dark:text-bone-400 hover:bg-bone-100 dark:hover:bg-bone-900 hover:text-bone-900 dark:hover:text-white'
              }`
            }
          >
            <span className="text-base leading-none">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Member summary */}
      {address && balance !== undefined && (
        <div className="p-4 border-t border-bone-200 dark:border-bone-800">
          <div className="text-xs text-bone-400 dark:text-bone-500 mb-1">Your seats</div>
          <div className="text-xl font-bold text-bone-900 dark:text-white tabular-nums">{formatSeats(balance)}</div>
          {balance === 0n && (
            <NavLink to="/seats" onClick={onClose} className="mt-2 block text-xs text-moss-500 hover:text-moss-600 dark:hover:text-moss-400">
              Buy seats →
            </NavLink>
          )}
        </div>
      )}
    </aside>
  )
}
