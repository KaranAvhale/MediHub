import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useGovernmentAuth } from '../contexts/GovernmentAuthContext'
import GovernmentNavbar from '../components/GovernmentNavbar'
import GovernmentAnalytics from './GovernmentAnalytics'
import TranslatedText from '../components/TranslatedText'

const GovernmentDashboard = () => {
  const { isAuthenticated, loading } = useGovernmentAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/government" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GovernmentNavbar />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard/government/analytics" replace />} />
        <Route path="/analytics" element={<GovernmentAnalytics />} />
      </Routes>
    </div>
  )
}


export default GovernmentDashboard
