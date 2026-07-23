import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Seats } from './pages/Seats'
import { Links } from './pages/Links'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Land on SEATs by default. */}
        <Route index element={<Navigate to="/seats" replace />} />
        <Route path="seats" element={<Seats />} />
        <Route path="metrics" element={<Dashboard />} />
        <Route path="links" element={<Links />} />
        {/* Old /activity URLs redirect into the consolidated My Seats screen. */}
        <Route path="activity" element={<Navigate to="/seats" replace />} />
      </Route>
    </Routes>
  )
}
