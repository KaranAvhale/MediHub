import React, { useState, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import LabNavbar from '../components/LabNavbar'
import LabInfo from '../components/LabInfo'
import LabReports from '../components/LabReports'
import TranslatedText from '../components/TranslatedText'

const LabDashboard = () => {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [labData, setLabData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchLabData()
    }
  }, [user])

  const fetchLabData = async () => {
    try {
      const { data, error } = await supabase
        .from('labs')
        .select('*')
        .eq('clerk_user_id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // No profile found - redirect to profile form
        navigate('/profile/lab')
        return
      }
      
      if (error) throw error
      
      if (data) {
        setLabData(data)
      } else {
        // No data found - redirect to profile form
        navigate('/profile/lab')
      }
    } catch (error) {
      console.error('Error fetching lab data:', error)
      if (error.code === 'PGRST116') {
        // No profile found - redirect to profile form
        navigate('/profile/lab')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <LabNavbar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onSignOut={handleSignOut}
        labName={labData?.lab_name}
      />

      <main className="pt-16">
        {currentPage === 'dashboard' && (
          <LabReports labData={labData} />
        )}
        {currentPage === 'info' && (
          <LabInfo labData={labData} onDataUpdate={fetchLabData} />
        )}
      </main>
    </div>
  )
}

export default LabDashboard
