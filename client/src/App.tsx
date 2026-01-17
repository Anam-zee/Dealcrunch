import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AuthPage } from './features/auth/AuthPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { NewDealPage } from './features/dashboard/NewDealPage'
import { DealPage } from './features/calculator/DealPage'
import { ImportPage } from './features/import/ImportPage'
import { SharedDealPage } from './features/dashboard/SharedDealPage'

function Nav({ onLogout }: { onLogout: () => void }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-6">
        <Link to="/" className="text-base font-bold text-indigo-600">DealCrunch</Link>
        <nav className="flex items-center gap-4 text-sm text-gray-600">
          <Link to="/" className="hover:text-gray-900">Deals</Link>
          <Link to="/import" className="hover:text-gray-900">Import</Link>
        </nav>
        <button
          onClick={onLogout}
          className="ml-auto text-sm text-gray-500 hover:text-gray-900"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}

export default function App() {
  const { authed, login, register, logout } = useAuth()

  if (!authed) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/shared/:token" element={<SharedDealPage />} />
          <Route path="*" element={<AuthPage onLogin={login} onRegister={register} />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Nav onLogout={logout} />
      <main className="min-h-[calc(100vh-3.5rem)] bg-gray-50">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/new" element={<NewDealPage />} />
          <Route path="/deals/:id" element={<DealPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/shared/:token" element={<SharedDealPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}
