import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const HospitalTreatmentModal = ({ isOpen, onClose, patientData, onTreatmentSaved }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Treatment data state
  const [treatmentData, setTreatmentData] = useState({
    ivFluids: [{ name: '', amount: '', frequency: '' }],
    medicines: [{ name: '', dosage: '', quantity: '' }],
    monitoring: {
      bloodPressure: '',
      heartRate: '',
      spo2: '',
      temperature: '',
      notes: ''
    },
    treatmentNotes: ''
  })

  // Add new IV fluid entry
  const addIVFluid = () => {
    setTreatmentData(prev => ({
      ...prev,
      ivFluids: [...prev.ivFluids, { name: '', amount: '', frequency: '' }]
    }))
  }

  // Remove IV fluid entry
  const removeIVFluid = (index) => {
    setTreatmentData(prev => ({
      ...prev,
      ivFluids: prev.ivFluids.filter((_, i) => i !== index)
    }))
  }

  // Update IV fluid entry
  const updateIVFluid = (index, field, value) => {
    setTreatmentData(prev => ({
      ...prev,
      ivFluids: prev.ivFluids.map((fluid, i) => 
        i === index ? { ...fluid, [field]: value } : fluid
      )
    }))
  }

  // Add new medicine entry
  const addMedicine = () => {
    setTreatmentData(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', quantity: '' }]
    }))
  }

  // Remove medicine entry
  const removeMedicine = (index) => {
    setTreatmentData(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }))
  }

  // Update medicine entry
  const updateMedicine = (index, field, value) => {
    setTreatmentData(prev => ({
      ...prev,
      medicines: prev.medicines.map((medicine, i) => 
        i === index ? { ...medicine, [field]: value } : medicine
      )
    }))
  }

  // Update monitoring data
  const updateMonitoring = (field, value) => {
    setTreatmentData(prev => ({
      ...prev,
      monitoring: { ...prev.monitoring, [field]: value }
    }))
  }

  // Save treatment data
  const handleSaveTreatment = async () => {
    try {
      setLoading(true)
      setError('')

      // Validate required fields
      const hasValidIVFluids = treatmentData.ivFluids.some(fluid => 
        fluid.name.trim() || fluid.amount.trim() || fluid.frequency.trim()
      )
      const hasValidMedicines = treatmentData.medicines.some(medicine => 
        medicine.name.trim() || medicine.dosage.trim() || medicine.frequency.trim()
      )
      const hasMonitoring = Object.values(treatmentData.monitoring).some(value => value.trim())

      if (!hasValidIVFluids && !hasValidMedicines && !hasMonitoring && !treatmentData.treatmentNotes.trim()) {
        setError('Please fill in at least one treatment field')
        return
      }

      // Prepare treatment record
      const treatmentRecord = {
        timestamp: new Date().toISOString(),
        ivFluids: treatmentData.ivFluids.filter(fluid => 
          fluid.name.trim() || fluid.amount.trim() || fluid.frequency.trim()
        ).map(fluid => ({
          ...fluid,
          amount: fluid.amount ? `${fluid.amount} ml` : '',
          frequency: fluid.frequency ? `${fluid.frequency} times/day` : ''
        })),
        medicines: treatmentData.medicines.filter(medicine => 
          medicine.name.trim() || medicine.dosage.trim() || medicine.quantity.trim()
        ).map(medicine => ({
          ...medicine,
          dosage: medicine.dosage ? `${medicine.dosage} mg` : '',
          quantity: medicine.quantity ? `${medicine.quantity} tablets` : ''
        })),
        monitoring: {
          bloodPressure: treatmentData.monitoring.bloodPressure ? `${treatmentData.monitoring.bloodPressure} mmHg` : '',
          heartRate: treatmentData.monitoring.heartRate ? `${treatmentData.monitoring.heartRate} bpm` : '',
          spo2: treatmentData.monitoring.spo2 ? `${treatmentData.monitoring.spo2} %` : '',
          temperature: treatmentData.monitoring.temperature ? `${treatmentData.monitoring.temperature} °F` : '',
          notes: treatmentData.monitoring.notes
        },
        treatmentNotes: treatmentData.treatmentNotes,
        recordedBy: 'Hospital Staff' // You can get this from user context
      }

      console.log('=== TREATMENT SAVE DEBUG ===')
      console.log('Patient data:', patientData)
      console.log('Admission ID being used:', patientData.admission_id)
      console.log('Treatment record to save:', treatmentRecord)

      // Get current hospital_ongoing_treatments from hospital_admissions table
      const admissionId = patientData.admission_id || patientData.id
      
      console.log('Trying admission ID:', admissionId)
      
      const { data: currentAdmission, error: fetchError } = await supabase
        .from('hospital_admissions')
        .select('hospital_ongoing_treatments')
        .eq('id', admissionId)
        .single()

      console.log('Current admission fetch result:', { currentAdmission, fetchError })

      if (fetchError) {
        console.error('Error fetching current admission:', fetchError)
        throw fetchError
      }

      // Add new treatment to existing treatments
      const currentTreatments = currentAdmission.hospital_ongoing_treatments || []
      const updatedTreatments = [...currentTreatments, treatmentRecord]
      
      console.log('Current treatments:', currentTreatments)
      console.log('Updated treatments:', updatedTreatments)

      // Update hospital_admissions record
      const { data: updateResult, error: updateError } = await supabase
        .from('hospital_admissions')
        .update({ 
          hospital_ongoing_treatments: updatedTreatments,
          updated_at: new Date().toISOString()
        })
        .eq('id', admissionId)
        .select()

      console.log('Update result:', { updateResult, updateError })

      if (updateError) {
        throw updateError
      }

      // Reset form
      setTreatmentData({
        ivFluids: [{ name: '', amount: '', frequency: '' }],
        medicines: [{ name: '', dosage: '', quantity: '' }],
        monitoring: {
          bloodPressure: '',
          heartRate: '',
          spo2: '',
          temperature: '',
          notes: ''
        },
        treatmentNotes: ''
      })

      onTreatmentSaved?.()
      onClose()
    } catch (error) {
      console.error('Error saving treatment:', error)
      setError(`Failed to save treatment: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Patient Treatment</h3>
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
        <div className="p-6 space-y-8">
          {/* IV Fluids Section */}
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-blue-900 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.586V5L8 4z" />
                </svg>
                Intravenous (IV) Fluids
              </h4>
              <button
                onClick={addIVFluid}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
              >
                + Add IV Fluid
              </button>
            </div>
            
            <div className="space-y-3">
              {treatmentData.ivFluids.map((fluid, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fluid Name</label>
                      <input
                        type="text"
                        value={fluid.name}
                        onChange={(e) => updateIVFluid(index, 'name', e.target.value)}
                        placeholder="e.g., Normal Saline, Dextrose"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ml)</label>
                      <input
                        type="number"
                        value={fluid.amount}
                        onChange={(e) => updateIVFluid(index, 'amount', e.target.value)}
                        placeholder="500"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency (times/day)</label>
                      <input
                        type="number"
                        value={fluid.frequency}
                        onChange={(e) => updateIVFluid(index, 'frequency', e.target.value)}
                        placeholder="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      {treatmentData.ivFluids.length > 1 && (
                        <button
                          onClick={() => removeIVFluid(index)}
                          className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Medicines Section */}
          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-green-900 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.586V5L8 4z" />
                </svg>
                Medicines
              </h4>
              <button
                onClick={addMedicine}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
              >
                + Add Medicine
              </button>
            </div>
            
            <div className="space-y-3">
              {treatmentData.medicines.map((medicine, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                      <input
                        type="text"
                        value={medicine.name}
                        onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                        placeholder="e.g., Paracetamol"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dosage (mg)</label>
                      <input
                        type="number"
                        value={medicine.dosage}
                        onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                        placeholder="500"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (tablets)</label>
                      <input
                        type="number"
                        value={medicine.quantity}
                        onChange={(e) => updateMedicine(index, 'quantity', e.target.value)}
                        placeholder="10"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div className="flex items-end">
                      {treatmentData.medicines.length > 1 && (
                        <button
                          onClick={() => removeMedicine(index)}
                          className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monitoring Section */}
          <div className="bg-purple-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Vital Signs Monitoring
            </h4>
            
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (mmHg)</label>
                  <input
                    type="text"
                    value={treatmentData.monitoring.bloodPressure}
                    onChange={(e) => updateMonitoring('bloodPressure', e.target.value)}
                    placeholder="120/80"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={treatmentData.monitoring.heartRate}
                    onChange={(e) => updateMonitoring('heartRate', e.target.value)}
                    placeholder="72"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SPO2 (%)</label>
                  <input
                    type="number"
                    value={treatmentData.monitoring.spo2}
                    onChange={(e) => updateMonitoring('spo2', e.target.value)}
                    placeholder="98"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={treatmentData.monitoring.temperature}
                    onChange={(e) => updateMonitoring('temperature', e.target.value)}
                    placeholder="98.6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monitoring Notes</label>
                <textarea
                  value={treatmentData.monitoring.notes}
                  onChange={(e) => updateMonitoring('notes', e.target.value)}
                  placeholder="Additional monitoring observations..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Treatment Notes */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Treatment Notes
            </h4>
            
            <textarea
              value={treatmentData.treatmentNotes}
              onChange={(e) => setTreatmentData(prev => ({ ...prev, treatmentNotes: e.target.value }))}
              placeholder="General treatment notes, observations, patient response, etc..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveTreatment}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                'Save Treatment'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HospitalTreatmentModal
