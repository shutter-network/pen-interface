import { useState } from 'react'
import { BuyForm } from '../components/seats/BuyForm'
import { RefundForm } from '../components/seats/RefundForm'
import { ActivityView } from '../components/seats/ActivityView'

type Tab = 'activity' | 'buy' | 'refund'

const TABS: { key: Tab; label: string }[] = [
  { key: 'activity', label: 'Activity' },
  { key: 'buy',      label: 'Buy' },
  { key: 'refund',   label: 'Refund' },
]

export function Seats() {
  const [tab, setTab] = useState<Tab>('activity')

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-bone-900 dark:text-white">My Seats</h1>
          <p className="text-sm text-bone-500 dark:text-bone-400 mt-0.5">
            Your activity, purchases, and refunds
          </p>
        </div>

        <div>
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-bone-100 dark:bg-bone-900 rounded-xl mb-6">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
                  tab === key
                    ? 'bg-bone-50 dark:bg-bone-800 text-bone-900 dark:text-white shadow-sm'
                    : 'text-bone-500 dark:text-bone-400 hover:text-bone-700 dark:hover:text-bone-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div className="rounded-2xl border border-bone-200 dark:border-bone-800 bg-bone-50 dark:bg-bone-900 p-6">
            {tab === 'activity' && <ActivityView onGoToBuy={() => setTab('buy')} />}
            {tab === 'buy'      && <BuyForm />}
            {tab === 'refund'   && <RefundForm />}
          </div>
        </div>
      </div>
    </div>
  )
}
