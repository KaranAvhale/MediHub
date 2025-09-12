import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const PatientWardBedHistoryModal = ({ isOpen, onClose, admission }) => {
  const [wardHistory, setWardHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && admission) {
      fetchWardBedHistory()
    }
  }, [isOpen, admission])

  const fetchWardBedHistory = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch the admission record with ward/bed history
      const { data: admissionData, error: fetchError } = await supabase
        .from('hospital_admissions')
        .select('ward, bed_number, ward_history, bed_history, admission_date')
        .eq('id', admission.id)
        .single()

      if (fetchError) {
        console.error('Error fetching ward history:', fetchError)
        setError('Failed to load ward and bed history')
        return
      }

      // Create ward/bed history timeline from the admission data
      const wardBedHistory = []
      
      // Add current ward/bed as the latest entry
      if (admissionData.ward || admissionData.bed_number) {
        wardBedHistory.push({
          id: 'current',
          ward: typeof admissionData.ward === 'string' ? admissionData.ward : admissionData.ward?.ward || admissionData.ward,
          bed_number: typeof admissionData.bed_number === 'string' ? admissionData.bed_number : admissionData.bed_number?.bed_number || admissionData.bed_number,
          changed_at: new Date().toISOString(),
          status: 'current',
          admission_date: admissionData.admission_date
        })
      }

      // Process history entries and avoid duplicates for combined changes
      const processedTimestamps = new Set()
      
      // Add ward history entries
      if (Array.isArray(admissionData.ward_history)) {
        admissionData.ward_history.forEach((wardEntry, index) => {
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
      if (Array.isArray(admissionData.bed_history)) {
        admissionData.bed_history.forEach((bedEntry, index) => {
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
    } catch (err) {
      console.error('Error in fetchWardBedHistory:', err)
      setError('Failed to load ward and bed history')
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Ward & Bed History</h2>
              <p className="text-purple-100 mt-1">
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Loading ward and bed history...</span>
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
          ) : wardHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No History Available</h4>
              <p className="text-gray-600">No ward or bed changes have been recorded for this admission.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center mb-6">
                <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900">Timeline of Ward & Bed Changes</h3>
              </div>

              {wardHistory.map((historyEntry, index) => (
                <div key={historyEntry.id} className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
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
                      {formatDate(historyEntry.changed_at)}
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

export default PatientWardBedHistoryModal
