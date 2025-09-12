import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabaseClient'
import LabAddPatientModal from './LabAddPatientModal'

const LabReports = ({ labData }) => {
  const { user } = useUser()
  const [pendingReports, setPendingReports] = useState([])
  const [completedReports, setCompletedReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [uploadingReports, setUploadingReports] = useState({})
  const [selectedTestTypes, setSelectedTestTypes] = useState({})
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  useEffect(() => {
    if (labData) {
      fetchReports()
    }
  }, [labData])

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_reports')
        .select('*')
        .eq('lab_id', labData.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const pending = data.filter(report => report.status === 'pending')
      const completed = data.filter(report => report.status === 'completed')

      setPendingReports(pending)
      setCompletedReports(completed)
    } catch (error) {
      console.error('Error fetching reports:', error)
      showToast('Failed to fetch reports', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000)
  }

  const handleAddPatient = async (patientData) => {
    try {
      console.log('Adding patient with data:', patientData)
      console.log('Lab data:', labData)

      const reportData = {
        patient_id: patientData.id,
        lab_id: labData?.id || 'demo-lab-id',
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender,
        contact_number: patientData.contact,
        test_type: 'General Test',
        sample_type: 'Blood',
        referring_doctor: 'Walk-in',
        collection_date: new Date().toISOString(),
        urgency: 'Normal',
        status: 'pending'
      }

      console.log('Report data to insert:', reportData)

      // Try to insert into Supabase lab_reports table, fallback to local state
      try {
        const { data: insertedData, error } = await supabase
          .from('lab_reports')
          .insert([reportData])
          .select()

        if (error) {
          console.error('Supabase insert error:', error)
          // Fallback to local state
          const newReport = {
            id: `temp_${Date.now()}`,
            ...reportData
          }
          setPendingReports(prev => [newReport, ...prev])
        } else {
          console.log('Successfully inserted report:', insertedData)
          await fetchReports()
        }
      } catch (supabaseError) {
        console.error('Supabase connection error:', supabaseError)
        // Fallback to local state
        const newReport = {
          id: `temp_${Date.now()}`,
          ...reportData
        }
        setPendingReports(prev => [newReport, ...prev])
      }

      showToast('Patient added successfully')
      setShowAddModal(false)
    } catch (error) {
      console.error('Error adding patient:', error)
      showToast(`Failed to add patient: ${error.message}`, 'error')
    }
  }

  const handleFileUpload = async (reportId, file) => {
    if (!file) return

    const selectedTestType = selectedTestTypes[reportId]
    if (!selectedTestType) {
      showToast('Please select a test type first', 'error')
      return
    }

    setUploadingReports(prev => ({ ...prev, [reportId]: true }))

    try {
      // Upload to Supabase Storage
      const fileName = `${reportId}-${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('patient-reports')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('patient-reports')
        .getPublicUrl(fileName)

      console.log('File uploaded successfully:', publicUrl)

      // Update lab_reports table with report URL and test type
      const { error: updateError } = await supabase
        .from('lab_reports')
        .update({ 
          report_url: publicUrl,
          test_type: selectedTestType
        })
        .eq('id', reportId)

      if (updateError) {
        console.error('Update error:', updateError)
        // If lab_reports update fails, update local state
        setPendingReports(prev => 
          prev.map(report => 
            report.id === reportId 
              ? { ...report, report_url: publicUrl, test_type: selectedTestType }
              : report
          )
        )
      } else {
        console.log('Report URL updated in database')
        await fetchReports()
      }

      // Update patients table with report URL using test type as key
      try {
        const report = pendingReports.find(r => r.id === reportId)
        if (report && report.patient_id) {
          console.log('Adding report URL to patient table:', publicUrl, 'for Patient ID:', report.patient_id, 'Test Type:', selectedTestType)
          
          // Get current report URLs object
          const { data: patientData, error: fetchError } = await supabase
            .from('patients')
            .select('report_url')
            .eq('id', report.patient_id)
          
          if (!fetchError && patientData && patientData.length > 0) {
            const patient = patientData[0]
            const existingReports = patient?.report_url || {}
            
            // Add new URL with test type as key and current date
            const updatedReports = {
              ...existingReports,
              [selectedTestType]: {
                url: publicUrl,
                date: new Date().toISOString(),
                uploadedBy: 'lab'
              }
            }
            
            // Also get current report_url_treatments to update it
            const { data: treatmentData, error: treatmentFetchError } = await supabase
              .from('patients')
              .select('report_url_treatments')
              .eq('id', report.patient_id)
            
            let treatmentReportsUpdate = {}
            if (!treatmentFetchError && treatmentData && treatmentData.length > 0) {
              const existingTreatmentReports = treatmentData[0]?.report_url_treatments || {}
              treatmentReportsUpdate = {
                ...existingTreatmentReports,
                [selectedTestType]: {
                  url: publicUrl,
                  date: new Date().toISOString(),
                  uploadedBy: 'lab',
                  treatmentId: null // Available for any treatment
                }
              }
            } else {
              treatmentReportsUpdate = {
                [selectedTestType]: {
                  url: publicUrl,
                  date: new Date().toISOString(),
                  uploadedBy: 'lab',
                  treatmentId: null // Available for any treatment
                }
              }
            }
            
            const { error: patientUpdateError } = await supabase
              .from('patients')
              .update({ 
                report_url: updatedReports,
                report_url_treatments: treatmentReportsUpdate
              })
              .eq('id', report.patient_id)
            
            if (patientUpdateError) {
              console.error('Failed to update patient report_url:', patientUpdateError)
            } else {
              console.log('✅ Successfully added report URL to patient table with test type as key')
            }
          } else {
            console.log('Patient not found in database for ID:', report.patient_id)
          }
        }
      } catch (patientError) {
        console.error('Error updating patient table:', patientError)
      }

      showToast('Report uploaded successfully')
    } catch (error) {
      console.error('Error uploading report:', error)
      showToast(`Upload failed: ${error.message}`, 'error')
    } finally {
      setUploadingReports(prev => ({ ...prev, [reportId]: false }))
    }
  }

  const handleSendReport = async (reportId) => {
    try {
      console.log('Sending report with ID:', reportId)
      
      // Find the report to get its details
      const report = pendingReports.find(r => r.id === reportId)
      if (!report) {
        showToast('Report not found', 'error')
        return
      }

      console.log('Report details:', report)

      // Update lab_reports status
      const { error } = await supabase
        .from('lab_reports')
        .update({ status: 'completed' })
        .eq('id', reportId)

      if (error) {
        console.error('Supabase update error:', error)
        // Fallback to local state update
        setPendingReports(prev => prev.filter(r => r.id !== reportId))
        setCompletedReports(prev => [{ ...report, status: 'completed' }, ...prev])
      } else {
        await fetchReports()
      }

      // Update patients table with report URL if report has been uploaded
      if (report.report_url && report.patient_aadhaar) {
        try {
          console.log('=== UPDATING PATIENT TABLE DURING SEND ===')
          console.log('Report URL:', report.report_url)
          console.log('Patient Aadhaar:', report.patient_aadhaar)
          
          // First get current report URLs array
          const { data: patientData, error: fetchError } = await supabase
            .from('patients')
            .select('report_url')
            .eq('aadhar_number', report.patient_aadhaar)
            .single()
          
          console.log('Patient fetch result during send:')
          console.log('- Data:', patientData)
          console.log('- Error:', fetchError)
          
          if (fetchError) {
            console.error('Patient fetch failed during send:', fetchError)
            // Try without .single() in case there are multiple or no records
            const { data: allPatients, error: fetchAllError } = await supabase
              .from('patients')
              .select('report_url')
              .eq('aadhar_number', report.patient_aadhaar)
            
            console.log('Fetch all patients result during send:', allPatients, fetchAllError)
            
            if (allPatients && allPatients.length > 0) {
              const patient = allPatients[0]
              const existingUrls = patient?.report_url || []
              const updatedUrls = existingUrls.includes(report.report_url) 
                ? existingUrls 
                : [...existingUrls, report.report_url]
              
              const { error: patientUpdateError } = await supabase
                .from('patients')
                .update({ report_url: updatedUrls })
                .eq('aadhar_number', report.patient_aadhaar)
              
              console.log('Patient update result during send:', patientUpdateError)
              if (!patientUpdateError) {
                console.log('✅ Successfully updated patient report_url array during send')
              }
            }
          } else if (patientData) {
            // Get existing URLs or initialize empty array
            const existingUrls = patientData?.report_url || []
            console.log('Existing URLs during send:', existingUrls)
            
            // Add new URL to array if not already present
            const updatedUrls = existingUrls.includes(report.report_url) 
              ? existingUrls 
              : [...existingUrls, report.report_url]
            
            console.log('Updated URLs during send:', updatedUrls)
            
            const { error: patientUpdateError } = await supabase
              .from('patients')
              .update({ report_url: updatedUrls })
              .eq('aadhar_number', report.patient_aadhaar)
            
            console.log('Patient update result during send:', patientUpdateError)
            if (patientUpdateError) {
              console.error('❌ Patient table update failed during send:', patientUpdateError)
            } else {
              console.log('✅ Successfully updated patient report_url array during send')
            }
          }
        } catch (patientError) {
          console.error('❌ Patient update error during send:', patientError)
        }
      } else {
        console.log('❌ Missing data for patient update - Report URL:', report.report_url, 'Patient Aadhaar:', report.patient_aadhaar)
      }

      showToast('Report sent successfully')
    } catch (error) {
      console.error('Error sending report:', error)
      showToast(`Failed to send report: ${error.message}`, 'error')
    }
  }

  const handleRemoveReport = async (reportId) => {
    if (!confirm('Are you sure you want to remove this report?')) return

    try {
      console.log('Removing report with ID:', reportId)
      
      const { error } = await supabase
        .from('lab_reports')
        .delete()
        .eq('id', reportId)

      if (error) {
        console.error('Supabase delete error:', error)
        // Fallback to local state update
        setPendingReports(prev => prev.filter(r => r.id !== reportId))
        setCompletedReports(prev => prev.filter(r => r.id !== reportId))
      } else {
        await fetchReports()
      }

      showToast('Report removed successfully')
    } catch (error) {
      console.error('Error removing report:', error)
      showToast(`Failed to remove report: ${error.message}`, 'error')
    }
  }

  const handleModifyReport = async (reportId, file) => {
    if (!file) return

    setUploadingReports(prev => ({ ...prev, [reportId]: true }))

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${reportId}_${Date.now()}.${fileExt}`
      const filePath = `patient-reports/${labData.id}/${reportId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('patient-reports')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('patient-reports')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('lab_reports')
        .update({ report_url: publicUrl })
        .eq('id', reportId)

      if (updateError) throw updateError

      await fetchReports()
      showToast('Report modified successfully')
    } catch (error) {
      console.error('Error modifying report:', error)
      showToast('Failed to modify report', 'error')
    } finally {
      setUploadingReports(prev => ({ ...prev, [reportId]: false }))
    }
  }

  const isModificationAllowed = (createdAt) => {
    const createdDate = new Date(createdAt)
    const now = new Date()
    const diffHours = (now - createdDate) / (1000 * 60 * 60)
    return diffHours <= 24
  }

  if (loading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toast.show && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
          }`}>
            {toast.message}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lab Dashboard</h1>
          <p className="text-gray-600">Manage your laboratory reports and patient data</p>
        </div>

        {/* Reports Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Reports */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Pending Reports</h2>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Add
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {pendingReports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending reports</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {pendingReports.map((report) => (
                    <div key={report.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{report.name}</h3>
                          <p className="text-sm text-gray-600">
                            {report.age} years, {report.gender} • {report.contact_number}
                          </p>
                          <p className="text-xs text-gray-500">
                            {report.test_type} • {report.collection_date}
                          </p>
                        </div>
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                          Pending
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Test Type Dropdown */}
                        <div className="mb-2">
                          <select
                            value={selectedTestTypes[report.id] || ''}
                            onChange={(e) => setSelectedTestTypes(prev => ({...prev, [report.id]: e.target.value}))}
                            className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">Select Test Type</option>
                            {labData?.tests_offered?.map((test, index) => (
                              <option key={index} value={test}>{test}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(report.id, e.target.files[0])}
                            className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                            disabled={uploadingReports[report.id] || !selectedTestTypes[report.id]}
                          />
                          {uploadingReports[report.id] && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          )}
                        </div>
                        {!selectedTestTypes[report.id] && (
                          <p className="text-xs text-red-500">Please select a test type before uploading</p>
                        )}
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSendReport(report.id)}
                            disabled={!report.report_url}
                            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white text-sm py-2 px-3 rounded transition-colors duration-200"
                          >
                            Send
                          </button>
                          <button
                            onClick={() => handleRemoveReport(report.id)}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded transition-colors duration-200"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Completed Reports */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Completed Reports</h2>
            </div>
            
            <div className="p-6">
              {completedReports.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No completed reports</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {completedReports.map((report) => (
                    <div key={report.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{report.name}</h3>
                          <p className="text-sm text-gray-600">
                            {report.age} years, {report.gender} • {report.contact_number}
                          </p>
                          <p className="text-xs text-gray-500">
                            {report.test_type} • {report.collection_date}
                          </p>
                        </div>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                          Completed
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {report.report_url && (
                          <a
                            href={report.report_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Report
                          </a>
                        )}
                        
                        {isModificationAllowed(report.created_at) ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleModifyReport(report.id, e.target.files[0])}
                              className="text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
                              disabled={uploadingReports[report.id]}
                            />
                            {uploadingReports[report.id] && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">Modification window expired (24h limit)</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Patient Modal */}
        {showAddModal && (
          <LabAddPatientModal
            onClose={() => setShowAddModal(false)}
            onAddPatient={handleAddPatient}
          />
        )}
      </div>
    </div>
  )
}

export default LabReports
