import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import TreatmentModal from './TreatmentModal'
import TreatmentHistoryModal from './TreatmentHistoryModal'
import DoctorHospitalAdmissions from './DoctorHospitalAdmissions'
import PrescriptionPrint from './PrescriptionPrint'
import PatientAIAssistant from './PatientAIAssistant'
import TranslatedText from './TranslatedText'
import { useTranslate } from '../hooks/useTranslate'
import { useDatabaseTranslation } from '../utils/databaseTranslation'

const PatientDetailsView = ({ patient, onBack }) => {
  const { t } = useTranslate()
  const { translateMedicalTerm, translatePatientData } = useDatabaseTranslation()
  const [currentPatient, setCurrentPatient] = useState(patient)
  const [showTreatmentModal, setShowTreatmentModal] = useState(false)
  const [selectedTreatment, setSelectedTreatment] = useState(null)
  const [showReportsModal, setShowReportsModal] = useState(false)
  const [selectedReports, setSelectedReports] = useState([])
  const [showPastTreatmentModal, setShowPastTreatmentModal] = useState(false)
  const [selectedPastTreatment, setSelectedPastTreatment] = useState(null)
  const [showTreatmentHistoryModal, setShowTreatmentHistoryModal] = useState(false)
  const [selectedTreatmentForHistory, setSelectedTreatmentForHistory] = useState(null)
  const [treatmentHistory, setTreatmentHistory] = useState([])
  const [showPrescriptionPrint, setShowPrescriptionPrint] = useState(false)
  const [selectedTreatmentForPrint, setSelectedTreatmentForPrint] = useState(null)
  
  if (!currentPatient) return null

  const refreshPatientData = async () => {
    try {
      const { data: updatedPatient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('aadhar_number', currentPatient.aadhar)
        .single()

      if (error) throw error

      if (updatedPatient) {
        // Ensure all ongoing treatments have proper IDs
        const ongoingTreatments = Array.isArray(updatedPatient.ongoing_treatments) 
          ? updatedPatient.ongoing_treatments.map(treatment => ({
              ...treatment,
              id: treatment.id || `treatment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }))
          : (updatedPatient.ongoing_treatments ? [{
              ...updatedPatient.ongoing_treatments,
              id: updatedPatient.ongoing_treatments.id || `treatment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }] : [])

        const transformedPatient = {
          aadhar: updatedPatient.aadhar_number,
          name: updatedPatient.name,
          age: updatedPatient.age,
          gender: updatedPatient.gender,
          contact: updatedPatient.contact,
          bloodGroup: updatedPatient.blood_group,
          dob: updatedPatient.dob,
          address: updatedPatient.address,
          ongoing_treatments: ongoingTreatments,
          ongoingTreatment: ongoingTreatments,
          ongoingTreatmentPast: Array.isArray(updatedPatient.ongoing_treatment_past) 
            ? updatedPatient.ongoing_treatment_past 
            : (updatedPatient.ongoing_treatment_past ? [updatedPatient.ongoing_treatment_past] : []),
          reportUrlTreatments: updatedPatient.report_url_treatments || {},
          reportUrlTreatmentsPast: updatedPatient.report_url_treatments_past || {},
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
            : (updatedPatient.patient_vaccinations ? [updatedPatient.patient_vaccinations] : []),
          prescriptions: currentPatient.prescriptions || []
        }
        setCurrentPatient(transformedPatient)
      }
    } catch (err) {
      console.error('Error refreshing patient data:', err)
    }
  }

  const handleAddTreatment = () => {
    setSelectedTreatment(null)
    setShowTreatmentModal(true)
  }

  const handleEditTreatment = (treatment) => {
    setSelectedTreatment(treatment)
    setShowTreatmentModal(true)
  }

  const handleTreatmentSaved = () => {
    refreshPatientData()
  }

  const handleRemoveTreatment = async (treatment) => {
    const confirmMessage = await t('Are you sure you want to remove this treatment?')
    if (!confirm(confirmMessage)) return

    try {
      const { data: currentPatientData, error: fetchError } = await supabase
        .from('patients')
        .select('ongoing_treatments, ongoing_treatment_past, report_url_treatments, report_url_treatments_past')
        .eq('aadhar_number', currentPatient.aadhar)
        .single()

      if (fetchError) throw fetchError

      const updatedTreatments = (currentPatientData.ongoing_treatments || []).filter(t => {
        // Use unique identifier first, then fallback to name matching
        if (treatment.id && t.id) {
          return t.id !== treatment.id
        }
        // If no ID, use treatmentName or name for matching
        const treatmentIdentifier = treatment.treatmentName || treatment.name
        const currentIdentifier = t.treatmentName || t.name
        return currentIdentifier !== treatmentIdentifier
      })

      // Also remove from treatment history
      const treatmentId = treatment.id || treatment.treatmentName || treatment.name
      const updatedTreatmentHistory = (currentPatientData.ongoing_treatment_past || []).filter(historyItem => {
        return historyItem.treatmentId !== treatmentId &&
               historyItem.treatmentName !== (treatment.treatmentName || treatment.name)
      })

      // Also remove associated reports from report_url_treatments and report_url_treatments_past
      const updatedReportUrlTreatments = { ...currentPatientData.report_url_treatments }
      const updatedReportUrlTreatmentsPast = { ...currentPatientData.report_url_treatments_past }
      
      // Remove reports associated with this treatment
      Object.keys(updatedReportUrlTreatments).forEach(reportKey => {
        if (updatedReportUrlTreatments[reportKey]?.treatmentId === treatmentId) {
          delete updatedReportUrlTreatments[reportKey]
        }
      })
      
      Object.keys(updatedReportUrlTreatmentsPast).forEach(reportKey => {
        if (updatedReportUrlTreatmentsPast[reportKey]?.treatmentId === treatmentId) {
          delete updatedReportUrlTreatmentsPast[reportKey]
        }
      })

      console.log('=== REMOVE TREATMENT DEBUG ===');
      console.log('Current patient aadhar:', currentPatient.aadhar);
      console.log('Updated treatments:', updatedTreatments);
      console.log('Updated treatment history:', updatedTreatmentHistory);
      
      const { error: updateError } = await supabase
        .from('patients')
        .update({ 
          ongoing_treatments: updatedTreatments,
          ongoing_treatment_past: updatedTreatmentHistory,
          report_url_treatments: updatedReportUrlTreatments,
          report_url_treatments_past: updatedReportUrlTreatmentsPast
        })
        .eq('aadhar_number', currentPatient.aadhar)
      
      console.log('Update error:', updateError);

      if (updateError) throw updateError

      refreshPatientData()
    } catch (err) {
      console.error('Error removing treatment:', err)
      console.error('Full error details:', err)
      alert(`Failed to remove treatment: ${err.message || 'Unknown error'}. Please try again.`)
    }
  }

  const handleMarkCompleted = async (treatment) => {
    const confirmMessage = await t('Mark this treatment as completed?')
    if (!confirm(confirmMessage)) return

    try {
      const { data: currentPatientData, error: fetchError } = await supabase
        .from('patients')
        .select('ongoing_treatments, past_treatments, ongoing_treatment_past, past_treatments_past, report_url_treatments, report_url_treatments_past')
        .eq('aadhar_number', currentPatient.aadhar)
        .single()

      if (fetchError) throw fetchError

      // Remove from ongoing treatments
      const updatedOngoingTreatments = (currentPatientData.ongoing_treatments || []).filter(t => {
        // Use unique identifier first, then fallback to name matching
        if (treatment.id && t.id) {
          return t.id !== treatment.id
        }
        // If no ID, use treatmentName or name for matching
        const treatmentIdentifier = treatment.treatmentName || treatment.name
        const currentIdentifier = t.treatmentName || t.name
        return currentIdentifier !== treatmentIdentifier
      })

      // Add to past treatments with completion date
      const completedTreatment = {
        ...treatment,
        completedDate: new Date().toISOString(),
        status: 'completed'
      }

      const updatedPastTreatments = [
        ...(currentPatientData.past_treatments || []),
        completedTreatment
      ]

      // Move treatment history from ongoing_treatment_past to past_treatments_past
      const treatmentId = treatment.id || treatment.treatmentName || treatment.name
      const currentOngoingTreatmentPast = currentPatientData.ongoing_treatment_past || []
      const currentPastTreatmentsPast = currentPatientData.past_treatments_past || []
      
      // Find history entries for this specific treatment
      const treatmentHistoryToMove = currentOngoingTreatmentPast.filter(historyItem => {
        return historyItem.treatmentId === treatmentId ||
               historyItem.treatmentName === (treatment.treatmentName || treatment.name)
      })
      
      // Remove history entries for this treatment from ongoing_treatment_past
      const updatedOngoingTreatmentPast = currentOngoingTreatmentPast.filter(historyItem => {
        return historyItem.treatmentId !== treatmentId &&
               historyItem.treatmentName !== (treatment.treatmentName || treatment.name)
      })
      
      // Add treatment history to past_treatments_past with completion timestamp
      const treatmentHistoryWithCompletion = treatmentHistoryToMove.map(historyItem => ({
        ...historyItem,
        treatmentCompletedAt: new Date().toISOString()
      }))
      
      const updatedPastTreatmentsPast = [
        ...currentPastTreatmentsPast,
        ...treatmentHistoryWithCompletion
      ]

      // Move associated reports from report_url_treatments to report_url_treatments_past
      const updatedReportUrlTreatments = { ...currentPatientData.report_url_treatments }
      const updatedReportUrlTreatmentsPast = { ...currentPatientData.report_url_treatments_past }
      
      // Move reports associated with this treatment to past
      Object.keys(updatedReportUrlTreatments).forEach(reportKey => {
        if (updatedReportUrlTreatments[reportKey]?.treatmentId === treatmentId) {
          updatedReportUrlTreatmentsPast[reportKey] = {
            ...updatedReportUrlTreatments[reportKey],
            movedToPastAt: new Date().toISOString()
          }
          delete updatedReportUrlTreatments[reportKey]
        }
      })

      console.log('=== MARK COMPLETED DEBUG ===');
      console.log('Current patient aadhar:', currentPatient.aadhar);
      console.log('Updated ongoing treatments:', updatedOngoingTreatments);
      console.log('Updated past treatments:', updatedPastTreatments);
      
      const { error: updateError } = await supabase
        .from('patients')
        .update({ 
          ongoing_treatments: updatedOngoingTreatments,
          past_treatments: updatedPastTreatments,
          ongoing_treatment_past: updatedOngoingTreatmentPast,
          past_treatments_past: updatedPastTreatmentsPast,
          report_url_treatments: updatedReportUrlTreatments,
          report_url_treatments_past: updatedReportUrlTreatmentsPast
        })
        .eq('aadhar_number', currentPatient.aadhar)
      
      console.log('Mark completed update error:', updateError);

      if (updateError) throw updateError

      refreshPatientData()
    } catch (err) {
      console.error('Error marking treatment as completed:', err)
      console.error('Full error details:', err)
      alert(`Failed to mark treatment as completed: ${err.message || 'Unknown error'}. Please try again.`)
    }
  }

  const handleViewReports = (treatment) => {
    setSelectedReports(treatment.attachedReports || [])
    setShowReportsModal(true)
  }

  const handleViewPastTreatment = (treatment) => {
    setSelectedPastTreatment(treatment)
    setShowPastTreatmentModal(true)
  }

  const handleViewTreatmentHistory = async (treatment) => {
    try {
      // Get treatment history from ongoing_treatment_past column
      const { data: patientData, error } = await supabase
        .from('patients')
        .select('ongoing_treatment_past')
        .eq('aadhar_number', currentPatient.aadhar)
        .single()

      if (error) throw error

      // Filter history for this specific treatment
      const treatmentId = treatment.id || treatment.treatmentName || treatment.name
      const allHistory = patientData.ongoing_treatment_past || []
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
      const { data: patientData, error: fetchError } = await supabase
        .from('patients')
        .select('past_treatments_past')
        .eq('aadhar_number', currentPatient.aadhar)
        .single()

      if (fetchError) {
        console.error('Error fetching past treatment history:', fetchError)
        alert('Failed to load treatment history. Please try again.')
        return
      }

      // Filter history for this specific treatment
      const treatmentId = treatment.id || treatment.treatmentName || treatment.name
      const pastTreatmentHistory = (patientData.past_treatments_past || []).filter(historyItem => {
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

  const InfoCard = ({ title, icon, children, bgColor = "bg-white" }) => (
    <div className={`${bgColor} rounded-xl shadow-sm border border-gray-200 p-6`}>
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  )

  const handlePrintPrescription = (treatment) => {
    setSelectedTreatmentForPrint(treatment)
    setShowPrescriptionPrint(true)
  }

  const TreatmentCard = ({ treatment, index, onEdit, onRemove, onMarkCompleted, onViewReports, onViewHistory, onPrintPrescription }) => {
    const displayText = typeof treatment === 'string' ? treatment : 
                       typeof treatment === 'object' ? (treatment.treatmentName || treatment.name || 'Treatment') : 
                       String(treatment);
    
    const hasAttachedReports = treatment?.attachedReports && treatment.attachedReports.length > 0;
    
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 shadow-sm">
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
            onClick={() => onEdit(treatment)}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-2 rounded-lg transition-all duration-200"
            title="Edit Treatment"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>


        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-blue-200">
          <button
            onClick={() => onViewHistory(treatment)}
            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <TranslatedText>History</TranslatedText>
          </button>
          <button
            onClick={() => onPrintPrescription(treatment)}
            className="bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center"
            title="Print Latest Prescription"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a1 1 0 001-1v-4a1 1 0 00-1-1H9a1 1 0 00-1 1v4a1 1 0 001 1zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <TranslatedText>Print</TranslatedText>
          </button>
          <button
            onClick={() => onMarkCompleted(treatment)}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <TranslatedText>Mark Completed</TranslatedText>
          </button>
          <button
            onClick={() => onRemove(treatment)}
            className="bg-red-100 hover:bg-red-200 text-red-700 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  const PastTreatmentCard = ({ treatment, index, onViewDetails, onViewHistory }) => {
    const displayText = typeof treatment === 'string' ? treatment : 
                       typeof treatment === 'object' ? (treatment.treatmentName || treatment.name || 'Treatment') : 
                       String(treatment);
    
    const hasAttachedReports = treatment?.attachedReports && treatment.attachedReports.length > 0;
    
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1 cursor-pointer" onClick={() => onViewDetails(treatment)}>
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
              {hasAttachedReports && (
                <p className="text-xs text-purple-600">
                  📋 {treatment.attachedReports.length} Lab Report{treatment.attachedReports.length > 1 ? 's' : ''} Attached
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory(treatment);
              }}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>
            <div className="text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const ListItem = ({ item, index }) => {
    const displayText = typeof item === 'string' ? item : 
                       typeof item === 'object' ? (item.treatmentName || item.name || JSON.stringify(item)) : 
                       String(item);
    
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors">
        <div className="flex items-start">
          <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
          <div className="flex-1">
            <span className="text-gray-900 font-medium">{displayText}</span>
            {typeof item === 'object' && item.description && (
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            )}
            {typeof item === 'object' && item.startDate && (
              <p className="text-xs text-gray-500 mt-1">Started: {new Date(item.startDate).toLocaleDateString()}</p>
            )}
            {typeof item === 'object' && item.completedDate && (
              <p className="text-xs text-green-600 mt-1">Completed: {new Date(item.completedDate).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-xl shadow-sm transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <TranslatedText>Back to Dashboard</TranslatedText>
            </button>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <h1 className="text-xl font-bold text-gray-900"><TranslatedText>Patient Details</TranslatedText></h1>
                <p className="text-sm text-gray-600">{currentPatient.name}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Patient Header */}
          <div className="mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2"><TranslatedText>Medical Information</TranslatedText></h2>
              <p className="text-gray-600 mt-1"><TranslatedText>Comprehensive medical information</TranslatedText></p>
            </div>
          </div>

          {/* Patient Personal Info Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center mb-8">
              <div className="flex items-center mb-6 lg:mb-0">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mr-6 shadow-lg">
                  {currentPatient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">{currentPatient.name}</h2>
                  <p className="text-gray-600 text-lg">Aadhaar: {currentPatient.aadhar}</p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {currentPatient.age} years old
                    </span>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      {currentPatient.gender}
                    </span>
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      {currentPatient.bloodGroup}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center mb-3">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-blue-800"><TranslatedText>Contact</TranslatedText></h4>
                </div>
                <p className="text-blue-900 font-medium">{currentPatient.contact}</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center mb-3">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-green-800"><TranslatedText>Blood Group</TranslatedText></h4>
                </div>
                <p className="text-green-900 font-medium">{currentPatient.bloodGroup}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center mb-3">
                  <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2v-6a2 2 0 00-2-2h-4" />
                  </svg>
                  <h4 className="text-sm font-semibold text-purple-800"><TranslatedText>Age</TranslatedText></h4>
                </div>
                <p className="text-purple-900 font-medium">{currentPatient.age} years</p>
              </div>
              
              {currentPatient.dob && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                  <div className="flex items-center mb-3">
                    <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6h8m-8 0H4a2 2 0 00-2 2v6a2 2 0 002 2h16a2 2 0 002-2v-6a2 2 0 00-2-2h-4" />
                    </svg>
                    <h4 className="text-sm font-semibold text-orange-800"><TranslatedText>Date of Birth</TranslatedText></h4>
                  </div>
                  <p className="text-orange-900 font-medium">{new Date(currentPatient.dob).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            
            {currentPatient.address && (
              <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center mb-3">
                  <svg className="w-5 h-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h4 className="text-sm font-semibold text-gray-800">Address</h4>
                </div>
                <p className="text-gray-900">{currentPatient.address}</p>
              </div>
            )}
          </div>

          {/* AI Assistant Section */}
          <PatientAIAssistant patient={currentPatient} />

          {/* Medical Information Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
            {/* Ongoing Treatment */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Ongoing Treatment</h3>
                </div>
                <button
                  onClick={handleAddTreatment}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 px-4 rounded-xl font-medium transition-all duration-200 flex items-center shadow-lg hover:shadow-xl"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                {currentPatient.ongoing_treatments && Array.isArray(currentPatient.ongoing_treatments) && currentPatient.ongoing_treatments.length > 0 ? (
                  currentPatient.ongoing_treatments
                    .sort((a, b) => {
                      // Sort by created_at or updated_at if available, otherwise by index (newest first)
                      const dateA = new Date(a.updated_at || a.created_at || a.startDate || 0)
                      const dateB = new Date(b.updated_at || b.created_at || b.startDate || 0)
                      return dateB - dateA
                    })
                    .map((treatment, index) => (
                    <TreatmentCard
                      key={treatment.id || treatment.treatmentName || treatment.name || index}
                      treatment={treatment}
                      index={index}
                      onEdit={handleEditTreatment}
                      onRemove={handleRemoveTreatment}
                      onMarkCompleted={handleMarkCompleted}
                      onViewReports={handleViewReports}
                      onViewHistory={handleViewTreatmentHistory}
                      onPrintPrescription={handlePrintPrescription}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Ongoing Treatments</h4>
                    <p className="text-gray-600">This patient currently has no active treatments.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Past Treatment */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Past Treatment</h3>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                {currentPatient.past_treatments && Array.isArray(currentPatient.past_treatments) && currentPatient.past_treatments.length > 0 ? (
                  currentPatient.past_treatments
                    .sort((a, b) => {
                      // Sort by completion date, updated_at, or created_at (newest first)
                      const dateA = new Date(a.completedDate || a.updated_at || a.created_at || a.endDate || 0)
                      const dateB = new Date(b.completedDate || b.updated_at || b.created_at || b.endDate || 0)
                      return dateB - dateA
                    })
                    .map((treatment, index) => (
                    <PastTreatmentCard
                      key={treatment.id || treatment.treatmentName || treatment.name || index}
                      treatment={treatment}
                      index={index}
                      onViewDetails={handleViewPastTreatment}
                      onViewHistory={handleViewPastTreatmentHistory}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Past Treatments</h4>
                    <p className="text-gray-600">This patient has no completed treatments on record.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Vaccination Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.871 4A17.926 17.926 0 003 12c0 2.874.673 5.59 1.871 8m14.13 0a17.926 17.926 0 001.87-8c0-2.874-.673-5.59-1.87-8M9 9h1.246a1 1 0 01.961.725l1.586 5.55a1 1 0 00.961.725H15m1-7h-.08a2 2 0 00-1.519.698L12.16 11.9a1 1 0 01-.78.4H9" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Vaccinations</h3>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                {currentPatient.patient_vaccinations && Array.isArray(currentPatient.patient_vaccinations) && currentPatient.patient_vaccinations.length > 0 ? (
                  currentPatient.patient_vaccinations
                    .sort((a, b) => {
                      // Sort by vaccination date (newest first)
                      const dateA = new Date(a.vaccination_date || a.date || 0)
                      const dateB = new Date(b.vaccination_date || b.date || 0)
                      return dateB - dateA
                    })
                    .map((vaccination, index) => {
                      const vaccineName = vaccination.vaccine_name || vaccination.name || 'Vaccination'
                      const vaccinationDate = vaccination.vaccination_date || vaccination.date
                      const administeredBy = vaccination.administered_by || vaccination.doctor || vaccination.hospital
                      const batchNumber = vaccination.batch_number
                      const nextDue = vaccination.next_due_date
                      
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
                                  <p className="text-xs text-emerald-600">
                                    <span className="font-medium">Batch:</span> {batchNumber}
                                  </p>
                                )}
                                {nextDue && (
                                  <p className="text-xs text-orange-600 font-medium">
                                    <span className="font-medium">Next due:</span> {new Date(nextDue).toLocaleDateString('en-IN', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-emerald-600">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )
                    })
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.871 4A17.926 17.926 0 003 12c0 2.874.673 5.59 1.871 8m14.13 0a17.926 17.926 0 001.87-8c0-2.874-.673-5.59-1.87-8M9 9h1.246a1 1 0 01.961.725l1.586 5.55a1 1 0 00.961.725H15m1-7h-.08a2 2 0 00-1.519.698L12.16 11.9a1 1 0 01-.78.4H9" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Vaccinations Recorded</h4>
                    <p className="text-gray-600">This patient has no vaccination records on file.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Reports Section */}
            <div className="xl:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Medical Reports</h3>
              </div>
              
              <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
                {(() => {
                  // Check multiple possible field names for reports
                  const reports = currentPatient.report_url || currentPatient.reportUrls || currentPatient.labReports || {};
                  const hasReports = typeof reports === 'object' && Object.keys(reports).length > 0;
                  
                  return hasReports ? (
                    Object.entries(reports).map(([reportName, reportData], index) => {
                      // Handle both old format (direct URL) and new format (object with url, date, etc.)
                      const reportUrl = typeof reportData === 'string' ? reportData : reportData?.url;
                      const reportDate = typeof reportData === 'object' ? reportData?.date : null;
                      const uploadedBy = typeof reportData === 'object' ? reportData?.uploadedBy : 'unknown';
                      
                      return (
                        <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center flex-1">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-blue-900 mb-1">{reportName} Report</h4>
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
                      Medical reports and documents will appear here when they are uploaded to the patient's record.
                    </p>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* Hospital Admissions Section */}
          <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Hospital Admissions</h3>
            </div>
            <div className="max-h-80 overflow-y-auto pr-2">
              <DoctorHospitalAdmissions patientId={currentPatient.id} />
            </div>
          </div>

          {/* Treatment Modal */}
          <TreatmentModal
            isOpen={showTreatmentModal}
            onClose={() => setShowTreatmentModal(false)}
            patient={currentPatient}
            treatment={selectedTreatment}
            onTreatmentSaved={handleTreatmentSaved}
          />

          {/* Treatment History Modal */}
          <TreatmentHistoryModal
            isOpen={showTreatmentHistoryModal}
            onClose={() => setShowTreatmentHistoryModal(false)}
            treatment={selectedTreatmentForHistory}
            treatmentHistory={treatmentHistory}
          />

          {/* Lab Reports Modal */}
          {showReportsModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Attached Lab Reports</h2>
                        <p className="text-sm text-gray-600">{selectedReports.length} report{selectedReports.length > 1 ? 's' : ''} attached to treatment</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowReportsModal(false)}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-3">
                    {selectedReports.map((report, index) => (
                      <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 hover:from-purple-100 hover:to-pink-100 transition-colors">
                        <div className="flex items-center">
                          <svg className="w-8 h-8 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <div className="flex-1">
                            <h4 className="font-semibold text-purple-900">
                              {typeof report === 'string' ? report : report?.name || report?.title || `Lab Report ${index + 1}`}
                            </h4>
                            <p className="text-sm text-purple-700">Attached to treatment</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Past Treatment Details Modal */}
          {showPastTreatmentModal && selectedPastTreatment && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Treatment Details</h2>
                        <p className="text-green-100 text-sm">Completed Treatment Information</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPastTreatmentModal(false)}
                      className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                    >
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {/* Treatment Name */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="text-xl font-bold text-green-900 mb-2">
                      {typeof selectedPastTreatment === 'string' 
                        ? selectedPastTreatment 
                        : selectedPastTreatment.treatmentName || selectedPastTreatment.name || 'Treatment'}
                    </h3>
                    {typeof selectedPastTreatment === 'object' && selectedPastTreatment.description && (
                      <p className="text-green-700">{selectedPastTreatment.description}</p>
                    )}
                  </div>

                  {/* Treatment Timeline */}
                  {typeof selectedPastTreatment === 'object' && (selectedPastTreatment.startDate || selectedPastTreatment.completedDate) && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Treatment Timeline
                      </h4>
                      <div className="space-y-2">
                        {selectedPastTreatment.startDate && (
                          <div className="flex items-center text-sm">
                            <span className="w-20 text-gray-600">Started:</span>
                            <span className="font-medium text-gray-900">
                              {new Date(selectedPastTreatment.startDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        {selectedPastTreatment.completedDate && (
                          <div className="flex items-center text-sm">
                            <span className="w-20 text-gray-600">Completed:</span>
                            <span className="font-medium text-green-600">
                              {new Date(selectedPastTreatment.completedDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        {selectedPastTreatment.startDate && selectedPastTreatment.completedDate && (
                          <div className="flex items-center text-sm">
                            <span className="w-20 text-gray-600">Duration:</span>
                            <span className="font-medium text-gray-900">
                              {Math.ceil((new Date(selectedPastTreatment.completedDate) - new Date(selectedPastTreatment.startDate)) / (1000 * 60 * 60 * 24))} days
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Treatment Details */}
                  {typeof selectedPastTreatment === 'object' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedPastTreatment.doctor && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Doctor
                          </h4>
                          <p className="text-blue-800">{selectedPastTreatment.doctor}</p>
                        </div>
                      )}

                      {selectedPastTreatment.hospital && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                          <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Hospital
                          </h4>
                          <p className="text-purple-800">{selectedPastTreatment.hospital}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Medications */}
                  {typeof selectedPastTreatment === 'object' && selectedPastTreatment.medications && selectedPastTreatment.medications.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <h4 className="font-semibold text-orange-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                        </svg>
                        Medications
                      </h4>
                      <div className="space-y-2">
                        {selectedPastTreatment.medications.map((medication, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-orange-200">
                            <p className="font-medium text-orange-900">{medication.name || medication}</p>
                            {medication.dosage && <p className="text-sm text-orange-700">Dosage: {medication.dosage}</p>}
                            {medication.frequency && <p className="text-sm text-orange-700">Frequency: {medication.frequency}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lab Reports */}
                  {typeof selectedPastTreatment === 'object' && selectedPastTreatment.attachedReports && selectedPastTreatment.attachedReports.length > 0 && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Lab Reports ({selectedPastTreatment.attachedReports.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedPastTreatment.attachedReports.map((report, index) => {
                          const reportObj = typeof report === 'string' ? { name: report, url: report } : report;
                          const reportName = reportObj?.name || reportObj?.title || `Report ${index + 1}`;
                          
                          return (
                            <div key={index} className="bg-white rounded-lg p-3 border border-purple-200 hover:border-purple-300 transition-colors cursor-pointer"
                                 onClick={() => {
                                   // Open report URL if available
                                   if (reportObj?.url && reportObj.url.startsWith('http')) {
                                     window.open(reportObj.url, '_blank');
                                   } else {
                                     // Show in reports modal
                                     handleViewReports(selectedPastTreatment);
                                   }
                                 }}>
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-purple-900">{reportName}</p>
                                  {reportObj?.date && (
                                    <p className="text-sm text-purple-600">
                                      Uploaded: {new Date(reportObj.date).toLocaleDateString('en-IN', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  )}
                                  {typeof report === 'string' && (
                                    <p className="text-xs text-purple-500 mt-1">Click to view details</p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  {reportObj?.url && reportObj.url.startsWith('http') && (
                                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  )}
                                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {typeof selectedPastTreatment === 'object' && selectedPastTreatment.notes && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Notes
                      </h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedPastTreatment.notes}</p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 rounded-b-3xl flex justify-end">
                  <button
                    onClick={() => setShowPastTreatmentModal(false)}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Prescription Print Modal */}
          {showPrescriptionPrint && selectedTreatmentForPrint && (
            <PrescriptionPrint
              patient={currentPatient}
              treatment={selectedTreatmentForPrint}
              doctorInfo={{
                name: 'Dr. [Doctor Name]',
                registration: '[Registration Number]',
                specialization: '[Specialization]',
                contact: '[Contact Number]',
                hospital: '[Hospital Name]'
              }}
              onClose={() => setShowPrescriptionPrint(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default PatientDetailsView
