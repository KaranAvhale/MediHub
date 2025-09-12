import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const HospitalHistoryModal = ({ isOpen, onClose, patientData }) => {
  const [loading, setLoading] = useState(false)
  const [treatmentHistory, setTreatmentHistory] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && patientData) {
      fetchTreatmentHistory()
    }
  }, [isOpen, patientData])

  const fetchTreatmentHistory = async () => {
    try {
      setLoading(true)
      setError('')

      console.log('=== FETCHING TREATMENT HISTORY ===')
      console.log('Patient data:', patientData)
      
      const admissionId = patientData.admission_id || patientData.id
      console.log('Using admission ID:', admissionId)

      const { data: admission, error: fetchError } = await supabase
        .from('hospital_admissions')
        .select('hospital_ongoing_treatments')
        .eq('id', admissionId)
        .single()

      console.log('Admission fetch result:', { admission, fetchError })

      if (fetchError) {
        throw fetchError
      }

      const treatments = admission.hospital_ongoing_treatments || []
      console.log('Raw treatments:', treatments)
      
      // Sort by timestamp (newest first)
      const sortedTreatments = treatments.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )
      
      console.log('Sorted treatments:', sortedTreatments)
      setTreatmentHistory(sortedTreatments)
    } catch (error) {
      console.error('Error fetching treatment history:', error)
      setError(`Failed to fetch treatment history: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Treatment History</h3>
              <p className="text-sm text-gray-600 mt-1">
                {patientData?.name} • Bed: {typeof patientData?.bed_number === 'object' ? patientData?.bed_number?.bed_number || patientData?.bed_number?.value || 'N/A' : patientData?.bed_number} • Ward: {typeof patientData?.ward === 'object' ? patientData?.ward?.ward || patientData?.ward?.value || 'N/A' : patientData?.ward}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Loading treatment history...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          ) : treatmentHistory.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No treatment history available</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Timeline */}
              <div className="relative">
                {treatmentHistory.map((treatment, index) => (
                  <div key={index} className="relative pb-8">
                    {/* Timeline line */}
                    {index < treatmentHistory.length - 1 && (
                      <div className="absolute left-4 top-8 w-0.5 h-full bg-gray-200"></div>
                    )}
                    
                    {/* Timeline dot */}
                    <div className="relative flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      
                      {/* Treatment card */}
                      <div className="ml-6 flex-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                        {/* Card header */}
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium text-gray-900">Treatment Record</h4>
                            <span className="text-sm text-gray-500">{formatDate(treatment.timestamp)}</span>
                          </div>
                          {treatment.recordedBy && (
                            <p className="text-xs text-gray-500 mt-1">Recorded by: {treatment.recordedBy}</p>
                          )}
                        </div>
                        
                        {/* Card content */}
                        <div className="p-4 space-y-4">
                          {/* IV Fluids */}
                          {treatment.ivFluids && treatment.ivFluids.length > 0 && (
                            <div>
                              <h5 className="font-medium text-blue-900 mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.586V5L8 4z" />
                                </svg>
                                IV Fluids
                              </h5>
                              <div className="bg-blue-50 rounded-lg p-3">
                                {treatment.ivFluids.map((fluid, fluidIndex) => (
                                  <div key={fluidIndex} className="text-sm text-gray-700 mb-1">
                                    <span className="font-medium">{fluid.name}</span>
                                    {fluid.amount && <span> - {fluid.amount}</span>}
                                    {fluid.frequency && <span> ({fluid.frequency})</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Medicines */}
                          {treatment.medicines && treatment.medicines.length > 0 && (
                            <div>
                              <h5 className="font-medium text-green-900 mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.586V5L8 4z" />
                                </svg>
                                Medicines
                              </h5>
                              <div className="bg-green-50 rounded-lg p-3">
                                {treatment.medicines.map((medicine, medIndex) => (
                                  <div key={medIndex} className="text-sm text-gray-700 mb-1">
                                    <span className="font-medium">{medicine.name}</span>
                                    {medicine.dosage && <span> - {medicine.dosage}</span>}
                                    {medicine.frequency && <span> ({medicine.frequency})</span>}
                                    {medicine.duration && <span> for {medicine.duration}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Monitoring */}
                          {treatment.monitoring && Object.values(treatment.monitoring).some(value => value) && (
                            <div>
                              <h5 className="font-medium text-purple-900 mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Vital Signs
                              </h5>
                              <div className="bg-purple-50 rounded-lg p-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                  {treatment.monitoring.bloodPressure && (
                                    <div>
                                      <span className="font-medium text-gray-600">BP:</span> {treatment.monitoring.bloodPressure}
                                    </div>
                                  )}
                                  {treatment.monitoring.heartRate && (
                                    <div>
                                      <span className="font-medium text-gray-600">HR:</span> {treatment.monitoring.heartRate}
                                    </div>
                                  )}
                                  {treatment.monitoring.spo2 && (
                                    <div>
                                      <span className="font-medium text-gray-600">SPO2:</span> {treatment.monitoring.spo2}
                                    </div>
                                  )}
                                  {treatment.monitoring.temperature && (
                                    <div>
                                      <span className="font-medium text-gray-600">Temp:</span> {treatment.monitoring.temperature}
                                    </div>
                                  )}
                                </div>
                                {treatment.monitoring.notes && (
                                  <div className="mt-2 text-sm text-gray-700">
                                    <span className="font-medium">Notes:</span> {treatment.monitoring.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Treatment Notes */}
                          {treatment.treatmentNotes && (
                            <div>
                              <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Treatment Notes
                              </h5>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-700">{treatment.treatmentNotes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default HospitalHistoryModal
