import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const PatientDetailsModal = ({ isOpen, onClose, patientData }) => {
  const [loading, setLoading] = useState(false)
  const [patientDetails, setPatientDetails] = useState(null)
  const [wardHistory, setWardHistory] = useState([])

  useEffect(() => {
    if (isOpen && patientData) {
      fetchPatientDetails()
      fetchWardHistory()
    }
  }, [isOpen, patientData])

  const fetchPatientDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch complete patient details from patients table
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientData.patient_id)
        .single()

      if (patientError) {
        console.error('Error fetching patient details:', patientError)
        return
      }

      setPatientDetails(patient)
    } catch (error) {
      console.error('Error in fetchPatientDetails:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWardHistory = async () => {
    try {
      // Fetch only the current admission record with ward/bed history
      const { data: currentAdmission, error: admissionsError } = await supabase
        .from('hospital_admissions')
        .select('ward, bed_number, ward_history, bed_history, admission_date')
        .eq('id', patientData.admission_id || patientData.id)
        .single()

      if (admissionsError) {
        console.error('Error fetching ward history:', admissionsError)
        return
      }

      // Create ward/bed history timeline from the current admission
      const wardBedHistory = []
      
      // Add current ward/bed as the latest entry
      if (currentAdmission.ward || currentAdmission.bed_number) {
        wardBedHistory.push({
          id: 'current',
          ward: typeof currentAdmission.ward === 'string' ? currentAdmission.ward : currentAdmission.ward?.ward || currentAdmission.ward,
          bed_number: typeof currentAdmission.bed_number === 'string' ? currentAdmission.bed_number : currentAdmission.bed_number?.bed_number || currentAdmission.bed_number,
          changed_at: new Date().toISOString(),
          status: 'current',
          admission_date: currentAdmission.admission_date
        })
      }

      // Process history entries and avoid duplicates for combined changes
      const processedTimestamps = new Set()
      
      // Add ward history entries
      if (Array.isArray(currentAdmission.ward_history)) {
        currentAdmission.ward_history.forEach((wardEntry, index) => {
          const timestamp = wardEntry.changed_from
          
          // Check if this is a combined ward and bed change
          if (wardEntry.change_type === 'ward_and_bed') {
            // Only add if we haven't processed this timestamp yet
            if (!processedTimestamps.has(timestamp)) {
              wardBedHistory.push({
                id: `combined-${index}`,
                ward: wardEntry.ward,
                bed_number: wardEntry.bed_number,
                changed_at: timestamp,
                status: 'historical',
                type: 'ward_and_bed_change'
              })
              processedTimestamps.add(timestamp)
            }
          } else {
            // Individual ward change
            wardBedHistory.push({
              id: `ward-${index}`,
              ward: wardEntry.ward,
              bed_number: wardBedHistory[wardBedHistory.length - 1]?.bed_number || 'N/A',
              changed_at: timestamp,
              status: 'historical',
              type: 'ward_change'
            })
          }
        })
      }

      // Add bed history entries (only if not already processed as combined)
      if (Array.isArray(currentAdmission.bed_history)) {
        currentAdmission.bed_history.forEach((bedEntry, index) => {
          const timestamp = bedEntry.changed_from
          
          // Skip if this was already processed as a combined change
          if (bedEntry.change_type === 'ward_and_bed' && processedTimestamps.has(timestamp)) {
            return
          }
          
          // Individual bed change only
          if (bedEntry.change_type !== 'ward_and_bed') {
            wardBedHistory.push({
              id: `bed-${index}`,
              ward: wardBedHistory[wardBedHistory.length - 1]?.ward || 'N/A',
              bed_number: bedEntry.bed_number,
              changed_at: timestamp,
              status: 'historical',
              type: 'bed_change'
            })
          }
        })
      }

      // Sort by changed_at date (newest first)
      wardBedHistory.sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))

      setWardHistory(wardBedHistory)
    } catch (error) {
      console.error('Error in fetchWardHistory:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Patient Details</h2>
              <p className="text-indigo-100 mt-1">Complete patient information and history</p>
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

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Information
              </h3>
              
              {patientDetails ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-lg font-semibold text-gray-900">{patientDetails.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Age</label>
                    <p className="text-lg font-semibold text-gray-900">{patientDetails.age} years</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Gender</label>
                    <p className="text-lg font-semibold text-gray-900">{patientDetails.gender}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Date of Birth</label>
                    <p className="text-lg font-semibold text-gray-900">
                      {patientDetails.dob ? new Date(patientDetails.dob).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Blood Group</label>
                    <p className="text-lg font-semibold text-gray-900">{patientDetails.blood_group || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Aadhaar Number</label>
                    <p className="text-lg font-semibold text-gray-900">{patientDetails.aadhar_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Contact Number</label>
                    <p className="text-lg font-semibold text-gray-900">{patientDetails.contact}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600">Address</label>
                    <p className="text-lg font-semibold text-gray-900">{patientDetails.address}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Loading patient details...</p>
              )}
            </div>


            {/* Ward and Bed History */}
            <div className="bg-purple-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ward & Bed History
              </h3>
              
              {wardHistory.length > 0 ? (
                <div className="space-y-4">
                  {wardHistory.map((historyEntry, index) => (
                    <div key={historyEntry.id} className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            historyEntry.status === 'current'
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {historyEntry.status === 'current' ? 'Current' : 'Previous'}
                          </span>
                          {historyEntry.type && (
                            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                              {historyEntry.type === 'ward_and_bed_change' ? 'Ward & Bed Change' : 
                               historyEntry.type === 'ward_change' ? 'Ward Change' : 'Bed Change'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(historyEntry.changed_at).toLocaleDateString()} {new Date(historyEntry.changed_at).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Ward</label>
                          <p className="font-semibold text-gray-900">{historyEntry.ward || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Bed Number</label>
                          <p className="font-semibold text-gray-900">{historyEntry.bed_number || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No admission history found.</p>
              )}
            </div>

          </div>
        )}

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

export default PatientDetailsModal
