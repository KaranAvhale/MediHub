import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { mockPatientData } from '../data/mockPatientData'

const AddVaccinationModal = ({ isOpen, onClose, onAddVaccination, hospitalData }) => {
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [patientFound, setPatientFound] = useState(null)
  const [selectedMethod, setSelectedMethod] = useState(null) // 'fingerprint' or 'aadhaar'
  const [vaccinationData, setVaccinationData] = useState({
    vaccine_name: '',
    dose_number: '',
    vaccination_date: new Date().toISOString().split('T')[0], // Today's date as default
    notes: ''
  })

  const vaccines = [
    'BCG', 'Hepatitis B', 'DPT (Diphtheria, Pertussis, Tetanus)', 'Polio (OPV/IPV)', 
    'MMR (Measles, Mumps, Rubella)', 'Varicella (Chickenpox)', 'Pneumococcal (PCV)',
    'Rotavirus', 'Influenza (Flu)', 'HPV (Human Papillomavirus)', 'Meningococcal',
    'Typhoid', 'Japanese Encephalitis', 'Hepatitis A', 'Rabies', 'Yellow Fever',
    'COVID-19 (Covishield)', 'COVID-19 (Covaxin)', 'COVID-19 (Sputnik V)', 'Tetanus Toxoid'
  ]

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
      console.log('=== VACCINATION AADHAAR VERIFICATION START ===')
      console.log('Verifying Aadhaar:', aadhaarNumber)
      
      // First try Supabase database (primary source)
      const { data: supabaseData, error: queryError } = await supabase
        .from('patients')
        .select('*')
        .eq('aadhar_number', aadhaarNumber)

      console.log('Supabase query result:', { supabaseData, queryError })

      if (queryError) {
        console.error('Supabase query error:', queryError)
        setError(`Database error: ${queryError.message}`)
        return
      }

      if (supabaseData && supabaseData.length > 0) {
        const patient = supabaseData[0]
        console.log('Patient found in database:', patient)
        setPatientFound(patient)
        return
      }

      // Fallback to mock data if not found in Supabase
      const mockPatient = mockPatientData[aadhaarNumber]
      if (mockPatient) {
        console.log('Found patient in mock data:', mockPatient)
        const patientData = {
          id: mockPatient.aadhar,
          aadhar_number: mockPatient.aadhar,
          name: mockPatient.name,
          age: mockPatient.age,
          gender: mockPatient.gender,
          contact: mockPatient.contact,
          blood_group: mockPatient.bloodGroup,
          patient_vaccinations: mockPatient.patient_vaccinations || []
        }
        setPatientFound(patientData)
        return
      }

      // Patient not found
      setError('Patient with this Aadhaar number not found in database.')
    } catch (error) {
      console.error('Verification error:', error)
      setError(`Failed to verify Aadhaar number: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleVaccinationDataChange = (e) => {
    const { name, value } = e.target
    setVaccinationData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddVaccination = async () => {
    if (!patientFound) return

    // Validate required fields
    if (!vaccinationData.vaccine_name || !vaccinationData.dose_number || !vaccinationData.vaccination_date) {
      setError('Please fill in all required fields (Vaccine Name, Dose Number, Vaccination Date)')
      return
    }

    setLoading(true)
    try {
      // Create new vaccination record
      const newVaccination = {
        id: `vacc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        vaccine_name: vaccinationData.vaccine_name,
        dose_number: parseInt(vaccinationData.dose_number),
        vaccination_date: vaccinationData.vaccination_date,
        administered_by: hospitalData?.hospital_name || 'Hospital',
        hospital_id: hospitalData?.id || null,
        notes: vaccinationData.notes || '',
        created_at: new Date().toISOString()
      }

      console.log('=== VACCINATION RECORD DEBUG ===')
      console.log('Patient found:', patientFound)
      console.log('New vaccination record:', newVaccination)

      // Get current vaccinations array
      const currentVaccinations = patientFound.patient_vaccinations || []
      const updatedVaccinations = [...currentVaccinations, newVaccination]

      // Update patient record with new vaccination
      const { data: updatedPatient, error: updateError } = await supabase
        .from('patients')
        .update({ 
          patient_vaccinations: updatedVaccinations,
          updated_at: new Date().toISOString()
        })
        .eq('id', patientFound.id)
        .select()

      if (updateError) {
        console.error('Database update error:', updateError)
        throw updateError
      }

      console.log('Successfully updated patient with vaccination:', updatedPatient)

      // Call the parent callback with the new vaccination data
      onAddVaccination({
        ...newVaccination,
        patient_name: patientFound.name,
        patient_age: patientFound.age,
        patient_id: patientFound.id
      })

      onClose()
    } catch (error) {
      console.error('Error adding vaccination:', error)
      setError(`Failed to add vaccination: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPatientFound(null)
    setAadhaarNumber('')
    setSelectedMethod(null)
    setVaccinationData({
      vaccine_name: '',
      dose_number: '',
      vaccination_date: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setError('')
  }

  const handleFingerprintScan = () => {
    setError('Fingerprint scanning will be implemented soon!')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {patientFound ? 'Add Vaccination Record' : 'Find Patient for Vaccination'}
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
              <div className="border border-green-200 rounded-lg p-4 bg-green-50 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-green-700 mb-2">Aadhaar Verification</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      placeholder="Enter 12-digit Aadhaar"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center"
                      maxLength={12}
                    />
                    <button
                      onClick={handleAadhaarVerification}
                      disabled={loading || aadhaarNumber.length !== 12}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2 px-4 rounded-lg transition-colors duration-200"
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
              {/* Patient Found - Show Details and Vaccination Form */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-green-800 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Patient Found
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="font-medium">Name:</span> {patientFound.name}</div>
                  <div><span className="font-medium">Age:</span> {patientFound.age}</div>
                  <div><span className="font-medium">Gender:</span> {patientFound.gender}</div>
                  <div><span className="font-medium">Contact:</span> {patientFound.contact}</div>
                  <div><span className="font-medium">Blood Group:</span> {patientFound.blood_group}</div>
                  <div><span className="font-medium">Aadhaar:</span> {patientFound.aadhar_number || aadhaarNumber}</div>
                </div>
                <button
                  onClick={resetForm}
                  className="mt-3 text-sm text-green-600 hover:text-green-700"
                >
                  Search Different Patient
                </button>
              </div>

              {/* Vaccination Form */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Vaccination Details
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vaccine Name *</label>
                    <select
                      name="vaccine_name"
                      value={vaccinationData.vaccine_name}
                      onChange={handleVaccinationDataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select vaccine</option>
                      {vaccines.map((vaccine) => (
                        <option key={vaccine} value={vaccine}>
                          {vaccine}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dose Number *</label>
                    <select
                      name="dose_number"
                      value={vaccinationData.dose_number}
                      onChange={handleVaccinationDataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select dose</option>
                      <option value="1">1st Dose</option>
                      <option value="2">2nd Dose</option>
                      <option value="3">3rd Dose</option>
                      <option value="4">4th Dose</option>
                      <option value="5">5th Dose</option>
                      <option value="booster">Booster Dose</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vaccination Date *</label>
                  <input
                    type="date"
                    name="vaccination_date"
                    value={vaccinationData.vaccination_date}
                    onChange={handleVaccinationDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    max={new Date().toISOString().split('T')[0]} // Can't select future dates
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={vaccinationData.notes}
                    onChange={handleVaccinationDataChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    placeholder="Any additional notes about the vaccination (side effects, batch number, etc.)"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleAddVaccination}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Adding...' : 'Add Vaccination'}
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

export default AddVaccinationModal
