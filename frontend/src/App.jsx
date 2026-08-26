import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientPortal from './pages/PatientPortal'
import SurveillanceDashboard from './pages/SurveillanceDashboard'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-xl font-bold text-gray-900">Rural Health Platform</h1>
            <nav className="mt-2 flex gap-4">
              <a href="/" className="text-sm text-blue-600 hover:text-blue-800">Doctor Dashboard</a>
              <a href="/scan" className="text-sm text-blue-600 hover:text-blue-800">Patient Portal</a>
              <a href="/surveillance" className="text-sm text-blue-600 hover:text-blue-800">Surveillance</a>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<DoctorDashboard />} />
            <Route path="/scan" element={<PatientPortal />} />
            <Route path="/surveillance" element={<SurveillanceDashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
