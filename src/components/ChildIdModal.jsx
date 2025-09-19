import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const ChildIdModal = ({ isOpen, onClose, onSubmit, hospitalData }) => {
  const [formData, setFormData] = useState({
    child_name: '',
    date_of_birth: '',
    birth_time: '',
    gender: '',
    blood_group: '',
    mother_name: '',
    mother_aadhaar: '',
    father_name: '',
    father_aadhaar: '',
    parent_mobile_num: ''
  })
  const [age, setAge] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Generate 12-digit temporary Aadhaar number
  const generateTempAadhaar = () => {
    let aadhaar = ''
    for (let i = 0; i < 12; i++) {
      aadhaar += Math.floor(Math.random() * 10)
    }
    return aadhaar
  }

  // Calculate age based on date of birth
  const calculateAge = (birthDate) => {
    if (!birthDate) return ''
    
    const today = new Date()
    const birth = new Date(birthDate)
    const diffTime = Math.abs(today - birth)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) {
      return `${diffDays} days`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} months`
    } else {
      const years = Math.floor(diffDays / 365)
      const remainingMonths = Math.floor((diffDays % 365) / 30)
      return remainingMonths > 0 ? `${years} years ${remainingMonths} months` : `${years} years`
    }
  }

  // Update age when date of birth changes
  useEffect(() => {
    if (formData.date_of_birth) {
      setAge(calculateAge(formData.date_of_birth))
    } else {
      setAge('')
    }
  }, [formData.date_of_birth])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateAadhaar = (aadhaar) => {
    return /^\d{12}$/.test(aadhaar)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (!formData.child_name.trim()) {
      setError('Child name is required')
      setLoading(false)
      return
    }
    if (!formData.date_of_birth) {
      setError('Date of birth is required')
      setLoading(false)
      return
    }
    if (!formData.birth_time) {
      setError('Birth time is required')
      setLoading(false)
      return
    }
    if (!formData.gender) {
      setError('Gender is required')
      setLoading(false)
      return
    }
    if (!formData.mother_name.trim()) {
      setError('Mother name is required')
      setLoading(false)
      return
    }
    if (!formData.mother_aadhaar.trim()) {
      setError('Mother Aadhaar number is required')
      setLoading(false)
      return
    }
    if (!validateAadhaar(formData.mother_aadhaar)) {
      setError('Mother Aadhaar number must be 12 digits')
      setLoading(false)
      return
    }
    if (!formData.father_name.trim()) {
      setError('Father name is required')
      setLoading(false)
      return
    }
    if (!formData.father_aadhaar.trim()) {
      setError('Father Aadhaar number is required')
      setLoading(false)
      return
    }
    if (!validateAadhaar(formData.father_aadhaar)) {
      setError('Father Aadhaar number must be 12 digits')
      setLoading(false)
      return
    }
    if (!formData.parent_mobile_num.trim()) {
      setError('Parent mobile number is required')
      setLoading(false)
      return
    }
    if (!/^\d{10}$/.test(formData.parent_mobile_num.trim())) {
      setError('Parent mobile number must be 10 digits')
      setLoading(false)
      return
    }

    try {
      // Generate temporary Aadhaar number
      const tempAadhaar = generateTempAadhaar()
      
      // Prepare data for database
      const childData = {
        child_name: formData.child_name.trim(),
        date_of_birth: formData.date_of_birth,
        birth_time: formData.birth_time,
        gender: formData.gender,
        age: calculateAge(formData.date_of_birth),
        blood_group: formData.blood_group,
        mother_name: formData.mother_name.trim(),
        mother_aadhaar: formData.mother_aadhaar.trim(),
        father_name: formData.father_name.trim(),
        father_aadhaar: formData.father_aadhaar.trim(),
        parent_mobile_num: formData.parent_mobile_num.trim(),
        child_aadhaar: tempAadhaar,
        hospital_id: hospitalData?.id || null,
        hospital_name: hospitalData?.hospital_name || null,
        created_at: new Date().toISOString()
      }

      // Insert into Supabase
      const { data, error: insertError } = await supabase
        .from('child_aadhaar')
        .insert([childData])
        .select()

      if (insertError) {
        console.error('Error inserting child data:', insertError)
        setError(`Failed to create child ID: ${insertError.message}`)
        setLoading(false)
        return
      }

      // Automatically create patient record
      const patientData = {
        name: childData.child_name,
        dob: childData.date_of_birth,
        gender: childData.gender,
        age: childData.age, // Keep age as string to match database schema
        blood_group: childData.blood_group || null,
        aadhar_number: childData.child_aadhaar,
        contact: childData.parent_mobile_num,
        aadhar_otp: '123456',
        address: null, // Use null instead of empty string
        medical_history: null, // Use null for JSON fields
        ongoing_treatments: null, // Use null for JSON fields  
        past_treatments: null, // Use null for JSON fields
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Always create patient record - don't check for duplicates since each child gets unique temp Aadhaar
      const { data: patientResult, error: patientError } = await supabase
        .from('patients')
        .insert([patientData])
        .select()

      if (patientError) {
        console.error('Error creating patient record:', patientError)
        console.error('Patient data that failed:', patientData)
        setError(`Child ID created but failed to register as patient: ${patientError.message}`)
        // Continue with child ID creation success
      } else {
        console.log('Patient record created successfully:', patientResult)
        console.log('Child name:', childData.child_name, 'Patient ID:', patientResult[0]?.id)
      }

      // Success - call parent callback and reset form
      onSubmit({
        ...childData,
        id: data[0].id,
        tempAadhaar: tempAadhaar
      })
      
      setFormData({
        child_name: '',
        date_of_birth: '',
        birth_time: '',
        gender: '',
        blood_group: '',
        mother_name: '',
        mother_aadhaar: '',
        father_name: '',
        father_aadhaar: '',
        parent_mobile_num: ''
      })
      setAge('')
      
    } catch (error) {
      console.error('Error creating child ID:', error)
      setError(`Failed to create child ID: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Create Child ID</h2>
              <p className="text-blue-100 mt-1">Generate temporary Aadhaar for newborn</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
              disabled={loading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Scrollable content */}
        <div className="max-h-[calc(95vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 shadow-sm">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Child Information Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <div className="bg-blue-500 rounded-full p-2 mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                Child Information
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Child Name *
                  </label>
                  <input
                    type="text"
                    name="child_name"
                    value={formData.child_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter child name"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birth Time *
                  </label>
                  <input
                    type="time"
                    name="birth_time"
                    value={formData.birth_time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age (Auto-calculated)
                  </label>
                  <input
                    type="text"
                    value={age}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                    placeholder="Age will be calculated automatically"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                    disabled={loading}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Group
                  </label>
                  <select
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loading}
                  >
                    <option value="">Select Blood Group (Optional)</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mother Information */}
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <div className="bg-pink-500 rounded-full p-2 mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                Mother Information
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mother's Name *
                  </label>
                  <input
                    type="text"
                    name="mother_name"
                    value={formData.mother_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter mother's name"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mother's Aadhaar Number *
                  </label>
                  <input
                    type="text"
                    name="mother_aadhaar"
                    value={formData.mother_aadhaar}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono"
                    placeholder="Enter 12-digit Aadhaar number"
                    maxLength="12"
                    pattern="\d{12}"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Father Information */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <div className="bg-green-500 rounded-full p-2 mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                Father Information
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Father's Name *
                  </label>
                  <input
                    type="text"
                    name="father_name"
                    value={formData.father_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter father's name"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Father's Aadhaar Number *
                  </label>
                  <input
                    type="text"
                    name="father_aadhaar"
                    value={formData.father_aadhaar}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono"
                    placeholder="Enter 12-digit Aadhaar number"
                    maxLength="12"
                    pattern="\d{12}"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <div className="bg-purple-500 rounded-full p-2 mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Mobile Number *
                  </label>
                  <input
                    type="tel"
                    name="parent_mobile_num"
                    value={formData.parent_mobile_num}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono"
                    placeholder="Enter 10-digit mobile number"
                    maxLength="10"
                    pattern="\d{10}"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Child ID...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Child ID
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChildIdModal
