import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { mockPatientData } from '../data/mockPatientData'

const AddPatientModal = ({ onClose, onAddPatient, hospitalData }) => {
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [patientFound, setPatientFound] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState(null) // 'fingerprint' or 'aadhaar'
  const [admissionData, setAdmissionData] = useState({
    ward: '',
    bed_number: '',
    reason_for_admission: '',
    condition_at_admission: '',
    treatment_plan: '',
    insurance_provider: '',
    insurance_policy_number: ''
  })

  const handleAadhaarVerification = async () => {
    if (!aadhaarNumber.trim()) {
      setError('Please enter Aadhaar number')
      return
    }

    if (aadhaarNumber.length !== 12) {
      setError('Aadhaar number must be 12 digits')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('=== AADHAAR VERIFICATION START ===')
      console.log('Verifying Aadhaar:', aadhaarNumber)
      console.log('Supabase client status:', supabase ? 'Connected' : 'Not connected')
      
      // First try Supabase database (primary source)
      console.log('=== CHECKING SUPABASE DATABASE ===')
      const { data: supabaseData, error: queryError } = await supabase
        .from('patients')
        .select('*')
        .eq('aadhar_number', aadhaarNumber)

      console.log('Supabase query result:')
      console.log('- Data:', supabaseData)
      console.log('- Error:', queryError)
      console.log('- Data length:', supabaseData?.length || 0)

      if (queryError) {
        console.error('Supabase query error details:', queryError)
        setError(`Database error: ${queryError.message}`)
        return
      }

      if (supabaseData && supabaseData.length > 0) {
        const patient = supabaseData[0] // Get first patient if multiple found
        console.log('=== PATIENT FOUND IN SUPABASE ===')
        console.log('Patient data from database:', patient)
        setPatientFound(patient)
        return
      }

      console.log('=== NO PATIENT IN SUPABASE, CHECKING MOCK DATA ===')
      // Fallback to mock data if not found in Supabase
      const mockPatient = mockPatientData[aadhaarNumber]
      if (mockPatient) {
        console.log('Found patient in mock data (fallback):', mockPatient)
        // Convert mock data to match expected format
        const patientData = {
          id: mockPatient.aadhar,
          aadhaar_number: mockPatient.aadhar,
          name: mockPatient.name,
          age: mockPatient.age,
          gender: mockPatient.gender,
          contact: mockPatient.contact,
          blood_group: mockPatient.bloodGroup,
          medical_history: mockPatient.pastTreatment?.join(', ') || '',
          ongoing_treatments: mockPatient.ongoingTreatment?.join(', ') || '',
          past_treatments: mockPatient.pastTreatment?.join(', ') || ''
        }
        console.log('Using mock data:', patientData)
        setPatientFound(patientData)
        return
      }

      // Patient not found in either source
      console.log('=== PATIENT NOT FOUND ANYWHERE ===')
      setError('Patient with this Aadhaar number not found in database or mock data.')
    } catch (error) {
      console.error('=== VERIFICATION ERROR ===', error)
      setError(`Failed to verify Aadhaar number: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAdmissionDataChange = (e) => {
    const { name, value } = e.target
    setAdmissionData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAdmitPatient = async () => {
    if (!patientFound) return

    // Validate required fields
    if (!admissionData.ward || !admissionData.bed_number || !admissionData.reason_for_admission) {
      setError('Please fill in all required fields (Ward, Bed Number, Reason for Admission)')
      return
    }

    setLoading(true)
    try {
      // Create admission record in hospital_admissions table
      const admissionRecord = {
        patient_id: patientFound.id,
        hospital_id: hospitalData?.id || null,
        doctor_id: null, // Can be assigned later
        admission_date: new Date().toISOString(),
        ward: admissionData.ward,
        bed_number: admissionData.bed_number,
        reason_for_admission: admissionData.reason_for_admission,
        condition_at_admission: admissionData.condition_at_admission,
        treatment_plan: admissionData.treatment_plan,
        insurance_provider: admissionData.insurance_provider,
        insurance_policy_number: admissionData.insurance_policy_number,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('=== ADMISSION RECORD DEBUG ===')
      console.log('Hospital data passed to modal:', hospitalData)
      console.log('Hospital ID being used:', hospitalData?.id)
      console.log('Inserting admission record:', admissionRecord)

      // Insert into hospital_admissions table
      const { data: insertedAdmission, error: insertError } = await supabase
        .from('hospital_admissions')
        .insert([admissionRecord])
        .select()

      if (insertError) {
        console.error('Database insertion error:', insertError)
        throw insertError
      }

      console.log('Successfully inserted admission:', insertedAdmission)

      // Combine patient data with admission data for display
      const patientWithAdmission = {
        ...patientFound,
        ...admissionRecord,
        admission_id: insertedAdmission[0]?.id || `temp_${Date.now()}`
      }

      onAddPatient(patientWithAdmission)
      onClose()
    } catch (error) {
      console.error('Error admitting patient:', error)
      setError(`Failed to admit patient: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPatientFound(null)
    setAadhaarNumber('')
    setSelectedMethod(null)
    setAdmissionData({
      ward: '',
      bed_number: '',
      reason_for_admission: '',
      condition_at_admission: '',
      treatment_plan: '',
      insurance_provider: '',
      insurance_policy_number: ''
    })
    setError('')
  }

  const handleFingerprintScan = () => {
    setError('Fingerprint scanning will be implemented soon!')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {patientFound ? 'Admit Patient' : 'Find Patient'}
            </h3>
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
          {!selectedMethod ? (
            <>
              {/* Method Selection Screen */}
              <p className="text-gray-600 mb-6 text-center">Choose verification method to find patient:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fingerprint Option */}
                <div 
                  onClick={handleFingerprintScan}
                  className="border-2 border-gray-200 hover:border-blue-400 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50 cursor-pointer transition-all duration-200 hover:shadow-lg group"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Fingerprint Scan</h4>
                    <p className="text-sm text-gray-600">Quick biometric verification</p>
                    <span className="inline-block mt-3 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                </div>

                {/* Aadhaar Option */}
                <div 
                  onClick={() => setSelectedMethod('aadhaar')}
                  className="border-2 border-gray-200 hover:border-green-400 rounded-xl p-6 bg-gradient-to-br from-green-50 to-emerald-50 cursor-pointer transition-all duration-200 hover:shadow-lg group"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Aadhaar Number</h4>
                    <p className="text-sm text-gray-600">Enter 12-digit Aadhaar ID</p>
                    <span className="inline-block mt-3 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Available</span>
                  </div>
                </div>
              </div>
            </>
          ) : !patientFound ? (
            <>
              {/* Back Button */}
              <div className="mb-4">
                <button
                  onClick={() => setSelectedMethod(null)}
                  className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to method selection
                </button>
              </div>

              <p className="text-gray-600 mb-6">Enter Aadhaar number to find patient:</p>

              {/* Aadhaar Input */}
              <div className="border border-primary-200 rounded-lg p-4 bg-primary-50 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-primary-700 mb-2">Aadhaar Verification</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      placeholder="Enter 12-digit Aadhaar"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center"
                      maxLength={12}
                    />
                    <button
                      onClick={handleAadhaarVerification}
                      disabled={loading || aadhaarNumber.length !== 12}
                      className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Verifying...
                        </div>
                      ) : (
                        'Find Patient'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Patient Found - Show Details and Admission Form */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-green-800 mb-2">Patient Found</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {patientFound.name}</div>
                  <div><span className="font-medium">Age:</span> {patientFound.age}</div>
                  <div><span className="font-medium">Gender:</span> {patientFound.gender}</div>
                  <div><span className="font-medium">Contact:</span> {patientFound.contact}</div>
                  <div><span className="font-medium">Blood Group:</span> {patientFound.blood_group}</div>
                  <div><span className="font-medium">Aadhar:</span> {patientFound.aadhaar_number || aadhaarNumber}</div>
                </div>
                <button
                  onClick={resetForm}
                  className="mt-3 text-sm text-primary-600 hover:text-primary-700"
                >
                  Search Different Patient
                </button>
              </div>

              {/* Admission Form */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Admission Details</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ward *</label>
                    <input
                      type="text"
                      name="ward"
                      value={admissionData.ward}
                      onChange={handleAdmissionDataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., ICU, General, Cardiology"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bed Number *</label>
                    <input
                      type="text"
                      name="bed_number"
                      value={admissionData.bed_number}
                      onChange={handleAdmissionDataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., A-101, B-205"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Admission *</label>
                  <textarea
                    name="reason_for_admission"
                    value={admissionData.reason_for_admission}
                    onChange={handleAdmissionDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={2}
                    placeholder="Brief description of admission reason"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condition at Admission</label>
                  <textarea
                    name="condition_at_admission"
                    value={admissionData.condition_at_admission}
                    onChange={handleAdmissionDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={2}
                    placeholder="Patient's condition upon admission"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Plan</label>
                  <textarea
                    name="treatment_plan"
                    value={admissionData.treatment_plan}
                    onChange={handleAdmissionDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    rows={2}
                    placeholder="Planned treatment approach"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Provider</label>
                    <input
                      type="text"
                      name="insurance_provider"
                      value={admissionData.insurance_provider}
                      onChange={handleAdmissionDataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., HDFC ERGO, Star Health"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Insurance Policy Number</label>
                    <input
                      type="text"
                      name="insurance_policy_number"
                      value={admissionData.insurance_policy_number}
                      onChange={handleAdmissionDataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Policy number"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleAdmitPatient}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Admitting...' : 'Admit Patient'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddPatientModal
