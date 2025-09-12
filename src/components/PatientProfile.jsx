import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import TreatmentHistoryModal from './TreatmentHistoryModal'
import HospitalAdmissions from './HospitalAdmissions'

const PatientProfile = () => {
  const [patientData, setPatientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [showTreatmentHistoryModal, setShowTreatmentHistoryModal] = useState(false)
  const [selectedTreatmentForHistory, setSelectedTreatmentForHistory] = useState(null)
  const [treatmentHistory, setTreatmentHistory] = useState([])

  const fetchPatientData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError('')

    try {
      // First try to get from localStorage
      const fromLocal = localStorage.getItem('patientData')
      if (fromLocal && !isRefresh) {
        const parsed = JSON.parse(fromLocal)
        console.log('Loaded from localStorage:', parsed)
        console.log('LocalStorage vaccinations:', parsed.patient_vaccinations)
        
        setPatientData(parsed)
        setLoading(false)
        return
      }

      // If refresh or no local data, fetch from database
      if (fromLocal) {
        const localData = JSON.parse(fromLocal)
        const { data, error } = await supabase
          .from('patients')
          .select('*, patient_vaccinations')
          .eq('id', localData.id)
          .single()

        if (error) {
          throw error
        }

        if (data) {
          console.log('Fetched patient data:', data)
          console.log('Patient vaccinations:', data.patient_vaccinations)
          
          // Ensure patient_vaccinations is properly formatted as an array
          if (data.patient_vaccinations && !Array.isArray(data.patient_vaccinations)) {
            data.patient_vaccinations = [data.patient_vaccinations]
          } else if (!data.patient_vaccinations) {
            data.patient_vaccinations = []
          }
          
          setPatientData(data)
          localStorage.setItem('patientData', JSON.stringify(data))
        } else {
          setError('Patient profile not found')
        }
      } else {
        setError('No patient data available. Please sign in again.')
      }
    } catch (err) {
      console.error('Error fetching patient data:', err)
      setError('Failed to load patient data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPatientData()
  }, [])

  const handleRefresh = () => {
    fetchPatientData(true)
  }

  const handleViewTreatmentHistory = async (treatment) => {
    try {
      // Get treatment history from ongoing_treatment_past column
      const { data: fetchedPatientData, error } = await supabase
        .from('patients')
        .select('ongoing_treatment_past')
        .eq('id', patientData.id)
        .single()

      if (error) throw error

      // Filter history for this specific treatment
      const treatmentId = treatment.id || treatment.treatmentName || treatment.name
      const allHistory = fetchedPatientData.ongoing_treatment_past || []
      const filteredHistory = allHistory.filter(historyItem => 
        historyItem.treatmentId === treatmentId ||
        historyItem.treatmentName === (treatment.treatmentName || treatment.name)
      )

      setSelectedTreatmentForHistory(treatment)
      setTreatmentHistory(filteredHistory)
      setShowTreatmentHistoryModal(true)
    } catch (err) {
      console.error('Error fetching treatment history:', err)
      alert('Failed to load treatment history. Please try again.')
    }
  }

  const handleViewPastTreatmentHistory = async (treatment) => {
    try {
      // Fetch past treatment history from past_treatments_past column
      const { data: fetchedPatientData, error: fetchError } = await supabase
        .from('patients')
        .select('past_treatments_past')
        .eq('id', patientData.id)
        .single()

      if (fetchError) {
        console.error('Error fetching past treatment history:', fetchError)
        alert('Failed to load treatment history. Please try again.')
        return
      }

      // Filter history for this specific treatment
      const treatmentId = treatment.id || treatment.treatmentName || treatment.name
      const pastTreatmentHistory = (fetchedPatientData.past_treatments_past || []).filter(historyItem => {
        return historyItem.treatmentId === treatmentId ||
               historyItem.treatmentName === (treatment.treatmentName || treatment.name)
      })

      // Create a treatment object with past history
      const treatmentWithHistory = {
        ...treatment,
        isPastTreatment: true,
        pastHistory: pastTreatmentHistory
      }

      setSelectedTreatmentForHistory(treatmentWithHistory)
      setTreatmentHistory(pastTreatmentHistory)
      setShowTreatmentHistoryModal(true)
    } catch (err) {
      console.error('Error viewing past treatment history:', err)
      alert('Failed to load treatment history. Please try again.')
    }
  }

  const calculateAge = (dob) => {
    if (!dob) return 'N/A'
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderJsonList = (jsonData, emptyMessage = 'No data available') => {
    if (!jsonData) return <p className="text-gray-500 italic">{emptyMessage}</p>
    
    if (typeof jsonData === 'string') {
      try {
        jsonData = JSON.parse(jsonData)
      } catch {
        return <p className="text-gray-900">{jsonData}</p>
      }
    }

    if (Array.isArray(jsonData)) {
      if (jsonData.length === 0) {
        return <p className="text-gray-500 italic">{emptyMessage}</p>
      }
      return (
        <ul className="space-y-2">
          {jsonData.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              <span className="text-gray-900">{typeof item === 'object' ? JSON.stringify(item) : item}</span>
            </li>
          ))}
        </ul>
      )
    }

    if (typeof jsonData === 'object') {
      return (
        <div className="space-y-2">
          {Object.entries(jsonData).map(([key, value]) => (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center">
              <span className="font-medium text-gray-700 sm:w-1/3">{key}:</span>
              <span className="text-gray-900 sm:w-2/3">{typeof value === 'object' ? JSON.stringify(value) : value}</span>
            </div>
          ))}
        </div>
      )
    }

    return <p className="text-gray-900">{jsonData}</p>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!patientData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No patient data available. Please sign in again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center mb-6 lg:mb-0">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mr-6 shadow-lg">
                {patientData.name ? patientData.name.charAt(0).toUpperCase() : 'P'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{patientData.name || 'Patient'}</h1>
                <p className="text-gray-600 text-lg mb-3">Personal Health Dashboard</p>
                <div className="flex flex-wrap gap-3">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {calculateAge(patientData.dob)} years old
                  </span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {patientData.gender || 'N/A'}
                  </span>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    {patientData.blood_group || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center"
            >
              <svg className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Personal Details */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Personal Details</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Full Name</h3>
                  <p className="text-gray-900 font-medium">{patientData.name || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Date of Birth</h3>
                  <p className="text-gray-900 font-medium">{formatDate(patientData.dob)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Age</h3>
                  <p className="text-gray-900 font-medium">{calculateAge(patientData.dob)} years</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Gender</h3>
                  <p className="text-gray-900 font-medium">{patientData.gender || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Blood Group</h3>
                  <p className="text-gray-900 font-medium">{patientData.blood_group || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Contact</h3>
                  <p className="text-gray-900 font-medium">{patientData.contact || 'N/A'}</p>
                </div>
              </div>
              
              {patientData.address && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                  <p className="text-gray-900">{patientData.address}</p>
                </div>
              )}
            </div>
          </div>


          {/* Ongoing Treatments */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Ongoing Treatments</h2>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
              {patientData.ongoing_treatments && Array.isArray(patientData.ongoing_treatments) && patientData.ongoing_treatments.length > 0 ? (
                patientData.ongoing_treatments.map((treatment, index) => {
                  const displayText = typeof treatment === 'string' ? treatment : 
                                     typeof treatment === 'object' ? (treatment.treatmentName || treatment.name || 'Treatment') : 
                                     String(treatment);
                  
                  return (
                    <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-blue-900 mb-1">{displayText}</h4>
                          {typeof treatment === 'object' && treatment.description && (
                            <p className="text-sm text-blue-700 mb-2">{treatment.description}</p>
                          )}
                          {typeof treatment === 'object' && treatment.startDate && (
                            <p className="text-xs text-blue-600">Started: {new Date(treatment.startDate).toLocaleDateString()}</p>
                          )}
                          {typeof treatment === 'object' && treatment.followUpDate && (
                            <p className="text-xs text-blue-600">Follow-up: {new Date(treatment.followUpDate).toLocaleDateString()}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleViewTreatmentHistory(treatment)}
                          className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          History
                        </button>
                      </div>
                      
                      {/* Treatment Details */}
                      {typeof treatment === 'object' && (
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          {treatment.prescriptions && treatment.prescriptions.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-blue-800 mb-2">Current Prescriptions:</h5>
                              <div className="space-y-2">
                                {treatment.prescriptions.map((prescription, pIndex) => (
                                  <div key={pIndex} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                    <p className="font-medium text-blue-900">{prescription.medicineName}</p>
                                    <p className="text-sm text-blue-700">
                                      {prescription.dose} {prescription.quantity && `• Qty: ${prescription.quantity}`} {prescription.frequency && prescription.frequency.length > 0 && 
                                        `• ${prescription.frequency.join(', ')}`}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {treatment.notes && (
                            <div>
                              <h5 className="text-sm font-medium text-blue-800 mb-2">Notes:</h5>
                              <p className="text-blue-700 bg-blue-50 rounded-lg p-3 border border-blue-200 text-sm">
                                {treatment.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Ongoing Treatments</h4>
                  <p className="text-gray-600">You currently have no active treatments.</p>
                </div>
              )}
            </div>
          </div>

          {/* Past Treatments */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Past Treatments</h2>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
              {patientData.past_treatments && Array.isArray(patientData.past_treatments) && patientData.past_treatments.length > 0 ? (
                patientData.past_treatments.map((treatment, index) => {
                  const displayText = typeof treatment === 'string' ? treatment : 
                                     typeof treatment === 'object' ? (treatment.treatmentName || treatment.name || 'Treatment') : 
                                     String(treatment);
                  
                  return (
                    <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                            <h4 className="text-lg font-semibold text-green-900">{displayText}</h4>
                          </div>
                          {typeof treatment === 'object' && treatment.description && (
                            <p className="text-sm text-green-700 mb-2 ml-6">{treatment.description}</p>
                          )}
                          <div className="ml-6 space-y-1">
                            {typeof treatment === 'object' && treatment.startDate && (
                              <p className="text-xs text-green-600">Started: {new Date(treatment.startDate).toLocaleDateString()}</p>
                            )}
                            {typeof treatment === 'object' && treatment.completedDate && (
                              <p className="text-xs text-green-600 font-medium">Completed: {new Date(treatment.completedDate).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewPastTreatmentHistory(treatment)}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            History
                          </button>
                          <div className="text-green-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      {/* Treatment Details */}
                      {typeof treatment === 'object' && (
                        <div className="mt-4 pt-4 border-t border-green-200 ml-6">
                          {treatment.prescriptions && treatment.prescriptions.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-green-800 mb-2">Final Prescriptions:</h5>
                              <div className="space-y-2">
                                {treatment.prescriptions.map((prescription, pIndex) => (
                                  <div key={pIndex} className="bg-green-50 rounded-lg p-3 border border-green-200">
                                    <p className="font-medium text-green-900">{prescription.medicineName}</p>
                                    <p className="text-sm text-green-700">
                                      {prescription.dose} {prescription.quantity && `• Qty: ${prescription.quantity}`} {prescription.frequency && prescription.frequency.length > 0 && 
                                        `• ${prescription.frequency.join(', ')}`}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {treatment.notes && (
                            <div>
                              <h5 className="text-sm font-medium text-green-800 mb-2">Final Notes:</h5>
                              <p className="text-green-700 bg-green-50 rounded-lg p-3 border border-green-200 text-sm">
                                {treatment.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Past Treatments</h4>
                  <p className="text-gray-600">You have no completed treatments on record.</p>
                </div>
              )}
            </div>
          </div>

          {/* Vaccinations */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Vaccinations</h2>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
              {patientData.patient_vaccinations && Array.isArray(patientData.patient_vaccinations) && patientData.patient_vaccinations.length > 0 ? (
                patientData.patient_vaccinations
                  .sort((a, b) => {
                    // Sort by vaccination date (newest first)
                    const dateA = new Date(a.vaccination_date || a.dateAdministered || a.date || 0)
                    const dateB = new Date(b.vaccination_date || b.dateAdministered || b.date || 0)
                    return dateB - dateA
                  })
                  .map((vaccination, index) => {
                    // Use the same field mapping as PatientDetailsView for consistency
                    const vaccineName = vaccination.vaccine_name || vaccination.vaccineName || vaccination.name || 'Vaccination'
                    const vaccinationDate = vaccination.vaccination_date || vaccination.dateAdministered || vaccination.date
                    const administeredBy = vaccination.administered_by || vaccination.administeredBy || vaccination.doctor || vaccination.hospital
                    const batchNumber = vaccination.batch_number || vaccination.batchNumber
                    const nextDue = vaccination.next_due_date || vaccination.nextDueDate
                    const manufacturer = vaccination.manufacturer
                    const sideEffects = vaccination.side_effects || vaccination.sideEffects
                    const notes = vaccination.notes
                    
                    return (
                      <div key={index} className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 hover:from-emerald-100 hover:to-teal-100 transition-all duration-200 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                              <h4 className="text-lg font-semibold text-emerald-900">{vaccineName}</h4>
                            </div>
                            <div className="ml-6 space-y-1">
                              {vaccinationDate && (
                                <p className="text-sm text-emerald-700">
                                  <span className="font-medium">Date:</span> {new Date(vaccinationDate).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              )}
                              {administeredBy && (
                                <p className="text-sm text-emerald-700">
                                  <span className="font-medium">Administered by:</span> {administeredBy}
                                </p>
                              )}
                              {batchNumber && (
                                <p className="text-sm text-emerald-700">
                                  <span className="font-medium">Batch Number:</span> {batchNumber}
                                </p>
                              )}
                              {nextDue && (
                                <p className="text-sm text-emerald-700">
                                  <span className="font-medium">Next Due:</span> {new Date(nextDue).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-emerald-600">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        
                        {/* Vaccination Details */}
                        <div className="mt-4 pt-4 border-t border-emerald-200 ml-6">
                          {manufacturer && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-emerald-800 mb-2">Manufacturer:</h5>
                              <p className="text-emerald-700 bg-emerald-50 rounded-lg p-3 border border-emerald-200 text-sm">
                                {manufacturer}
                              </p>
                            </div>
                          )}
                          
                          {sideEffects && (
                            <div className="mb-3">
                              <h5 className="text-sm font-medium text-emerald-800 mb-2">Reported Side Effects:</h5>
                              <p className="text-emerald-700 bg-emerald-50 rounded-lg p-3 border border-emerald-200 text-sm">
                                {sideEffects}
                              </p>
                            </div>
                          )}
                          
                          {notes && (
                            <div>
                              <h5 className="text-sm font-medium text-emerald-800 mb-2">Notes:</h5>
                              <p className="text-emerald-700 bg-emerald-50 rounded-lg p-3 border border-emerald-200 text-sm">
                                {notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Vaccinations Recorded</h4>
                  <p className="text-gray-600">Your vaccination history will appear here when recorded by healthcare providers.</p>
                </div>
              )}
            </div>
          </div>

          {/* Hospital Admissions Section */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Hospital Admissions</h2>
            </div>
            
            <HospitalAdmissions patientId={patientData.id} />
          </div>

          {/* Reports Section */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Medical Reports</h2>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
              {patientData.report_url && typeof patientData.report_url === 'object' && Object.keys(patientData.report_url).length > 0 ? (
                Object.entries(patientData.report_url).map(([testType, reportData], index) => {
                  // Handle both old format (direct URL) and new format (object with url, date, etc.)
                  const reportUrl = typeof reportData === 'string' ? reportData : reportData?.url;
                  const reportDate = typeof reportData === 'object' ? reportData?.date : null;
                  const uploadedBy = typeof reportData === 'object' ? reportData?.uploadedBy : 'unknown';
                  
                  return (
                    <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-blue-900 mb-1">{testType} Report</h3>
                            <p className="text-blue-700 text-sm">Medical Report Document</p>
                            {reportDate && (
                              <p className="text-blue-600 text-xs mt-1">
                                Uploaded: {new Date(reportDate).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                            {!reportDate && (
                              <p className="text-blue-600 text-xs mt-1">Available for download</p>
                            )}
                          </div>
                        </div>
                        {reportUrl && (
                          <a 
                            href={reportUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center shadow-lg hover:shadow-xl"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View Report
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">No Medical Reports Available</h4>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Medical reports and documents will appear here when they are uploaded to your record by healthcare providers.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Treatment History Modal */}
      <TreatmentHistoryModal
        isOpen={showTreatmentHistoryModal}
        onClose={() => setShowTreatmentHistoryModal(false)}
        treatment={selectedTreatmentForHistory}
        treatmentHistory={treatmentHistory}
      />
    </div>
  )
}

export default PatientProfile
