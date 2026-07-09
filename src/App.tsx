import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Seats } from './pages/Seats'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="seats" element={<Seats />} />
        {/* Old /activity URLs redirect into the consolidated My Seats screen. */}
        <Route path="activity" element={<Navigate to="/seats" replace />} />
      </Route>
    </Routes>
  )
}
