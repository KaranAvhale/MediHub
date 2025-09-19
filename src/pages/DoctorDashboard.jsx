import React, { useState, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import DoctorNavbar from '../components/DoctorNavbar'
import AttendPatientModal from '../components/AttendPatientModal'
import PatientDetailsView from '../components/PatientDetailsView'
import DoctorEditProfileModal from '../components/DoctorEditProfileModal'
import TranslatedText from '../components/TranslatedText'

const DoctorDashboard = () => {
  const { user: clerkUser } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  const [doctorData, setDoctorData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentView, setCurrentView] = useState('dashboard') // dashboard, personal-info, patient-details
  const [showAttendModal, setShowAttendModal] = useState(false)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [attendedPatients, setAttendedPatients] = useState([])

  useEffect(() => {
    const fetchDoctorData = async () => {
      if (!clerkUser) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('clerk_user_id', clerkUser.id)
          .single()

        if (error && error.code === 'PGRST116') {
          // No profile found - redirect to profile form
          navigate('/profile/doctor')
          return
        }
        
        if (error) throw error
        if (data) {
          console.log('Doctor data from database:', JSON.stringify(data, null, 2));
          console.log('Qualifications type:', typeof data.qualifications, 'Value:', data.qualifications);
          console.log('Hospitals type:', typeof data.hospitals, 'Value:', data.hospitals);
          setDoctorData(data)
          // Fetch recent patient visits for this doctor
          await fetchRecentVisits(data.id)
        } else {
          // No data found - redirect to profile form
          navigate('/profile/doctor')
        }
      } catch (err) {
        console.error('Error fetching doctor data:', err)
        if (err.code === 'PGRST116') {
          // No profile found - redirect to profile form
          navigate('/profile/doctor')
        } else {
          setError('Failed to load doctor data')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDoctorData()
  }, [clerkUser, navigate])

  const fetchRecentVisits = async (doctorId) => {
    try {
      const { data: visits, error } = await supabase
        .from('doctor_patient_visits')
        .select(`
          *,
          patients (
            name,
            age,
            gender,
            aadhar_number,
            contact,
            blood_group,
            dob,
            address,
            ongoing_treatments,
            past_treatments,
            medical_history,
            report_url,
            patient_vaccinations
          )
        `)
        .eq('doctor_id', doctorId)
        .order('visited_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching recent visits:', error)
        return
      }

      if (visits) {
        const transformedVisits = visits.map(visit => ({
          aadhar: visit.patients.aadhar_number,
          name: visit.patients.name,
          age: visit.patients.age,
          gender: visit.patients.gender,
          contact: visit.patients.contact,
          bloodGroup: visit.patients.blood_group,
          dob: visit.patients.dob,
          address: visit.patients.address,
          ongoingTreatment: Array.isArray(visit.patients.ongoing_treatments) 
            ? visit.patients.ongoing_treatments 
            : (visit.patients.ongoing_treatments ? [visit.patients.ongoing_treatments] : []),
          pastTreatment: Array.isArray(visit.patients.past_treatments) 
            ? visit.patients.past_treatments 
            : (visit.patients.past_treatments ? [visit.patients.past_treatments] : []),
          medicalHistory: Array.isArray(visit.patients.medical_history) 
            ? visit.patients.medical_history 
            : (visit.patients.medical_history ? [visit.patients.medical_history] : []),
          report_url: visit.patients.report_url || {},
          reportUrls: visit.patients.report_url || {},
          patient_vaccinations: Array.isArray(visit.patients.patient_vaccinations) 
            ? visit.patients.patient_vaccinations 
            : (visit.patients.patient_vaccinations ? [visit.patients.patient_vaccinations] : []),
          attendedAt: visit.visited_at,
          attendedDate: new Date(visit.visited_at).toLocaleDateString(),
          attendedTime: new Date(visit.visited_at).toLocaleTimeString()
        }))
        setAttendedPatients(transformedVisits)
      }
    } catch (err) {
      console.error('Error fetching recent visits:', err)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleNavigation = (view) => {
    try {
      console.log('Navigating to view:', view);
      
      // Validate the view parameter
      const validViews = ['dashboard', 'personal-info', 'patient-details'];
      if (!validViews.includes(view)) {
        console.error('Invalid view:', view);
        return;
      }
      
      // If trying to view personal info but no doctor data is loaded
      if (view === 'personal-info' && !doctorData) {
        console.error('No doctor data available');
        // Optionally, you could fetch the data here or redirect to profile setup
        return;
      }
      
      console.log('Current doctorData:', doctorData);
      setCurrentView(view);
      setSelectedPatient(null);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  const handleAttendPatient = () => {
    setShowAttendModal(true)
  }

  const handleAadharSubmit = async (aadharNumber) => {
    try {
      // Fetch patient data from Supabase database
      const { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('aadhar_number', aadharNumber)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No patient found with this Aadhaar number
          alert('Patient not found with this Aadhaar number')
        } else {
          console.error('Error fetching patient:', error)
          alert('Error fetching patient details. Please try again.')
        }
        return
      }

      if (patient) {
        // Transform the data to match the expected format
        const updatedPatient = patient
        const transformedPatient = {
          id: updatedPatient.id, // Add database ID
          aadhar: updatedPatient.aadhar_number,
          name: updatedPatient.name,
          age: updatedPatient.age,
          gender: updatedPatient.gender,
          contact: updatedPatient.contact,
          bloodGroup: updatedPatient.blood_group,
          dob: updatedPatient.dob,
          address: updatedPatient.address,
          ongoing_treatments: Array.isArray(updatedPatient.ongoing_treatments) 
            ? updatedPatient.ongoing_treatments 
            : (updatedPatient.ongoing_treatments ? [updatedPatient.ongoing_treatments] : []),
          ongoingTreatment: Array.isArray(updatedPatient.ongoing_treatments) 
            ? updatedPatient.ongoing_treatments 
            : (updatedPatient.ongoing_treatments ? [updatedPatient.ongoing_treatments] : []),
          past_treatments: Array.isArray(updatedPatient.past_treatments) 
            ? updatedPatient.past_treatments 
            : (updatedPatient.past_treatments ? [updatedPatient.past_treatments] : []),
          pastTreatment: Array.isArray(updatedPatient.past_treatments) 
            ? updatedPatient.past_treatments 
            : (updatedPatient.past_treatments ? [updatedPatient.past_treatments] : []),
          medicalHistory: Array.isArray(updatedPatient.medical_history) 
            ? updatedPatient.medical_history 
            : (updatedPatient.medical_history ? [updatedPatient.medical_history] : []),
          report_url: updatedPatient.report_url || {},
          reportUrls: updatedPatient.report_url || {},
          labReports: Array.isArray(updatedPatient.lab_reports) 
            ? updatedPatient.lab_reports 
            : (updatedPatient.lab_reports ? [updatedPatient.lab_reports] : []),
          patient_vaccinations: Array.isArray(updatedPatient.patient_vaccinations) 
            ? updatedPatient.patient_vaccinations 
            : (updatedPatient.patient_vaccinations ? [updatedPatient.patient_vaccinations] : [])
        }

        setSelectedPatient(transformedPatient)
        setCurrentView('patient-details')
        setShowAttendModal(false)
        
        // Save visit to database and update local state
        await savePatientVisit(doctorData.id, updatedPatient.id, transformedPatient)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  const savePatientVisit = async (doctorId, patientId, patientData) => {
    try {
      // Check if visit already exists today
      const today = new Date().toISOString().split('T')[0]
      const { data: existingVisit, error: checkError } = await supabase
        .from('doctor_patient_visits')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('patient_id', patientId)
        .gte('visited_at', `${today}T00:00:00.000Z`)
        .lt('visited_at', `${today}T23:59:59.999Z`)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing visit:', checkError)
        return
      }

      // If no visit exists today, create new one
      if (!existingVisit) {
        const { error: insertError } = await supabase
          .from('doctor_patient_visits')
          .insert({
            doctor_id: doctorId,
            patient_id: patientId,
            visited_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error saving visit:', insertError)
          return
        }
      }

      // Update local state - add to beginning if not already present
      const isAlreadyAttended = attendedPatients.some(p => p.aadhar === patientData.aadhar)
      if (!isAlreadyAttended) {
        const attendedPatient = {
          ...patientData,
          attendedAt: new Date().toISOString(),
          attendedDate: new Date().toLocaleDateString(),
          attendedTime: new Date().toLocaleTimeString()
        }
        setAttendedPatients(prev => [attendedPatient, ...prev])
      }
    } catch (err) {
      console.error('Error saving patient visit:', err)
    }
  }

  const handleBackToDashboard = () => {
    setCurrentView('dashboard')
    setSelectedPatient(null)
  }

  const handleProfileUpdate = (updatedData) => {
    console.log('Profile updated with data:', updatedData)
    setDoctorData(updatedData)
  }

  if (!clerkUser && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access your dashboard.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Checking your profile status...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DoctorNavbar 
          doctorName={doctorData?.full_name || 'Doctor'}
          currentView={currentView}
          onNavigate={handleNavigation}
          onSignOut={handleSignOut}
        />
        <main className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavbar 
        doctorName={doctorData?.full_name || 'Doctor'}
        currentView={currentView}
        onNavigate={handleNavigation}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <main className="pt-16">
        {currentView === 'dashboard' && (
          <div className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Welcome Section */}
              <div className="text-center mb-12">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
                  <h1 className="text-3xl sm:text-4xl font-bold mb-4">
                    Welcome, Dr. {doctorData?.full_name || 'Doctor'}
                  </h1>
                  <p className="text-lg opacity-90">Ready to help your patients today</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex justify-center mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-sm w-full">
                  <div className="text-4xl font-bold text-blue-600 mb-3">{attendedPatients.length}</div>
                  <div className="text-gray-600 text-lg">Patients Attended Today</div>
                </div>
              </div>

              {/* Attend Patient Button */}
              <div className="flex justify-center mb-12">
                <button
                  onClick={handleAttendPatient}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl font-semibold px-12 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <span className="flex items-center">
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Attend Patient
                  </span>
                </button>
              </div>

              {/* Recent Patients Attended */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Recently Attended Patients</h2>
                {attendedPatients.length > 0 ? (
                  <div className="space-y-4">
                    {attendedPatients.slice(0, 5).map((patient, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{patient.name}</h3>
                            <p className="text-sm text-gray-600">Age: {patient.age} • {patient.gender}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{patient.attendedDate}</p>
                          <p className="text-xs text-gray-500">{patient.attendedTime}</p>
                        </div>
                      </div>
                    ))}
                    {attendedPatients.length > 5 && (
                      <div className="text-center pt-4">
                        <p className="text-sm text-gray-500">And {attendedPatients.length - 5} more patients...</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-500">No patients attended yet today</p>
                    <p className="text-sm text-gray-400">Start attending patients to see them here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {currentView === 'personal-info' && (
          !doctorData ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200 max-w-md w-full">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Data Not Available</h2>
                <p className="text-gray-600 mb-6">We couldn't load your profile information. Please try again or update your profile.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium mr-3"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => navigate('/profile/doctor')}
                  className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium"
                >
                  Update Profile
                </button>
              </div>
            </div>
          ) : (
          <div className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              {/* Header Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-8">
                  <div className="flex flex-col sm:flex-row items-center">
                    <div className="w-32 h-32 rounded-full bg-white/90 flex items-center justify-center text-5xl font-bold text-blue-600 mb-6 sm:mb-0 sm:mr-8">
                      {doctorData?.full_name ? doctorData.full_name.charAt(0) : 'D'}
                    </div>
                    <div className="text-center sm:text-left">
                      <h1 className="text-3xl font-bold text-white">Dr. {doctorData.full_name || 'Doctor'}</h1>
                      <p className="text-blue-100 text-lg mt-1">
                        {doctorData.specialization || 'General Practitioner'}
                        {doctorData.years_of_experience && ` • ${doctorData.years_of_experience} years experience`}
                      </p>
                      {doctorData.registration_number && (
                        <p className="text-blue-100 text-sm mt-1">
                          Registration: {doctorData.registration_number}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Personal Details */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Contact Information */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                      Contact Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                        <p className="mt-1 text-gray-900 break-all">
                          {clerkUser?.primaryEmailAddress?.emailAddress || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
                        <p className="mt-1 text-gray-900">
                          {doctorData.contact || 'Not provided'}
                        </p>
                      </div>
                      {doctorData.address && (
                        <div className="md:col-span-2">
                          <h3 className="text-sm font-medium text-gray-500">Address</h3>
                          <address className="mt-1 text-gray-900 not-italic">
                            {doctorData.address}
                          </address>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                      Personal Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                        <p className="mt-1 text-gray-900">{doctorData.full_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Gender</h3>
                        <p className="mt-1 text-gray-900">
                          {doctorData.gender ? doctorData.gender.charAt(0).toUpperCase() + doctorData.gender.slice(1) : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                        <p className="mt-1 text-gray-900">
                          {doctorData.dob ? new Date(doctorData.dob).toLocaleDateString() : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Age</h3>
                        <p className="mt-1 text-gray-900">
                          {doctorData.age ? `${doctorData.age} years` : 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Professional Information */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                      Professional Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Registration Number</h3>
                        <p className="mt-1 text-gray-900">{doctorData.registration_number || 'Not provided'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Years of Experience</h3>
                        <p className="mt-1 text-gray-900">
                          {doctorData.years_of_experience ? `${doctorData.years_of_experience} years` : 'Not specified'}
                        </p>
                      </div>
                      {doctorData.specialization && (
                        <div className="md:col-span-2">
                          <h3 className="text-sm font-medium text-gray-500">Specialization</h3>
                          <p className="mt-1 text-gray-900">{doctorData.specialization}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Qualifications */}
                  {doctorData.qualifications && Array.isArray(doctorData.qualifications) && doctorData.qualifications.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Qualifications</h2>
                      </div>
                      <div className="space-y-4">
                        {doctorData.qualifications.map((qual, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                            <h3 className="font-medium text-gray-900">{qual.degree || 'Degree'}</h3>
                            <p className="text-sm text-gray-600">
                              {qual.college}
                              {qual.year && `, ${qual.year}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hospital Affiliations */}
                  {doctorData.hospitals && Array.isArray(doctorData.hospitals) && doctorData.hospitals.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Hospital Affiliations</h2>
                      </div>
                      <div className="space-y-4">
                        {doctorData.hospitals.map((hospital, index) => (
                          <div key={index} className="border-l-4 border-purple-500 pl-4 py-3">
                            <h3 className="font-medium text-gray-900">{hospital.name}</h3>
                            <p className="text-sm text-gray-600">
                              {hospital.department}
                              {hospital.joiningDate && ` • Since ${new Date(hospital.joiningDate).getFullYear()}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Summary */}
                <div className="space-y-8">
                  {/* Profile Summary */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Summary</h2>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profile Status</span>
                        <span className="text-green-600 font-medium">Complete</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registration</span>
                        <span className="text-blue-600 font-medium">Verified</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Experience</span>
                        <span className="text-gray-900 font-medium">
                          {doctorData.years_of_experience ? `${doctorData.years_of_experience} years` : 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowEditProfileModal(true)}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Profile
                      </button>
                      <button
                        onClick={() => setCurrentView('dashboard')}
                        className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h2a2 2 0 012 2v0M8 5a2 2 0 012-2h2a2 2 0 012 2v0" />
                        </svg>
                        Back to Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          )
        )}

        {currentView === 'patient-details' && selectedPatient && (
          <PatientDetailsView 
            patient={selectedPatient}
            onBack={handleBackToDashboard}
          />
        )}
      </main>

      {/* Attend Patient Modal */}
      <AttendPatientModal
        isOpen={showAttendModal}
        onClose={() => setShowAttendModal(false)}
        onAadharSubmit={handleAadharSubmit}
      />

      {/* Edit Profile Modal */}
      <DoctorEditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        doctorData={doctorData}
        onUpdate={handleProfileUpdate}
      />
    </div>
  )
}

export default DoctorDashboard



