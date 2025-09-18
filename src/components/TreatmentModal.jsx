import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import VoicePrescriptionModal from './VoicePrescriptionModal'

const TreatmentModal = ({ 
  isOpen, 
  onClose, 
  patient, 
  treatment = null, 
  onTreatmentSaved 
}) => {
  const [formData, setFormData] = useState({
    treatmentName: '',
    description: '',
    startDate: '',
    prescriptions: [],
    notes: '',
    followUpDate: '',
    attachedReports: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showVoicePrescription, setShowVoicePrescription] = useState(false)

  const frequencyOptions = [
    { id: 'morning', label: 'Morning', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', icon: '☀️' },
    { id: 'evening', label: 'Evening', icon: '🌆' },
    { id: 'night', label: 'Night', icon: '🌙' }
  ]

  // Initialize form data when modal opens or treatment changes
  useEffect(() => {
    if (isOpen) {
      if (treatment) {
        // Editing existing treatment
        setFormData({
          treatmentName: treatment.treatmentName || treatment.name || '',
          description: treatment.description || '',
          startDate: treatment.startDate || '',
          prescriptions: treatment.prescriptions || (treatment.prescription ? [{
            id: Date.now(),
            medicineName: '',
            dose: treatment.prescription,
            quantity: '',
            frequency: []
          }] : []),
          notes: treatment.notes || '',
          followUpDate: treatment.followUpDate || '',
          attachedReports: treatment.attachedReports || []
        })
      } else {
        // Adding new treatment
        setFormData({
          treatmentName: '',
          description: '',
          startDate: new Date().toISOString().split('T')[0], // Today's date
          prescriptions: [],
          notes: '',
          followUpDate: '',
          attachedReports: []
        })
      }
      setError('')
    }
  }, [isOpen, treatment])

  const addPrescription = () => {
    setFormData(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, {
        id: Date.now(),
        medicineName: '',
        dose: '',
        quantity: '',
        frequency: []
      }]
    }))
  }

  const removePrescription = (id) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter(p => p.id !== id)
    }))
  }

  const updatePrescription = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    }))
  }

  const toggleFrequency = (prescriptionId, frequencyId) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map(p => 
        p.id === prescriptionId ? {
          ...p,
          frequency: p.frequency.includes(frequencyId)
            ? p.frequency.filter(f => f !== frequencyId)
            : [...p.frequency, frequencyId]
        } : p
      )
    }))
  }

  const handleVoicePrescriptionsGenerated = (prescriptions, analysisResult, editMode = false) => {
    // Add the generated prescriptions to the form
    setFormData(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, ...prescriptions]
    }))
    
    // If there are warnings or the status needs review, show a notification
    if (analysisResult?.overallAssessment?.warnings?.length > 0) {
      const warningMessage = `AI Analysis Warnings: ${analysisResult.overallAssessment.warnings.join(', ')}`
      setError(warningMessage)
      
      // Clear the warning after 10 seconds
      setTimeout(() => {
        setError('')
      }, 10000)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleReportToggle = (report) => {
    setFormData(prev => {
      const reportName = typeof report === 'string' ? report : report?.name || report?.title
      const isSelected = prev.attachedReports.some(r => {
        const existingName = typeof r === 'string' ? r : r?.name || r?.title
        return existingName === reportName
      })
      
      return {
        ...prev,
        attachedReports: isSelected
          ? prev.attachedReports.filter(r => {
              const existingName = typeof r === 'string' ? r : r?.name || r?.title
              return existingName !== reportName
            })
          : [...prev.attachedReports, report]
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.treatmentName.trim()) {
      setError('Treatment name is required')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Get current ongoing treatments and treatment history
      const { data: currentPatient, error: fetchError } = await supabase
        .from('patients')
        .select('ongoing_treatments, ongoing_treatment_past')
        .eq('aadhar_number', patient.aadhar)
        .single()

      if (fetchError) throw fetchError

      let updatedTreatments = Array.isArray(currentPatient.ongoing_treatments) 
        ? [...currentPatient.ongoing_treatments] 
        : []
      
      let updatedTreatmentHistory = Array.isArray(currentPatient.ongoing_treatment_past)
        ? [...currentPatient.ongoing_treatment_past]
        : []

      const treatmentData = {
        id: treatment?.id || `treatment_${Date.now()}`,
        treatmentName: formData.treatmentName,
        description: formData.description,
        startDate: formData.startDate,
        prescriptions: formData.prescriptions,
        notes: formData.notes,
        followUpDate: formData.followUpDate,
        attachedReports: formData.attachedReports,
        createdAt: treatment?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (treatment) {
        // Update existing treatment - move current to history and save new as current
        const treatmentIndex = updatedTreatments.findIndex(t => {
          // First try to match by ID if both have IDs
          if (treatment.id && t.id) {
            return t.id === treatment.id
          }
          // Fallback to name matching
          const treatmentName = treatment.treatmentName || treatment.name
          const currentName = t.treatmentName || t.name
          return treatmentName && currentName && treatmentName === currentName
        })
        
        if (treatmentIndex !== -1) {
          // Move current treatment to history before updating (add to beginning for stack behavior)
          const currentTreatmentData = {
            ...updatedTreatments[treatmentIndex],
            treatmentId: updatedTreatments[treatmentIndex].id || updatedTreatments[treatmentIndex].treatmentName,
            movedToHistoryAt: new Date().toISOString()
          }
          
          console.log('=== TREATMENT UPDATE DEBUG ===');
          console.log('Updating treatment at index:', treatmentIndex);
          console.log('Original treatment:', updatedTreatments[treatmentIndex]);
          console.log('New treatment data:', treatmentData);
          console.log('Moving to history:', currentTreatmentData);
          
          // Add to beginning of history array (stack behavior - most recent first)
          updatedTreatmentHistory.unshift(currentTreatmentData)
          
          // Replace the existing treatment with updated data (maintain same position)
          updatedTreatments[treatmentIndex] = treatmentData
          
          console.log('Updated treatments array length:', updatedTreatments.length);
          console.log('Updated history array length:', updatedTreatmentHistory.length);
        } else {
          console.log('=== TREATMENT NOT FOUND - ADDING AS NEW ===');
          console.log('Looking for treatment:', treatment);
          console.log('In treatments array:', updatedTreatments);
          // If treatment not found in ongoing treatments, add as new
          updatedTreatments.push(treatmentData)
        }
      } else {
        // Add new treatment - DO NOT add to history initially
        updatedTreatments.push(treatmentData)
      }

      // Update patient's ongoing treatments and treatment history in Supabase
      const { error: updateError } = await supabase
        .from('patients')
        .update({ 
          ongoing_treatments: updatedTreatments,
          ongoing_treatment_past: updatedTreatmentHistory
        })
        .eq('aadhar_number', patient.aadhar)

      if (updateError) throw updateError

      // Call callback to refresh patient data
      if (onTreatmentSaved) {
        onTreatmentSaved()
      }

      onClose()
    } catch (err) {
      console.error('Error saving treatment:', err)
      setError('Failed to save treatment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      treatmentName: '',
      description: '',
      startDate: '',
      prescriptions: [],
      notes: '',
      followUpDate: '',
      attachedReports: []
    })
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden animate-slideUp">
        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {treatment ? 'Edit Treatment' : 'Add New Treatment'}
                </h2>
                <p className="text-sm text-gray-600">
                  {treatment ? 'Update treatment details and prescriptions' : 'Create a new treatment plan for the patient'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="max-h-[calc(95vh-140px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="px-8 py-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-8">
              {/* Basic Information Section */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Treatment Name */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Treatment Name *
                    </label>
                    <input
                      type="text"
                      name="treatmentName"
                      value={formData.treatmentName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                      placeholder="Enter treatment name"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Treatment Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm resize-none"
                      placeholder="Describe the treatment details"
                    />
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                    />
                  </div>

                  {/* Follow-up Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      name="followUpDate"
                      value={formData.followUpDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Prescriptions Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Prescriptions
                  </h3>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={addPrescription}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center shadow-sm hover:shadow-md"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Medicine
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVoicePrescription(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center shadow-sm hover:shadow-md"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      Voice Prescription
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {formData.prescriptions.map((prescription, index) => (
                    <div key={prescription.id} className="bg-white rounded-xl p-5 border border-green-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">Medicine #{index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removePrescription(prescription.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-all duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Medicine Name
                          </label>
                          <input
                            type="text"
                            value={prescription.medicineName}
                            onChange={(e) => updatePrescription(prescription.id, 'medicineName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter medicine name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dosage
                          </label>
                          <input
                            type="text"
                            value={prescription.dose}
                            onChange={(e) => updatePrescription(prescription.id, 'dose', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            placeholder="e.g., 500mg, 1 tablet"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity
                          </label>
                          <input
                            type="text"
                            value={prescription.quantity}
                            onChange={(e) => updatePrescription(prescription.id, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            placeholder="e.g., 30 tablets, 1 bottle"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Frequency
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {frequencyOptions.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => toggleFrequency(prescription.id, option.id)}
                              className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-1 ${
                                prescription.frequency.includes(option.id)
                                  ? 'border-green-500 bg-green-50 text-green-700'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50'
                              }`}
                            >
                              <span className="text-lg">{option.icon}</span>
                              <span className="text-xs font-medium">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.prescriptions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      <p>No prescriptions added yet</p>
                      <p className="text-sm">Click "Add Medicine" to start adding prescriptions</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              <div className="bg-blue-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Notes
                </h3>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm resize-none"
                  placeholder="Additional notes about the treatment"
                />
              </div>

              {/* Attach Lab Reports */}
              <div className="bg-purple-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Attach Lab Reports
                </h3>
                
                {/* Check both report_url_treatments and report_url for available reports */}
                {(() => {
                  const treatmentReports = patient?.reportUrlTreatments || {};
                  const generalReports = patient?.report_url || patient?.reportUrls || {};
                  
                  // First try to get treatment-specific reports
                  let reportsArray = [];
                  
                  // Add treatment-specific reports
                  if (typeof treatmentReports === 'object' && treatmentReports !== null && Object.keys(treatmentReports).length > 0) {
                    const treatmentSpecificReports = Object.entries(treatmentReports).map(([key, value]) => {
                      const reportUrl = typeof value === 'string' ? value : value?.url;
                      const reportDate = typeof value === 'object' ? value?.date : null;
                      const treatmentId = typeof value === 'object' ? value?.treatmentId : null;
                      return { 
                        name: key, 
                        url: reportUrl,
                        date: reportDate,
                        treatmentId: treatmentId,
                        title: key + ' Report',
                        source: 'treatment_specific'
                      };
                    }).filter(report => !report.treatmentId || report.treatmentId === (treatment?.id || treatment?.treatmentName));
                    
                    reportsArray = [...reportsArray, ...treatmentSpecificReports];
                  }
                  
                  // If no treatment-specific reports, show general reports as fallback
                  if (reportsArray.length === 0 && typeof generalReports === 'object' && generalReports !== null && Object.keys(generalReports).length > 0) {
                    const generalReportsArray = Object.entries(generalReports).map(([key, value]) => {
                      const reportUrl = typeof value === 'string' ? value : value?.url;
                      const reportDate = typeof value === 'object' ? value?.date : null;
                      return { 
                        name: key, 
                        url: reportUrl,
                        date: reportDate,
                        title: key + ' Report',
                        source: 'general'
                      };
                    });
                    
                    reportsArray = [...reportsArray, ...generalReportsArray];
                  }
                  
                  return reportsArray.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                      {reportsArray.map((report, index) => {
                        const reportObj = typeof report === 'string' ? { name: report, url: report } : report;
                        const reportName = reportObj?.name || reportObj?.title || `Lab Report ${index + 1}`;
                        
                        return (
                          <label key={index} className="flex items-center space-x-3 cursor-pointer p-3 bg-white rounded-xl border border-purple-200 hover:bg-purple-50 transition-all duration-200">
                            <input
                              type="checkbox"
                              checked={formData.attachedReports.some(r => 
                                (typeof r === 'string' && r === reportName) || 
                                (typeof r === 'object' && r.name === reportName)
                              )}
                              onChange={() => handleReportToggle(reportObj)}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">{reportName}</span>
                              {reportObj?.date && (
                                <p className="text-xs text-gray-500">{new Date(reportObj.date).toLocaleDateString()}</p>
                              )}
                              {reportObj?.source === 'general' && (
                                <p className="text-xs text-blue-600">Available for attachment</p>
                              )}
                            </div>
                            {reportObj?.url && (
                              <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500">No lab reports available to attach</p>
                      <p className="text-gray-400 text-sm">Lab reports can be attached when available</p>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-8 pt-6 border-t border-gray-200 bg-gray-50 -mx-8 px-8 py-6">
              <button
                type="button"
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-300 disabled:to-indigo-300 text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : (
                  treatment ? 'Update Treatment' : 'Add Treatment'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Voice Prescription Modal */}
        <VoicePrescriptionModal
          isOpen={showVoicePrescription}
          onClose={() => setShowVoicePrescription(false)}
          patient={patient}
          onPrescriptionsGenerated={handleVoicePrescriptionsGenerated}
          treatmentFormData={formData}
        />
      </div>
    </div>
  )
}

export default TreatmentModal
