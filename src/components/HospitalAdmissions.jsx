import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import PatientTreatmentHistoryModal from './PatientTreatmentHistoryModal'
import PatientWardBedHistoryModal from './PatientWardBedHistoryModal'

const HospitalAdmissions = ({ patientId }) => {
  const [admissions, setAdmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTreatmentHistoryModal, setShowTreatmentHistoryModal] = useState(false)
  const [showWardBedHistoryModal, setShowWardBedHistoryModal] = useState(false)
  const [selectedAdmission, setSelectedAdmission] = useState(null)

  useEffect(() => {
    if (patientId) {
      fetchAdmissions()
    }
  }, [patientId])

  const fetchAdmissions = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: fetchError } = await supabase
        .from('hospital_admissions')
        .select(`
          *,
          hospitals (
            hospital_name,
            hospital_type,
            address
          )
        `)
        .eq('patient_id', patientId)
        .order('admission_date', { ascending: false })

      if (fetchError) {
        console.error('Error fetching admissions:', fetchError)
        setError('Failed to load hospital admissions')
        return
      }

      setAdmissions(data || [])
    } catch (err) {
      console.error('Error in fetchAdmissions:', err)
      setError('Failed to load hospital admissions')
    } finally {
      setLoading(false)
    }
  }

  const handleViewTreatmentHistory = (admission) => {
    setSelectedAdmission(admission)
    setShowTreatmentHistoryModal(true)
  }

  const handleViewWardBedHistory = (admission) => {
    setSelectedAdmission(admission)
    setShowWardBedHistoryModal(true)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getAdmissionStatus = (admission) => {
    if (admission.discharge_date) {
      return {
        status: 'Discharged',
        color: 'bg-gray-100 text-gray-800',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      }
    }
    return {
      status: 'Active',
      color: 'bg-green-100 text-green-800',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  }

  const extractValue = (field) => {
    if (!field) return 'N/A'
    if (typeof field === 'string') return field
    if (typeof field === 'object') {
      return field.ward || field.bed_number || field.value || 'N/A'
    }
    return 'N/A'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-3 text-gray-600">Loading admissions...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  if (admissions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">No Hospital Admissions</h4>
        <p className="text-gray-600">You have no hospital admission records.</p>
      </div>
    )
  }

  return (
    <div className="max-h-96 overflow-y-auto space-y-6 pr-2">
      {admissions.map((admission) => {
        const statusInfo = getAdmissionStatus(admission)
        
        return (
          <div key={admission.id} className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-6 hover:from-teal-100 hover:to-cyan-100 transition-all duration-200 shadow-sm">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <h3 className="text-xl font-semibold text-teal-900 mr-3">
                    {admission.hospitals?.hospital_name || 'Hospital'}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${statusInfo.color}`}>
                    {statusInfo.icon}
                    <span className="ml-1">{statusInfo.status}</span>
                  </span>
                </div>
                <p className="text-teal-700 text-sm mb-1">
                  {admission.hospitals?.hospital_type || 'Hospital'} • {admission.hospitals?.address || 'Address not available'}
                </p>
                <p className="text-teal-600 text-sm">
                  Reason: {admission.reason_for_admission || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Admission Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-3 border border-teal-200">
                <label className="block text-xs font-medium text-teal-600 mb-1">Ward</label>
                <p className="font-semibold text-teal-900">{extractValue(admission.ward)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-teal-200">
                <label className="block text-xs font-medium text-teal-600 mb-1">Bed Number</label>
                <p className="font-semibold text-teal-900">{extractValue(admission.bed_number)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-teal-200">
                <label className="block text-xs font-medium text-teal-600 mb-1">Admitted</label>
                <p className="font-semibold text-teal-900">{formatDate(admission.admission_date)}</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-teal-200">
                <label className="block text-xs font-medium text-teal-600 mb-1">
                  {admission.discharge_date ? 'Discharged' : 'Status'}
                </label>
                <p className="font-semibold text-teal-900">
                  {admission.discharge_date ? formatDate(admission.discharge_date) : 'Active'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleViewTreatmentHistory(admission)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Treatment History
              </button>
              
              <button
                onClick={() => handleViewWardBedHistory(admission)}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ward & Bed History
              </button>
            </div>
          </div>
        )
      })}

      {/* Treatment History Modal */}
      <PatientTreatmentHistoryModal
        isOpen={showTreatmentHistoryModal}
        onClose={() => setShowTreatmentHistoryModal(false)}
        admission={selectedAdmission}
      />

      {/* Ward & Bed History Modal */}
      <PatientWardBedHistoryModal
        isOpen={showWardBedHistoryModal}
        onClose={() => setShowWardBedHistoryModal(false)}
        admission={selectedAdmission}
      />
    </div>
  )
}

export default HospitalAdmissions
