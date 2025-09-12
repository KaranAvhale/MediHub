import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabaseClient'

const PrescriptionPrint = ({ patient, treatment, onClose }) => {
  const { user } = useUser()
  const [doctorInfo, setDoctorInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDoctorInfo()
  }, [user])

  const fetchDoctorInfo = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('clerk_user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching doctor info:', error)
      } else {
        setDoctorInfo(data)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Get the latest prescriptions from treatment updates
  const getLatestPrescriptions = () => {
    if (!treatment) return []
    
    // If treatment has prescriptions directly
    if (treatment.prescriptions && Array.isArray(treatment.prescriptions)) {
      return treatment.prescriptions
    }
    
    // If treatment has updates with prescriptions
    if (treatment.updates && Array.isArray(treatment.updates)) {
      const latestUpdate = treatment.updates[treatment.updates.length - 1]
      return latestUpdate?.prescriptions || []
    }
    
    return []
  }

  const latestPrescriptions = getLatestPrescriptions()

  const formatFrequency = (frequency) => {
    if (!frequency) return 'As directed'
    
    // Handle array format
    if (Array.isArray(frequency)) {
      return frequency.join(', ')
    }
    
    // Handle object format
    if (typeof frequency === 'object') {
      return Object.values(frequency).join(', ')
    }
    
    const frequencyMap = {
      'once_daily': 'Once Daily',
      'twice_daily': 'Twice Daily', 
      'thrice_daily': 'Thrice Daily',
      'four_times_daily': 'Four Times Daily',
      'as_needed': 'As Needed',
      'weekly': 'Weekly',
      'monthly': 'Monthly'
    }
    return frequencyMap[frequency] || frequency || 'As directed'
  }

  const renderFrequencyCheckboxes = (frequency) => {
    const times = ['Morning', 'Afternoon', 'Evening', 'Night']
    let selectedTimes = []
    
    if (Array.isArray(frequency)) {
      selectedTimes = frequency
    } else if (typeof frequency === 'string') {
      if (frequency.includes('once')) selectedTimes = ['Morning']
      else if (frequency.includes('twice')) selectedTimes = ['Morning', 'Evening']
      else if (frequency.includes('thrice')) selectedTimes = ['Morning', 'Afternoon', 'Evening']
      else if (frequency.includes('four')) selectedTimes = ['Morning', 'Afternoon', 'Evening', 'Night']
    }
    
    return (
      <div className="flex flex-wrap gap-2">
        {times.map(time => (
          <div key={time} className="flex items-center">
            <span className="text-xs text-black mr-1">
              {selectedTimes.includes(time.toLowerCase()) || 
               selectedTimes.includes(time) ? '☑' : '☐'}
            </span>
            <span className="text-xs text-black">{time}</span>
          </div>
        ))}
      </div>
    )
  }

  const getHospitalString = (hospitals) => {
    if (!hospitals) return '[Hospital Name]'
    if (typeof hospitals === 'string') return hospitals
    if (Array.isArray(hospitals)) return hospitals.join(', ')
    if (typeof hospitals === 'object') return Object.values(hospitals).join(', ')
    return '[Hospital Name]'
  }

  const formatDoctorQualifications = (qualifications) => {
    if (!qualifications) return '[Qualifications]'
    
    try {
      // Handle string that might be JSON
      if (typeof qualifications === 'string') {
        try {
          const parsed = JSON.parse(qualifications)
          return formatDoctorQualifications(parsed)
        } catch {
          return qualifications
        }
      }
      
      // Handle array
      if (Array.isArray(qualifications)) {
        return qualifications.map(qual => {
          if (typeof qual === 'object' && qual !== null) {
            if (qual.degree) {
              const college = qual.college && qual.college !== 'a' ? qual.college : ''
              const year = qual.year && qual.year !== '2024' ? qual.year : ''
              return `${qual.degree}${college ? ` (${college}${year ? `, ${year}` : ''})` : ''}`
            }
            return Object.values(qual).filter(v => v && v !== 'a' && v !== '2024').join(' ')
          }
          return qual
        }).filter(q => q && q.trim()).join(', ')
      }
      
      // Handle object
      if (typeof qualifications === 'object' && qualifications !== null) {
        if (qualifications.degree) {
          const college = qualifications.college && qualifications.college !== 'a' ? qualifications.college : ''
          const year = qualifications.year && qualifications.year !== '2024' ? qualifications.year : ''
          return `${qualifications.degree}${college ? ` (${college}${year ? `, ${year}` : ''})` : ''}`
        }
        const values = Object.values(qualifications).filter(v => v && v !== 'a' && v !== '2024')
        return values.length > 0 ? values.join(' ') : '[Qualifications]'
      }
      
      return '[Qualifications]'
    } catch (error) {
      console.error('Error formatting qualifications:', error)
      return '[Qualifications]'
    }
  }

  const formatHospitalDetails = (hospitals) => {
    if (!hospitals) return '[Hospital Name]'
    
    try {
      // Handle string that might be JSON
      if (typeof hospitals === 'string') {
        try {
          const parsed = JSON.parse(hospitals)
          return formatHospitalDetails(parsed)
        } catch {
          return hospitals
        }
      }
      
      // Handle array
      if (Array.isArray(hospitals)) {
        return hospitals.map(hospital => {
          if (typeof hospital === 'object' && hospital !== null) {
            if (hospital.name) {
              return `${hospital.name}${hospital.department ? ` (${hospital.department})` : ''}`
            }
            const values = Object.values(hospital).filter(v => v && v.trim && v.trim() !== '')
            return values.join(' ')
          }
          return hospital
        }).filter(h => h && h.trim()).join(', ')
      }
      
      // Handle object
      if (typeof hospitals === 'object' && hospitals !== null) {
        if (hospitals.name) {
          return `${hospitals.name}${hospitals.department ? ` (${hospitals.department})` : ''}`
        }
        const values = Object.values(hospitals).filter(v => v && v.trim && v.trim() !== '')
        return values.length > 0 ? values.join(' ') : '[Hospital Name]'
      }
      
      return '[Hospital Name]'
    } catch (error) {
      console.error('Error formatting hospitals:', error)
      return '[Hospital Name]'
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-center">Loading prescription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Print Buttons */}
        <div className="print-buttons p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Prescription Preview</h2>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Print
            </button>
            <button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Traditional Prescription Content */}
        <div className="prescription-print bg-white p-8">
          {/* Doctor Header - Traditional Style */}
          <div className="text-center border-b-2 border-black pb-4 mb-6">
            <h1 className="text-2xl font-bold text-black mb-2">
              Dr. {doctorInfo?.full_name || '[Doctor Name]'}
            </h1>
            <p className="text-base text-black">{doctorInfo?.specialization || '[Specialization]'}</p>
            <p className="text-sm text-black">{formatDoctorQualifications(doctorInfo?.qualifications)}</p>
            <p className="text-sm text-black">Reg. No: {doctorInfo?.registration_number || '[Registration No.]'}</p>
            <p className="text-sm text-black mt-2">{formatHospitalDetails(doctorInfo?.hospitals)}</p>
            <p className="text-sm text-black">Contact: {doctorInfo?.contact || '[Contact Number]'}</p>
          </div>

          {/* Date */}
          <div className="text-right mb-4">
            <p className="text-sm text-black">Date: {new Date().toLocaleDateString('en-IN')}</p>
          </div>

          {/* Patient Information - Simple */}
          <div className="mb-6">
            <p className="text-base text-black mb-1"><strong>Patient Name:</strong> {patient?.name || 'N/A'}</p>
            <p className="text-base text-black mb-1"><strong>Age:</strong> {patient?.age || 'N/A'} years</p>
            <p className="text-base text-black mb-1"><strong>Gender:</strong> {patient?.gender || 'N/A'}</p>
          </div>

          {/* Treatment/Diagnosis */}
          {(treatment?.treatmentName || treatment?.name) && (
            <div className="mb-6">
              <p className="text-base text-black"><strong>Diagnosis/Treatment:</strong> {treatment?.treatmentName || treatment?.name}</p>
              {treatment?.description && (
                <p className="text-sm text-black mt-1">{treatment.description}</p>
              )}
            </div>
          )}

          {/* Rx Symbol and Prescription */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <span className="text-3xl font-bold text-black mr-2">℞</span>
            </div>

            {latestPrescriptions.length > 0 ? (
              <div className="space-y-3">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 border-b-2 border-black pb-2 mb-3">
                  <div className="col-span-1 text-sm font-bold text-black">S.No</div>
                  <div className="col-span-4 text-sm font-bold text-black">Medicine Name</div>
                  <div className="col-span-2 text-sm font-bold text-black">Dosage</div>
                  <div className="col-span-2 text-sm font-bold text-black">Quantity</div>
                  <div className="col-span-3 text-sm font-bold text-black">Frequency</div>
                </div>
                
                {/* Medicine Rows */}
                {latestPrescriptions.map((prescription, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 py-2 border-b border-gray-300">
                    <div className="col-span-1 text-sm text-black font-medium">
                      {index + 1}.
                    </div>
                    <div className="col-span-4 text-sm text-black font-medium">
                      {prescription.medicineName || 'Medicine Name'}
                    </div>
                    <div className="col-span-2 text-sm text-black">
                      {prescription.dose || 'As directed'}
                    </div>
                    <div className="col-span-2 text-sm text-black">
                      {prescription.quantity || 'As needed'}
                    </div>
                    <div className="col-span-3 text-sm text-black">
                      {renderFrequencyCheckboxes(prescription.frequency)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-black">No medicines prescribed</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          {treatment?.notes && (
            <div className="mb-6">
              <p className="text-base font-semibold text-black mb-2">Instructions:</p>
              <p className="text-sm text-black">{treatment.notes}</p>
            </div>
          )}

          {/* Follow-up */}
          {treatment?.followUpDate && (
            <div className="mb-6">
              <p className="text-base font-semibold text-black">
                Next Visit: {new Date(treatment.followUpDate).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}

          {/* Doctor Signature */}
          <div className="mt-12 pt-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-black">Prescription ID: RX-{Date.now().toString().slice(-8)}</p>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-black pt-2" style={{ minWidth: '200px' }}>
                  <p className="text-base font-bold text-black">Dr. {doctorInfo?.full_name || '[Doctor Name]'}</p>
                  <p className="text-xs text-black">{doctorInfo?.specialization || '[Specialization]'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body * {
            visibility: hidden;
          }
          
          .prescription-print, .prescription-print * {
            visibility: visible;
          }
          
          .prescription-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 20mm;
            box-sizing: border-box;
            background: white !important;
            color: black !important;
          }
          
          .print-buttons {
            display: none !important;
          }
          
          .fixed {
            position: static !important;
          }
          
          .bg-black {
            background: transparent !important;
          }
        }
        
        @page {
          size: A4;
          margin: 0;
        }
      `}</style>
    </div>
  )
}

export default PrescriptionPrint
