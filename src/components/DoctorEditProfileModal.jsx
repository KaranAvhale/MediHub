import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const DoctorEditProfileModal = ({ isOpen, onClose, doctorData, onUpdate }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    contact: '',
    address: {
      houseNumber: '',
      streetName: '',
      locality: '',
      city: '',
      district: '',
      state: '',
      country: '',
      pincode: ''
    },
    specialization: '',
    qualifications: [{ degree: '', college: '', year: '' }],
    hospitals: [{ name: '', department: '', joiningDate: '' }]
  })

  const [selectedCountryCode, setSelectedCountryCode] = useState('+91')

  // Country codes for phone numbers
  const countryCodes = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+61', country: 'Australia' },
    { code: '+86', country: 'China' },
    { code: '+81', country: 'Japan' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+39', country: 'Italy' },
    { code: '+34', country: 'Spain' }
  ]

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && doctorData) {
      console.log('DoctorEditProfileModal - Raw doctorData:', doctorData)
      
      // Parse existing contact to extract country code and number
      let contactNumber = doctorData.contact || ''
      let countryCode = '+91'
      
      if (contactNumber) {
        const matchedCode = countryCodes.find(cc => contactNumber.startsWith(cc.code))
        if (matchedCode) {
          countryCode = matchedCode.code
          contactNumber = contactNumber.substring(matchedCode.code.length)
        }
      }

      // Parse address string back to object
      const addressParts = (doctorData.address || '').split(', ')
      const addressObj = {
        houseNumber: addressParts[0] || '',
        streetName: addressParts[1] || '',
        locality: addressParts[2] || '',
        city: addressParts[3] || '',
        district: addressParts[4] || '',
        state: addressParts[5] || '',
        country: addressParts[6] || '',
        pincode: addressParts[7] || ''
      }

      // Parse qualifications - handle both array and string cases
      let qualifications = [{ degree: '', college: '', year: '' }]
      if (doctorData.qualifications) {
        console.log('Raw qualifications:', doctorData.qualifications, 'Type:', typeof doctorData.qualifications)
        
        if (Array.isArray(doctorData.qualifications)) {
          qualifications = doctorData.qualifications.length > 0 ? doctorData.qualifications : [{ degree: '', college: '', year: '' }]
        } else if (typeof doctorData.qualifications === 'string') {
          try {
            const parsed = JSON.parse(doctorData.qualifications)
            if (Array.isArray(parsed) && parsed.length > 0) {
              qualifications = parsed
            }
          } catch (e) {
            console.error('Error parsing qualifications JSON:', e)
          }
        } else if (typeof doctorData.qualifications === 'object') {
          // Single qualification object
          qualifications = [doctorData.qualifications]
        }
      }

      // Parse hospitals - handle both array and string cases
      let hospitals = [{ name: '', department: '', joiningDate: '' }]
      if (doctorData.hospitals) {
        console.log('Raw hospitals:', doctorData.hospitals, 'Type:', typeof doctorData.hospitals)
        
        if (Array.isArray(doctorData.hospitals)) {
          hospitals = doctorData.hospitals.length > 0 ? doctorData.hospitals : [{ name: '', department: '', joiningDate: '' }]
        } else if (typeof doctorData.hospitals === 'string') {
          try {
            const parsed = JSON.parse(doctorData.hospitals)
            if (Array.isArray(parsed) && parsed.length > 0) {
              hospitals = parsed
            }
          } catch (e) {
            console.error('Error parsing hospitals JSON:', e)
          }
        } else if (typeof doctorData.hospitals === 'object') {
          // Single hospital object
          hospitals = [doctorData.hospitals]
        }
      }

      console.log('Parsed qualifications:', qualifications)
      console.log('Parsed hospitals:', hospitals)

      setSelectedCountryCode(countryCode)
      setFormData({
        contact: contactNumber,
        address: addressObj,
        specialization: doctorData.specialization || '',
        qualifications: qualifications,
        hospitals: hospitals
      })
      setError('')
      setSuccess('')
    }
  }, [isOpen, doctorData])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }))
  }

  const addQualification = () => {
    setFormData(prev => ({
      ...prev,
      qualifications: [...prev.qualifications, { degree: '', college: '', year: '' }]
    }))
  }

  const removeQualification = (index) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }))
  }

  const updateQualification = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.map((qual, i) => 
        i === index ? { ...qual, [field]: value } : qual
      )
    }))
  }

  const addHospital = () => {
    setFormData(prev => ({
      ...prev,
      hospitals: [...prev.hospitals, { name: '', department: '', joiningDate: '' }]
    }))
  }

  const removeHospital = (index) => {
    setFormData(prev => ({
      ...prev,
      hospitals: prev.hospitals.filter((_, i) => i !== index)
    }))
  }

  const updateHospital = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      hospitals: prev.hospitals.map((hospital, i) => 
        i === index ? { ...hospital, [field]: value } : hospital
      )
    }))
  }

  const validateForm = () => {
    if (!formData.contact.trim()) {
      setError('Contact number is required')
      return false
    }
    if (!formData.address.city.trim()) {
      setError('City is required')
      return false
    }
    if (!formData.address.state.trim()) {
      setError('State is required')
      return false
    }
    if (!formData.address.country.trim()) {
      setError('Country is required')
      return false
    }
    if (!formData.address.pincode.trim()) {
      setError('Pincode is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setLoading(true)

    try {
      // Combine address fields into a single string
      const addressString = [
        formData.address.houseNumber,
        formData.address.streetName,
        formData.address.locality,
        formData.address.city,
        formData.address.district,
        formData.address.state,
        formData.address.country,
        formData.address.pincode
      ].filter(Boolean).join(', ')

      const updateData = {
        contact: `${selectedCountryCode}${formData.contact}`,
        address: addressString,
        specialization: formData.specialization,
        qualifications: (formData.qualifications || []).filter(q => q.degree && q.degree.trim()),
        hospitals: (formData.hospitals || []).filter(h => h.name && h.name.trim())
      }

      const { error } = await supabase
        .from('doctors')
        .update(updateData)
        .eq('clerk_user_id', doctorData.clerk_user_id)

      if (error) throw error

      setSuccess('Profile updated successfully!')
      
      // Call onUpdate callback to refresh parent component
      if (onUpdate) {
        onUpdate({ ...doctorData, ...updateData })
      }

      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              📞 Contact Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number *
              </label>
              <div className="flex">
                <select
                  value={selectedCountryCode}
                  onChange={(e) => setSelectedCountryCode(e.target.value)}
                  className="px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50"
                >
                  {countryCodes.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.code} {country.country}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={formData.contact}
                  onChange={(e) => handleInputChange('contact', e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              🏠 Address Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  House/Building Number
                </label>
                <input
                  type="text"
                  value={formData.address.houseNumber}
                  onChange={(e) => handleAddressChange('houseNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., 123, A-101"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Name
                </label>
                <input
                  type="text"
                  value={formData.address.streetName}
                  onChange={(e) => handleAddressChange('streetName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., Main Street"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Locality/Area
                </label>
                <input
                  type="text"
                  value={formData.address.locality}
                  onChange={(e) => handleAddressChange('locality', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., Downtown"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter city name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District
                </label>
                <input
                  type="text"
                  value={formData.address.district}
                  onChange={(e) => handleAddressChange('district', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter district name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter state name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter country name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode/ZIP Code *
                </label>
                <input
                  type="text"
                  value={formData.address.pincode}
                  onChange={(e) => handleAddressChange('pincode', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter pincode"
                  required
                />
              </div>
            </div>
          </div>

          {/* Specialization */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              🎓 Professional Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => handleInputChange('specialization', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g., Cardiologist, General Practitioner"
              />
            </div>
          </div>

          {/* Qualifications Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                🎓 Education Qualifications
              </h3>
              <button
                type="button"
                onClick={addQualification}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                + Add Qualification
              </button>
            </div>

            {(formData.qualifications || []).map((qual, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-700">Qualification {index + 1}</h4>
                  {(formData.qualifications || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQualification(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Degree/Certificate
                    </label>
                    <input
                      type="text"
                      value={qual.degree}
                      onChange={(e) => updateQualification(index, 'degree', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g., MBBS, MD"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      College/University
                    </label>
                    <input
                      type="text"
                      value={qual.college}
                      onChange={(e) => updateQualification(index, 'college', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Institution name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Year of Graduation
                    </label>
                    <input
                      type="number"
                      value={qual.year}
                      onChange={(e) => updateQualification(index, 'year', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g., 2020"
                      min="1950"
                      max={new Date().getFullYear()}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Workplace Information Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                🏥 Workplace Information
              </h3>
              <button
                type="button"
                onClick={addHospital}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                + Add Hospital
              </button>
            </div>

            {(formData.hospitals || []).map((hospital, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-700">Hospital {index + 1}</h4>
                  {(formData.hospitals || []).length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHospital(index)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Hospital/Clinic Name
                    </label>
                    <input
                      type="text"
                      value={hospital.name}
                      onChange={(e) => updateHospital(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g., Apollo Hospital"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={hospital.department}
                      onChange={(e) => updateHospital(index, 'department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g., Cardiology"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Joining Date
                    </label>
                    <input
                      type="date"
                      value={hospital.joiningDate}
                      onChange={(e) => updateHospital(index, 'joiningDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DoctorEditProfileModal
