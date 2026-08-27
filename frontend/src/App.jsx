import React from 'react'
import { BrowserRouter, Navigate, Routes, Route, NavLink } from 'react-router-dom'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientPortal from './pages/PatientPortal'
import SurveillanceDashboard from './pages/SurveillanceDashboard'
import DoctorAuth from './pages/DoctorAuth'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
      )}
    </button>
  );
}

function AppContent() {
  const { isAuthenticated, logout } = useAuth();
  const navLinkClass = ({ isActive }) => 
    `text-sm font-medium transition-colors ${isActive ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400 pb-1' : 'text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-300'}`;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-casual tracking-tight">Rural Health Platform</h1>
              <nav className="mt-3 flex gap-6">
                {isAuthenticated && <NavLink to="/" className={navLinkClass}>Doctor Dashboard</NavLink>}
                <NavLink to="/scan" className={navLinkClass}>Patient Portal</NavLink>
                <NavLink to="/surveillance" className={navLinkClass}>Surveillance</NavLink>
                <NavLink to="/auth" className={navLinkClass}>Doctor Access</NavLink>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated && <button onClick={logout} className="text-sm font-semibold text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400">Logout</button>}
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={isAuthenticated ? <DoctorDashboard /> : <Navigate to="/auth" replace />} />
            <Route path="/scan" element={<PatientPortal />} />
            <Route path="/surveillance" element={<SurveillanceDashboard />} />
            <Route path="/auth" element={<DoctorAuth />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
