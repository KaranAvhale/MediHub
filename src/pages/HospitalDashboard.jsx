import React, { useState, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import HospitalNavbar from '../components/HospitalNavbar'
import HospitalInfo from '../components/HospitalInfo'
import HospitalReports from '../components/HospitalReports'
import TranslatedText from '../components/TranslatedText'

const HospitalDashboard = () => {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [hospitalData, setHospitalData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchHospitalData()
    }
  }, [user])

  const fetchHospitalData = async () => {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('clerk_user_id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // No profile found - redirect to profile form
        navigate('/profile/hospital')
        return
      }
      
      if (error) throw error
      
      if (data) {
        setHospitalData(data)
      } else {
        // No data found - redirect to profile form
        navigate('/profile/hospital')
      }
    } catch (error) {
      console.error('Error fetching hospital data:', error)
      if (error.code === 'PGRST116') {
        // No profile found - redirect to profile form
        navigate('/profile/hospital')
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
      <HospitalNavbar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onSignOut={handleSignOut}
        hospitalName={hospitalData?.hospital_name}
      />

      <main className="pt-16">
        {currentPage === 'dashboard' && (
          <HospitalReports hospitalData={hospitalData} />
        )}
        {currentPage === 'info' && (
          <HospitalInfo hospitalData={hospitalData} onDataUpdate={fetchHospitalData} />
        )}
      </main>
    </div>
  )
}

export default HospitalDashboard
