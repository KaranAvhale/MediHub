import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import BackToRoles from '../components/BackToRoles'

const DoctorProfileForm = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    dob: '',
    age: '',
    contact: '',
    email: '',
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
    registrationNumber: '',
    specialization: '',
    qualifications: [{ degree: '', college: '', year: '' }],
    yearsOfExperience: '',
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
    { code: '+34', country: 'Spain' },
    { code: '+31', country: 'Netherlands' },
    { code: '+46', country: 'Sweden' },
    { code: '+47', country: 'Norway' },
    { code: '+45', country: 'Denmark' },
    { code: '+358', country: 'Finland' },
    { code: '+41', country: 'Switzerland' },
    { code: '+43', country: 'Austria' },
    { code: '+32', country: 'Belgium' },
    { code: '+351', country: 'Portugal' },
    { code: '+30', country: 'Greece' },
    { code: '+48', country: 'Poland' },
    { code: '+420', country: 'Czech Republic' },
    { code: '+36', country: 'Hungary' },
    { code: '+40', country: 'Romania' },
    { code: '+421', country: 'Slovakia' },
    { code: '+386', country: 'Slovenia' },
    { code: '+385', country: 'Croatia' },
    { code: '+387', country: 'Bosnia' },
    { code: '+389', country: 'Macedonia' },
    { code: '+381', country: 'Serbia' },
    { code: '+382', country: 'Montenegro' },
    { code: '+355', country: 'Albania' },
    { code: '+371', country: 'Latvia' },
    { code: '+372', country: 'Estonia' },
    { code: '+370', country: 'Lithuania' },
    { code: '+375', country: 'Belarus' },
    { code: '+380', country: 'Ukraine' },
    { code: '+7', country: 'Russia' },
    { code: '+90', country: 'Turkey' },
    { code: '+972', country: 'Israel' },
    { code: '+971', country: 'UAE' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+974', country: 'Qatar' },
    { code: '+973', country: 'Bahrain' },
    { code: '+965', country: 'Kuwait' },
    { code: '+968', country: 'Oman' },
    { code: '+962', country: 'Jordan' },
    { code: '+961', country: 'Lebanon' },
    { code: '+963', country: 'Syria' },
    { code: '+964', country: 'Iraq' },
    { code: '+98', country: 'Iran' },
    { code: '+93', country: 'Afghanistan' },
    { code: '+92', country: 'Pakistan' },
    { code: '+880', country: 'Bangladesh' },
    { code: '+94', country: 'Sri Lanka' },
    { code: '+977', country: 'Nepal' },
    { code: '+975', country: 'Bhutan' },
    { code: '+95', country: 'Myanmar' },
    { code: '+66', country: 'Thailand' },
    { code: '+84', country: 'Vietnam' },
    { code: '+855', country: 'Cambodia' },
    { code: '+856', country: 'Laos' },
    { code: '+60', country: 'Malaysia' },
    { code: '+65', country: 'Singapore' },
    { code: '+62', country: 'Indonesia' },
    { code: '+63', country: 'Philippines' },
    { code: '+82', country: 'South Korea' },
    { code: '+52', country: 'Mexico' },
    { code: '+55', country: 'Brazil' },
    { code: '+54', country: 'Argentina' },
    { code: '+56', country: 'Chile' },
    { code: '+57', country: 'Colombia' },
    { code: '+58', country: 'Venezuela' },
    { code: '+51', country: 'Peru' },
    { code: '+593', country: 'Ecuador' },
    { code: '+595', country: 'Paraguay' },
    { code: '+598', country: 'Uruguay' },
    { code: '+591', country: 'Bolivia' },
    { code: '+27', country: 'South Africa' },
    { code: '+234', country: 'Nigeria' },
    { code: '+254', country: 'Kenya' },
    { code: '+256', country: 'Uganda' },
    { code: '+255', country: 'Tanzania' },
    { code: '+233', country: 'Ghana' },
    { code: '+221', country: 'Senegal' },
    { code: '+212', country: 'Morocco' },
    { code: '+20', country: 'Egypt' },
    { code: '+216', country: 'Tunisia' },
    { code: '+213', country: 'Algeria' },
    { code: '+218', country: 'Libya' },
    { code: '+249', country: 'Sudan' },
    { code: '+251', country: 'Ethiopia' },
    { code: '+252', country: 'Somalia' },
    { code: '+253', country: 'Djibouti' },
    { code: '+967', country: 'Yemen' }
  ]

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.primaryEmailAddress?.emailAddress || ''
      }))
    }
  }, [user])

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

  const calculateAge = (dob) => {
    if (!dob) return ''
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age.toString()
  }

  const handleDobChange = (dob) => {
    const calculatedAge = calculateAge(dob)
    setError('') // Clear any previous age errors
    setFormData(prev => ({
      ...prev,
      dob,
      age: calculatedAge
    }))
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required')
      return false
    }
    if (!formData.gender) {
      setError('Gender is required')
      return false
    }
    if (!formData.dob) {
      setError('Date of birth is required')
      return false
    }
    if (!formData.contact.trim()) {
      setError('Contact number is required')
      return false
    }
    if (!formData.address.city.trim()) {
      setError('City is required')
      return false
    }
    if (!formData.address.district.trim()) {
      setError('District is required')
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
    if (!formData.registrationNumber.trim()) {
      setError('Medical registration number is required')
      return false
    }
    if (formData.qualifications.length === 0 || !formData.qualifications[0].degree.trim()) {
      setError('At least one qualification is required')
      return false
    }
    if (!formData.yearsOfExperience) {
      setError('Years of experience is required')
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

             const doctorData = {
         clerk_user_id: user.id,
         full_name: formData.fullName,
         gender: formData.gender,
         dob: formData.dob,
         age: parseInt(formData.age),
         contact: `${selectedCountryCode}${formData.contact}`,
         email: formData.email,
         address: addressString,
         registration_number: formData.registrationNumber,
         specialization: formData.specialization,
         qualifications: formData.qualifications,
         years_of_experience: parseInt(formData.yearsOfExperience),
         hospitals: formData.hospitals
       }

      const { error } = await supabase
        .from('doctors')
        .upsert([doctorData], { onConflict: 'clerk_user_id' })

      if (error) throw error

      setSuccess('Profile saved successfully!')
      setTimeout(() => {
        navigate('/dashboard/doctor')
      }, 2000)

    } catch (error) {
      console.error('Error saving profile:', error)
      setError('Failed to save profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign up to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-primary-600">MediHub</h1>
            <BackToRoles />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Form Header */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-8">
              <h2 className="text-3xl font-bold text-white mb-2">Complete Your Doctor Profile</h2>
              <p className="text-primary-100">Please provide your professional information to complete your registration.</p>
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Welcome!</strong> Please complete your profile to access your dashboard. All fields marked with * are required.
                </p>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
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

              {/* Basic Information Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  👤 Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                                     <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Date of Birth *
                     </label>
                     <input
                       type="date"
                       value={formData.dob}
                       onChange={(e) => handleDobChange(e.target.value)}
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                       required
                     />
                   </div>

                                     <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Age
                     </label>
                     <input
                       type="number"
                       value={formData.age}
                       readOnly
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                       placeholder="Auto-calculated"
                     />
                   </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number *
                    </label>
                    <div className="flex">
                      <select
                        value={selectedCountryCode}
                        onChange={(e) => setSelectedCountryCode(e.target.value)}
                        className="px-3 py-3 border border-r-0 border-gray-300 rounded-l-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-gray-50"
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
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Enter phone number"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      placeholder="Email from Clerk account"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email is locked and cannot be changed</p>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  🏠 Address Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      House/Building Number
                    </label>
                    <input
                      type="text"
                      value={formData.address.houseNumber}
                      onChange={(e) => handleAddressChange('houseNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter city name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District *
                    </label>
                    <input
                      type="text"
                      value={formData.address.district}
                      onChange={(e) => handleAddressChange('district', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter district name"
                      required
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter pincode"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  🎓 Professional Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medical Registration Number *
                    </label>
                    <input
                      type="text"
                      value={formData.registrationNumber}
                      onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="e.g., MCI-12345"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="e.g., Cardiologist"
                    />
                  </div>

                                     <div>
                     <label className="block text-sm font-medium text-gray-700 mb-2">
                       Years of Experience *
                     </label>
                     <input
                       type="number"
                       value={formData.yearsOfExperience}
                       onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                       className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                       placeholder="Enter years of experience"
                       min="0"
                       max="50"
                       required
                     />
                   </div>
                </div>

                {/* Qualifications Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                      Qualifications *
                    </label>
                    <button
                      type="button"
                      onClick={addQualification}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    >
                      + Add Qualification
                    </button>
                  </div>

                  {formData.qualifications.map((qual, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gray-700">Qualification {index + 1}</h4>
                        {formData.qualifications.length > 1 && (
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
                            Degree/Certificate *
                          </label>
                          <input
                            type="text"
                            value={qual.degree}
                            onChange={(e) => updateQualification(index, 'degree', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            placeholder="e.g., MBBS, MD"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            College/University *
                          </label>
                          <input
                            type="text"
                            value={qual.college}
                            onChange={(e) => updateQualification(index, 'college', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Institution name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Year of Graduation *
                          </label>
                          <input
                            type="number"
                            value={qual.year}
                            onChange={(e) => updateQualification(index, 'year', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                            placeholder="e.g., 2020"
                            min="1950"
                            max={new Date().getFullYear()}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Workplace Information Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  🏥 Workplace Information
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-medium text-gray-700">
                      Hospitals/Clinics
                    </label>
                    <button
                      type="button"
                      onClick={addHospital}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                    >
                      + Add Hospital
                    </button>
                  </div>

                  {formData.hospitals.map((hospital, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-gray-700">Hospital {index + 1}</h4>
                        {formData.hospitals.length > 1 && (
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DoctorProfileForm



