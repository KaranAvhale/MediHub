import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const PatientTreatmentHistoryModal = ({ isOpen, onClose, admission }) => {
  const [treatments, setTreatments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && admission) {
      fetchTreatmentHistory()
    }
  }, [isOpen, admission])

  const fetchTreatmentHistory = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch treatments from hospital_admissions table
      const { data: admissionData, error: treatmentError } = await supabase
        .from('hospital_admissions')
        .select('hospital_ongoing_treatments')
        .eq('id', admission.id)
        .single()

      if (treatmentError) {
        console.error('Error fetching treatments:', treatmentError)
        setError('Failed to load treatment history')
        return
      }

      // Extract treatments from the hospital_ongoing_treatments column
      const treatmentHistory = admissionData?.hospital_ongoing_treatments || []
      
      // Sort treatments by timestamp (newest first)
      const sortedTreatments = treatmentHistory.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )

      setTreatments(sortedTreatments)
    } catch (err) {
      console.error('Error in fetchTreatmentHistory:', err)
      setError('Failed to load treatment history')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderMedicines = (medicines) => {
    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return <p className="text-gray-500 text-sm">No medicines prescribed</p>
    }

    return (
      <div className="space-y-2">
        {medicines.map((medicine, index) => (
          <div key={index} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="font-medium text-blue-900">{medicine.name}</p>
            <div className="text-sm text-blue-700 mt-1">
              <span>Dosage: {medicine.dosage}</span>
              {medicine.quantity && <span className="ml-3">Quantity: {medicine.quantity}</span>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderIVFluids = (ivFluids) => {
    if (!ivFluids || !Array.isArray(ivFluids) || ivFluids.length === 0) {
      return <p className="text-gray-500 text-sm">No IV fluids administered</p>
    }

    return (
      <div className="space-y-2">
        {ivFluids.map((fluid, index) => (
          <div key={index} className="bg-green-50 rounded-lg p-3 border border-green-200">
            <p className="font-medium text-green-900">{fluid.name}</p>
            <div className="text-sm text-green-700 mt-1">
              <span>Amount: {fluid.amount}</span>
              {fluid.frequency && <span className="ml-3">Frequency: {fluid.frequency}</span>}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderMonitoring = (monitoring) => {
    if (!monitoring || typeof monitoring !== 'object') {
      return <p className="text-gray-500 text-sm">No monitoring data</p>
    }

    return (
      <div className="grid grid-cols-2 gap-3">
        {monitoring.bloodPressure && (
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <p className="text-xs font-medium text-red-600">Blood Pressure</p>
            <p className="font-semibold text-red-900">{monitoring.bloodPressure}</p>
          </div>
        )}
        {monitoring.heartRate && (
          <div className="bg-pink-50 rounded-lg p-3 border border-pink-200">
            <p className="text-xs font-medium text-pink-600">Heart Rate</p>
            <p className="font-semibold text-pink-900">{monitoring.heartRate}</p>
          </div>
        )}
        {monitoring.spo2 && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs font-medium text-blue-600">SpO2</p>
            <p className="font-semibold text-blue-900">{monitoring.spo2}</p>
          </div>
        )}
        {monitoring.temperature && (
          <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
            <p className="text-xs font-medium text-orange-600">Temperature</p>
            <p className="font-semibold text-orange-900">{monitoring.temperature}</p>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Treatment History</h2>
              <p className="text-blue-100 mt-1">
                {admission?.hospitals?.hospital_name || 'Hospital'} • 
                Admitted: {formatDate(admission?.admission_date)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading treatment history...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          ) : treatments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Treatment Records</h4>
              <p className="text-gray-600">No treatments have been recorded for this admission.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {treatments.map((treatment, index) => (
                <div key={`treatment-${index}`} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                  {/* Treatment Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Treatment #{treatments.length - index}
                      </h3>
                      <p className="text-sm text-gray-600">{formatDate(treatment.timestamp)}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      Hospital Treatment
                    </span>
                  </div>

                  {/* Treatment Details */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Medicines */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Medicines
                      </h4>
                      {renderMedicines(treatment.medicines)}
                    </div>

                    {/* IV Fluids */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        IV Fluids
                      </h4>
                      {renderIVFluids(treatment.ivFluids)}
                    </div>

                    {/* Monitoring */}
                    <div className="lg:col-span-2">
                      <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Monitoring Data
                      </h4>
                      {renderMonitoring(treatment.monitoring)}
                    </div>
                  </div>

                  {/* Notes */}
                  {treatment.treatmentNotes && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-md font-semibold text-gray-800 mb-2">Treatment Notes</h4>
                      <p className="text-gray-700 bg-white rounded-lg p-3 border border-gray-200">
                        {treatment.treatmentNotes}
                      </p>
                    </div>
                  )}
                  
                  {/* Recorded By */}
                  {treatment.recordedBy && (
                    <div className="mt-4 text-sm text-gray-600">
                      <span className="font-medium">Recorded by:</span> {treatment.recordedBy}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientTreatmentHistoryModal
