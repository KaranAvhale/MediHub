import React, { useState, useEffect } from 'react'

const UpdatePatientModal = ({ isOpen, onClose, onUpdate, patientData }) => {
  const [formData, setFormData] = useState({
    ward: '',
    bed_number: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (patientData && isOpen) {
      setFormData({
        ward: typeof patientData.ward === 'object' ? patientData.ward?.ward || patientData.ward?.value || '' : patientData.ward || '',
        bed_number: typeof patientData.bed_number === 'object' ? patientData.bed_number?.bed_number || patientData.bed_number?.value || '' : patientData.bed_number || ''
      })
    }
  }, [patientData, isOpen])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.ward || !formData.bed_number) {
      setError('Please fill in ward and bed number')
      return
    }

    setLoading(true)
    try {
      // Import supabase
      const { supabase } = await import('../lib/supabaseClient')
      
      // Create ward and bed history entry
      const wardBedEntry = {
        ward: formData.ward,
        bed_number: formData.bed_number,
        changed_at: new Date().toISOString(),
        changed_by: 'Hospital Staff'
      }

      // Get current ward and bed history
      const { data: currentAdmission, error: fetchError } = await supabase
        .from('hospital_admissions')
        .select('ward, bed_number, ward_history, bed_history')
        .eq('id', patientData.admission_id || patientData.id)
        .single()

      if (fetchError) {
        console.error('Error fetching current admission:', fetchError)
        throw fetchError
      }

      // Prepare history arrays
      const currentWardHistory = Array.isArray(currentAdmission.ward_history) ? currentAdmission.ward_history : []
      const currentBedHistory = Array.isArray(currentAdmission.bed_history) ? currentAdmission.bed_history : []

      // Check what has changed
      const currentWard = typeof currentAdmission.ward === 'string' ? currentAdmission.ward : currentAdmission.ward?.ward
      const currentBed = typeof currentAdmission.bed_number === 'string' ? currentAdmission.bed_number : currentAdmission.bed_number?.bed_number
      
      const wardChanged = currentWard && currentWard !== formData.ward
      const bedChanged = currentBed && currentBed !== formData.bed_number

      // Create new history arrays
      const newWardHistory = [...currentWardHistory]
      const newBedHistory = [...currentBedHistory]

      // If both ward and bed changed, create a single combined history entry
      if (wardChanged && bedChanged) {
        const timestamp = new Date().toISOString()
        
        // Add to ward history with combined change info
        newWardHistory.push({
          ward: currentWard,
          bed_number: currentBed,
          changed_from: timestamp,
          changed_by: 'Hospital Staff',
          change_type: 'ward_and_bed'
        })

        // Add to bed history with same timestamp to maintain consistency
        newBedHistory.push({
          ward: currentWard,
          bed_number: currentBed,
          changed_from: timestamp,
          changed_by: 'Hospital Staff',
          change_type: 'ward_and_bed'
        })
      } else {
        // Handle individual changes
        if (wardChanged) {
          newWardHistory.push({
            ward: currentWard,
            changed_from: new Date().toISOString(),
            changed_by: 'Hospital Staff',
            change_type: 'ward_only'
          })
        }

        if (bedChanged) {
          newBedHistory.push({
            bed_number: currentBed,
            changed_from: new Date().toISOString(),
            changed_by: 'Hospital Staff',
            change_type: 'bed_only'
          })
        }
      }

      // Update the admission record with new ward and bed, preserving history
      const { data: updatedAdmission, error: updateError } = await supabase
        .from('hospital_admissions')
        .update({
          ward: formData.ward,
          bed_number: formData.bed_number,
          ward_history: newWardHistory,
          bed_history: newBedHistory,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientData.admission_id || patientData.id)
        .select()

      if (updateError) {
        console.error('Database update error:', updateError)
        throw updateError
      }

      console.log('Successfully updated ward and bed:', updatedAdmission)

      const updatedPatient = {
        ...patientData,
        ward: formData.ward,
        bed_number: formData.bed_number,
        updated_at: new Date().toISOString()
      }
      
      onUpdate(updatedPatient)
      onClose()
    } catch (error) {
      console.error('Error updating patient:', error)
      setError(`Failed to update patient: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Update Patient Details</h2>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Patient Info Display */}
          {patientData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-800 mb-2">Patient Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Name:</span> {patientData.name}</div>
                <div><span className="font-medium">Age:</span> {patientData.age}</div>
                <div><span className="font-medium">Gender:</span> {patientData.gender}</div>
                <div><span className="font-medium">Contact:</span> {patientData.contact}</div>
                <div><span className="font-medium">Blood Group:</span> {patientData.blood_group}</div>
                <div><span className="font-medium">Admission Date:</span> {new Date(patientData.admission_date).toLocaleDateString()}</div>
              </div>
            </div>
          )}

          {/* Ward and Bed Update Form */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-yellow-800 mb-2">Update Ward & Bed Assignment</h4>
            <p className="text-sm text-yellow-700">You can only update the ward and bed number for this patient.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ward *</label>
              <input
                type="text"
                name="ward"
                value={formData.ward}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., ICU, General, Cardiology"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bed Number *</label>
              <input
                type="text"
                name="bed_number"
                value={formData.bed_number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., A-101, B-205"
                required
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Updating...' : 'Update Details'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UpdatePatientModal
