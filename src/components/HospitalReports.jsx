import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabaseClient'
import AddPatientModal from './AddPatientModal'
import AddVaccinationModal from './AddVaccinationModal'
import ChildIdModal from './ChildIdModal'
import UpdatePatientModal from './UpdatePatientModal'
import HospitalTreatmentModal from './HospitalTreatmentModal'
import HospitalHistoryModal from './HospitalHistoryModal'
import PatientDetailsModal from './PatientDetailsModal'
import ChildIdPrintModal from './ChildIdPrintModal'

const HospitalReports = ({ hospitalData }) => {
  const { user } = useUser()
  const [admittedPatients, setAdmittedPatients] = useState([])
  const [vaccinationRecords, setVaccinationRecords] = useState([])
  const [childIds, setChildIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddPatientModal, setShowAddPatientModal] = useState(false)
  const [showAddVaccinationModal, setShowAddVaccinationModal] = useState(false)
  const [showChildIdModal, setShowChildIdModal] = useState(false)
  const [showUpdatePatientModal, setShowUpdatePatientModal] = useState(false)
  const [showTreatmentModal, setShowTreatmentModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [selectedChild, setSelectedChild] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: '' })

  // Check if hospital is a Maternity Hospital
  const isMaternityHospital = hospitalData?.hospital_category?.includes('Maternity Hospital')

  useEffect(() => {
    if (hospitalData) {
      fetchReports()
    }
  }, [hospitalData])

  const fetchReports = async () => {
    try {
      setLoading(true)
      
      console.log('=== FETCHING REPORTS DEBUG ===')
      console.log('Hospital data:', hospitalData)
      console.log('Hospital ID:', hospitalData?.id)
      
      // First, let's check all admissions without hospital_id filter to debug
      const { data: allAdmissions, error: allError } = await supabase
        .from('hospital_admissions')
        .select('*')
      
      console.log('All admissions in database:', allAdmissions)
      console.log('All admissions error:', allError)
      
      // Now fetch with hospital_id filter
      const { data: admissions, error: admissionsError } = await supabase
        .from('hospital_admissions')
        .select(`
          *,
          patients (
            id,
            name,
            age,
            gender,
            aadhar_number,
            contact,
            address
          )
        `)
        .eq('hospital_id', hospitalData?.id)
        .is('discharge_date', null) // Only get currently admitted patients

      console.log('Filtered admissions query result:', { admissions, admissionsError })
      console.log('Query filter - hospital_id:', hospitalData?.id)

      if (admissionsError) {
        console.error('Error fetching admissions:', admissionsError)
        setAdmittedPatients([]) // Set empty array instead of mock data
      } else {
        // Transform the data to match our component structure
        const transformedPatients = admissions?.map(admission => ({
          id: admission.id,
          admission_id: admission.id,
          patient_id: admission.patient_id,
          name: admission.patients?.name || 'Unknown Patient',
          age: admission.patients?.age || 'N/A',
          gender: admission.patients?.gender || 'N/A',
          aadhaar_number: admission.patients?.aadhar_number,
          phone: admission.patients?.contact,
          address: admission.patients?.address,
          ward: admission.ward,
          bed_number: admission.bed_number,
          admission_date: admission.admission_date,
          reason_for_admission: admission.reason_for_admission,
          condition_at_admission: admission.condition_at_admission,
          treatment_plan: admission.treatment_plan,
          insurance_provider: admission.insurance_provider,
          insurance_policy_number: admission.insurance_policy_number
        })) || []
        
        console.log('Transformed patients:', transformedPatients)
        console.log('Setting admitted patients count:', transformedPatients.length)
        setAdmittedPatients(transformedPatients)
      }

      // Fetch vaccination records from patients table - filter by hospital_id in vaccination records
      console.log('=== FETCHING VACCINATION RECORDS DEBUG ===')
      console.log('Current hospital ID:', hospitalData?.id)
      
      // Fetch all patients who have vaccination records
      const { data: patientsWithVaccinations, error: vaccinationError } = await supabase
        .from('patients')
        .select('id, name, age, patient_vaccinations')
        .not('patient_vaccinations', 'is', null)

      if (vaccinationError) {
        console.error('Error fetching vaccination records:', vaccinationError)
        setVaccinationRecords([])
      } else {
        // Transform vaccination data and filter by hospital_id
        const allVaccinations = []
        patientsWithVaccinations?.forEach(patient => {
          if (patient.patient_vaccinations && Array.isArray(patient.patient_vaccinations)) {
            patient.patient_vaccinations.forEach(vaccination => {
              console.log('Checking vaccination record:', {
                vaccinationId: vaccination.id,
                vaccinationHospitalId: vaccination.hospital_id,
                currentHospitalId: hospitalData?.id,
                match: vaccination.hospital_id === hospitalData?.id,
                vaccineName: vaccination.vaccine_name,
                patientName: patient.name
              })
              
              // Only include vaccinations administered by this hospital
              // Handle both string and number hospital_id comparisons
              const vaccinationHospitalId = vaccination.hospital_id
              const currentHospitalId = hospitalData?.id
              
              // Skip vaccinations without hospital_id (legacy records) or null values
              if (!vaccinationHospitalId || !currentHospitalId) {
                console.log('Skipping vaccination - missing hospital_id:', {
                  vaccinationHospitalId,
                  currentHospitalId,
                  vaccineName: vaccination.vaccine_name
                })
                return
              }
              
              // Compare as strings to handle type mismatches
              if (String(vaccinationHospitalId) === String(currentHospitalId)) {
                console.log('Including vaccination for hospital:', vaccination.vaccine_name)
                allVaccinations.push({
                  ...vaccination,
                  patient_name: patient.name,
                  patient_age: patient.age,
                  patient_id: patient.id
                })
              } else {
                console.log('Excluding vaccination from different hospital:', {
                  vaccineName: vaccination.vaccine_name,
                  vaccinationHospitalId,
                  currentHospitalId
                })
              }
            })
          }
        })
        
        console.log('Filtered vaccinations for hospital:', allVaccinations)
        console.log('Total vaccination records for this hospital:', allVaccinations.length)
        
        // Sort by vaccination date (most recent first)
        allVaccinations.sort((a, b) => new Date(b.vaccination_date) - new Date(a.vaccination_date))
        setVaccinationRecords(allVaccinations)
      }

      // Fetch child IDs from database - handle missing hospital_id column gracefully
      console.log('=== FETCHING CHILD IDs DEBUG ===')
      console.log('Is Maternity Hospital:', isMaternityHospital)
      console.log('Hospital ID for child filtering:', hospitalData?.id)
      
      // Try multiple approaches to fetch child IDs based on available columns
      const fetchChildIds = async () => {
        const fetchAttempts = [
          // Attempt 1: Filter by hospital_id
          async () => {
            console.log('Trying to fetch with hospital_id filter')
            return await supabase
              .from('child_aadhaar')
              .select('*')
              .eq('hospital_id', hospitalData?.id)
              .order('created_at', { ascending: false })
          },
          // Attempt 2: Filter by hospital_name
          async () => {
            console.log('Trying to fetch with hospital_name filter')
            return await supabase
              .from('child_aadhaar')
              .select('*')
              .eq('hospital_name', hospitalData?.hospital_name)
              .order('created_at', { ascending: false })
          },
          // Attempt 3: Fetch all and filter in JavaScript
          async () => {
            console.log('Fetching all child records (no hospital columns available)')
            const result = await supabase
              .from('child_aadhaar')
              .select('*')
              .order('created_at', { ascending: false })
            
            // Since we can't filter by hospital in the database, 
            // we'll show all records for now
            return result
          }
        ]
        
        for (let i = 0; i < fetchAttempts.length; i++) {
          try {
            const { data, error } = await fetchAttempts[i]()
            if (!error) {
              console.log(`Child fetch method ${i + 1} succeeded, found ${data?.length || 0} records`)
              return data || []
            }
            console.log(`Child fetch method ${i + 1} failed:`, error.message)
          } catch (error) {
            console.log(`Child fetch method ${i + 1} threw error:`, error.message)
          }
        }
        
        // If all attempts failed
        console.error('All child fetch attempts failed')
        return []
      }
      
      try {
        const childData = await fetchChildIds()
        setChildIds(childData)
      } catch (error) {
        console.error('Unexpected error fetching child IDs:', error)
        setChildIds([])
      }
      
    } catch (error) {
      console.error('Error fetching reports:', error)
      showToast(`Failed to fetch reports: ${error.message}`, 'error')
      // Set empty arrays on error
      setAdmittedPatients([])
      setVaccinationRecords([])
      setChildIds([])
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
      // Patient has already been saved to database by AddPatientModal
      // Just refresh the data from database and show success message
      await fetchReports()
      showToast('Patient admitted successfully')
      setShowAddPatientModal(false)
    } catch (error) {
      console.error('Error refreshing patient data:', error)
      showToast(`Failed to refresh patient data: ${error.message}`, 'error')
    }
  }

  const handleAddVaccination = async (vaccinationData) => {
    try {
      // Vaccination has already been saved to database by AddVaccinationModal
      // Just refresh the data from database and show success message
      await fetchReports()
      showToast('Vaccination record added successfully')
      setShowAddVaccinationModal(false)
    } catch (error) {
      console.error('Error refreshing vaccination data:', error)
      showToast(`Failed to refresh vaccination data: ${error.message}`, 'error')
    }
  }

  const handleCreateChildId = async (childData) => {
    try {
      // Child data has already been saved to database by ChildIdModal
      // Just refresh the data from database and show success message
      await fetchReports()
      showToast(`Child ID created successfully! Temporary Aadhaar: ${childData.tempAadhaar}`)
      setShowChildIdModal(false)
    } catch (error) {
      console.error('Error refreshing child data:', error)
      showToast(`Failed to refresh child data: ${error.message}`, 'error')
    }
  }

  const handleUpdatePatient = (updatedPatient) => {
    setAdmittedPatients(prev => 
      prev.map(patient => 
        patient.id === updatedPatient.id ? updatedPatient : patient
      )
    )
    showToast('Patient details updated successfully')
    setShowUpdatePatientModal(false)
    setSelectedPatient(null)
  }

  const openUpdateModal = (patient) => {
    setSelectedPatient(patient)
    setShowUpdatePatientModal(true)
  }

  const openTreatmentModal = (patient) => {
    setSelectedPatient(patient)
    setShowTreatmentModal(true)
  }

  const openHistoryModal = (patient) => {
    setSelectedPatient(patient)
    setShowHistoryModal(true)
  }

  const openPatientDetailsModal = (patient) => {
    setSelectedPatient(patient)
    setShowPatientDetailsModal(true)
  }

  const openPrintModal = (child) => {
    setSelectedChild(child)
    setShowPrintModal(true)
  }


  const handleTreatmentSaved = () => {
    showToast('Treatment saved successfully')
    setShowTreatmentModal(false)
    setSelectedPatient(null)
  }

  const handleDischargePatient = async (patientId) => {
    try {
      const patient = admittedPatients.find(p => p.admission_id === patientId || p.id === patientId)
      if (!patient) {
        showToast('Patient not found', 'error')
        return
      }

      // Update the hospital_admissions table to set discharge_date
      const { error: updateError } = await supabase
        .from('hospital_admissions')
        .update({ 
          discharge_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', patient.admission_id || patient.id)

      if (updateError) {
        console.error('Error updating discharge date:', updateError)
        showToast(`Failed to discharge patient: ${updateError.message}`, 'error')
        return
      }

      // Refresh the data from database
      await fetchReports()
      showToast('Patient discharged successfully')
    } catch (error) {
      console.error('Error discharging patient:', error)
      showToast(`Failed to discharge patient: ${error.message}`, 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Statistics Cards */}
        <div className={`grid grid-cols-1 gap-8 ${isMaternityHospital ? 'lg:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-2'}`}>
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admitted Patients</p>
              <p className="text-3xl font-bold text-primary-600">{admittedPatients.length}</p>
            </div>
            <div className="p-3 bg-primary-100 rounded-full">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vaccinations</p>
              <p className="text-3xl font-bold text-green-600">{vaccinationRecords.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {isMaternityHospital && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Child IDs</p>
                <p className="text-3xl font-bold text-blue-600">{childIds.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h3a1 1 0 011 1v1H4V5a1 1 0 011-1h3zM6 7v10a2 2 0 002 2h8a2 2 0 002-2V7H6z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Main Dashboard Sections */}
        <div className={`grid grid-cols-1 gap-8 ${isMaternityHospital ? 'lg:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-2'}`}>
        
        {/* Section 1: Admit Patient */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <svg className="w-6 h-6 text-primary-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Admit Patient
              </h2>
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Admit</span>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {admittedPatients.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No admitted patients</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {admittedPatients.map((patient) => (
                  <div key={patient.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                        <p className="text-sm text-gray-600">{patient.age} years, {patient.gender}</p>
                        <p className="text-xs text-gray-500">Bed: {typeof patient.bed_number === 'object' ? patient.bed_number?.bed_number || patient.bed_number?.value || 'N/A' : patient.bed_number}</p>
                        <p className="text-xs text-gray-500">
                          Admitted: {new Date(patient.admission_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                        Admitted
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => openUpdateModal(patient)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded transition-colors duration-200"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleDischargePatient(patient.id)}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded transition-colors duration-200"
                      >
                        Discharge
                      </button>
                      <button
                        onClick={() => openTreatmentModal(patient)}
                        className="bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-3 rounded transition-colors duration-200"
                      >
                        Treatment
                      </button>
                      <button
                        onClick={() => openHistoryModal(patient)}
                        className="bg-purple-500 hover:bg-purple-600 text-white text-sm py-2 px-3 rounded transition-colors duration-200"
                      >
                        History
                      </button>
                      <button
                        onClick={() => openPatientDetailsModal(patient)}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm py-2 px-3 rounded transition-colors duration-200 col-span-2"
                      >
                        Patient Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Vaccination */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Vaccination
              </h2>
              <button
                onClick={() => setShowAddVaccinationModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add</span>
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {vaccinationRecords.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-sm text-gray-500">No vaccination records</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {vaccinationRecords.map((record) => (
                  <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{record.patient_name}</h3>
                        <p className="text-sm text-gray-600">{record.patient_age} years</p>
                        <p className="text-sm font-medium text-green-600">{record.vaccine_name}</p>
                        <p className="text-xs text-gray-500">
                          Dose: {record.dose_number === 'booster' ? 'Booster' : `${record.dose_number}${record.dose_number == 1 ? 'st' : record.dose_number == 2 ? 'nd' : record.dose_number == 3 ? 'rd' : 'th'}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Date: {new Date(record.vaccination_date).toLocaleDateString()}
                        </p>
                        {record.administered_by && (
                          <p className="text-xs text-gray-500">
                            By: {record.administered_by}
                          </p>
                        )}
                        {record.notes && (
                          <p className="text-xs text-gray-500 mt-1">
                            Notes: {record.notes}
                          </p>
                        )}
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                        Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

          {/* Section 3: Child ID (Only for Maternity Hospitals) */}
        {isMaternityHospital && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h3a1 1 0 011 1v1H4V5a1 1 0 011-1h3zM6 7v10a2 2 0 002 2h8a2 2 0 002-2V7H6z" />
                  </svg>
                  Child ID
                </h2>
                <button
                  onClick={() => setShowChildIdModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create</span>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {childIds.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h3a1 1 0 011 1v1H4V5a1 1 0 011-1h3zM6 7v10a2 2 0 002 2h8a2 2 0 002-2V7H6z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No child IDs created</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {childIds.map((child) => (
                    <div key={child.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-blue-900 mb-2">{child.child_name}</h3>
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-green-700 mb-1">Temporary Aadhaar Number</p>
                            <p className="text-lg font-bold text-green-800 font-mono tracking-wider">{child.child_aadhaar}</p>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <button
                            onClick={() => openPrintModal(child)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>Print</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Modals */}
      {showAddPatientModal && (
        <AddPatientModal
          isOpen={showAddPatientModal}
          onClose={() => setShowAddPatientModal(false)}
          onAddPatient={handleAddPatient}
          hospitalData={hospitalData}
        />
      )}

      {showAddVaccinationModal && (
        <AddVaccinationModal
          isOpen={showAddVaccinationModal}
          onClose={() => setShowAddVaccinationModal(false)}
          onAddVaccination={handleAddVaccination}
          hospitalData={hospitalData}
        />
      )}

      {showChildIdModal && isMaternityHospital && (
        <ChildIdModal
          isOpen={showChildIdModal}
          onClose={() => setShowChildIdModal(false)}
          onSubmit={handleCreateChildId}
          hospitalData={hospitalData}
        />
      )}

      {showUpdatePatientModal && (
        <UpdatePatientModal
          isOpen={showUpdatePatientModal}
          onClose={() => {
            setShowUpdatePatientModal(false)
            setSelectedPatient(null)
          }}
          onUpdate={handleUpdatePatient}
          patientData={selectedPatient}
        />
      )}

      {showTreatmentModal && (
        <HospitalTreatmentModal
          isOpen={showTreatmentModal}
          onClose={() => {
            setShowTreatmentModal(false)
            setSelectedPatient(null)
          }}
          patientData={selectedPatient}
          onTreatmentSaved={handleTreatmentSaved}
        />
      )}

      {showHistoryModal && (
        <HospitalHistoryModal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false)
            setSelectedPatient(null)
          }}
          patientData={selectedPatient}
        />
      )}

      {showPatientDetailsModal && (
        <PatientDetailsModal
          isOpen={showPatientDetailsModal}
          onClose={() => {
            setShowPatientDetailsModal(false)
            setSelectedPatient(null)
          }}
          patientData={selectedPatient}
        />
      )}

      {showPrintModal && (
        <ChildIdPrintModal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false)
            setSelectedChild(null)
          }}
          childData={selectedChild}
          hospitalData={hospitalData}
        />
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
          toast.type === 'error' 
            ? 'bg-red-500 text-white' 
            : 'bg-green-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default HospitalReports
