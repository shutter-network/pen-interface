import { ConnectButton } from '@rainbow-me/rainbowkit'

export function WalletButtons() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated')

        return (
          <div
            {...(!ready && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' } })}
            className="flex items-center gap-2"
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-moss-500 hover:bg-moss-600 active:bg-moss-700 text-bone-950 transition-colors"
                  >
                    Connect wallet
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    Wrong network
                  </button>
                )
              }

              return (
                <>
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium border border-bone-200 bg-bone-50 hover:bg-bone-100 text-bone-800 transition-colors"
                    aria-label="Switch network"
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <img
                        src={chain.iconUrl}
                        alt={chain.name ?? 'chain'}
                        className="w-4 h-4 rounded-full"
                        style={chain.iconBackground ? { background: chain.iconBackground } : undefined}
                      />
                    )}
                    <span className="hidden sm:inline">{chain.name}</span>
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium border border-bone-200 bg-bone-50 hover:bg-bone-100 text-bone-800 transition-colors"
                  >
                    <span className="w-2 h-2 rounded-full bg-moss-400" aria-hidden />
                    <span className="tabular-nums">{account.displayName}</span>
                  </button>
                </>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
