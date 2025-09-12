import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import BackToRoles from '../components/BackToRoles'

const HospitalProfileForm = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [certificateFile, setCertificateFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    hospitalName: '',
    registrationNumber: '',
    yearOfEstablishment: '',
    email: '',
    phone: '',
    address: '',
    workingHours: '',
    hospitalType: '',
    hospitalCategory: [],
    levelOfHealthcare: '',
    certificateUrl: ''
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

  // Hospital types
  const hospitalTypes = [
    'Government Hospital',
    'Private Hospital'
  ]

  // Hospital categories
  const hospitalCategories = [
    'General Hospital',
    'Children\'s Hospital',
    'Women\'s Hospital',
    'Maternity Hospital',
    'Geriatric Hospital',
    'Cardiac Hospital',
    'Oncology Hospital',
    'Orthopedic Hospital',
    'Psychiatric Hospital',
    'Rehabilitation Hospital',
    'Neurology Hospital',
    'Trauma Center',
    'Long-Term Acute Care Hospital',
    'Teaching Hospital'
  ]

  // Level of healthcare
  const healthcareLevels = [
    'Primary',
    'Secondary',
    'Tertiary'
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

  const handleCategorySelection = (category) => {
    setFormData(prev => ({
      ...prev,
      hospitalCategory: prev.hospitalCategory.includes(category)
        ? prev.hospitalCategory.filter(c => c !== category)
        : [...prev.hospitalCategory, category]
    }))
  }

  const handleFileUpload = async (file) => {
    if (!file) return null

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}_${Date.now()}.${fileExt}`
      const filePath = `hospital-certificates/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('hospital-certificate')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('hospital-certificate')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      setError('Failed to upload certificate. Please try again.')
      return null
    } finally {
      setUploading(false)
    }
  }

  const validateForm = () => {
    if (!formData.hospitalName.trim()) {
      setError('Hospital name is required')
      return false
    }
    if (!formData.registrationNumber.trim()) {
      setError('Registration number is required')
      return false
    }
    if (!formData.yearOfEstablishment) {
      setError('Year of establishment is required')
      return false
    }
    const year = parseInt(formData.yearOfEstablishment)
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      setError('Please enter a valid year of establishment')
      return false
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required')
      return false
    }
    if (!formData.address.trim()) {
      setError('Address is required')
      return false
    }
    if (!formData.workingHours.trim()) {
      setError('Working hours are required')
      return false
    }
    if (!formData.hospitalType) {
      setError('Hospital type is required')
      return false
    }
    if (formData.hospitalCategory.length === 0) {
      setError('Please select at least one hospital category')
      return false
    }
    if (!formData.levelOfHealthcare) {
      setError('Level of healthcare is required')
      return false
    }
    if (!certificateFile) {
      setError('Registration certificate is required')
      return false
    }
    if (!user || !user.id) {
      setError('User authentication error. Please sign in again.')
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
      // Upload certificate file
      const certificateUrl = await handleFileUpload(certificateFile)
      if (!certificateUrl) return

      const hospitalData = {
        clerk_user_id: user.id,
        hospital_name: formData.hospitalName,
        registration_number: formData.registrationNumber,
        year_of_establishment: parseInt(formData.yearOfEstablishment),
        email: formData.email,
        phone: `${selectedCountryCode}${formData.phone}`,
        address: formData.address,
        working_hours: formData.workingHours,
        hospital_type: formData.hospitalType,
        hospital_category: formData.hospitalCategory,
        level_of_healthcare: formData.levelOfHealthcare,
        certificate_url: certificateUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Hospital data to insert:', hospitalData)
      console.log('User ID:', user.id)
      console.log('Form data:', formData)

      // Try insert first, then update if exists
      const { data, error } = await supabase
        .from('hospitals')
        .insert([hospitalData])
        .select()

      // If insert fails due to duplicate, try update
      if (error && error.code === '23505') {
        console.log('Record exists, trying update...')
        const updateData = { ...hospitalData }
        delete updateData.created_at // Don't update created_at
        
        const { data: updateResult, error: updateError } = await supabase
          .from('hospitals')
          .update(updateData)
          .eq('clerk_user_id', user.id)
          .select()
        
        if (updateError) {
          console.error('Update error:', updateError)
          throw updateError
        }
        
        console.log('Update successful:', updateResult)
      } else if (error) {
        console.error('Insert error:', error)
        throw error
      } else {
        console.log('Insert successful:', data)
      }


      setSuccess('Hospital profile created successfully!')
      
      // Clear form
      setFormData({
        hospitalName: '',
        registrationNumber: '',
        yearOfEstablishment: '',
        email: user.primaryEmailAddress?.emailAddress || '',
        phone: '',
        address: '',
        workingHours: '',
        hospitalType: '',
        hospitalCategory: [],
        levelOfHealthcare: '',
        certificateUrl: ''
      })
      setCertificateFile(null)

      setTimeout(() => {
        navigate('/dashboard/hospital')
      }, 2000)

    } catch (error) {
      console.error('Error saving hospital profile:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to save profile. Please try again.'
      
      if (error.code === '23505') {
        errorMessage = 'A hospital with this registration number already exists.'
      } else if (error.code === '23502') {
        errorMessage = 'Required field is missing. Please fill all required fields.'
      } else if (error.code === '22001') {
        errorMessage = 'One of the fields is too long. Please check your input.'
      } else if (error.code === '23514') {
        errorMessage = 'Invalid data format. Please check your inputs.'
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`
      }
      
      setError(errorMessage)
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
              <h2 className="text-3xl font-bold text-white mb-2">Complete Your Hospital Profile</h2>
              <p className="text-primary-100">Please provide your hospital information to complete your registration.</p>
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
                  🏥 Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hospital Name *
                    </label>
                    <input
                      type="text"
                      value={formData.hospitalName}
                      onChange={(e) => handleInputChange('hospitalName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter hospital name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Number *
                    </label>
                    <input
                      type="text"
                      value={formData.registrationNumber}
                      onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter registration number"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year of Establishment *
                    </label>
                    <input
                      type="number"
                      value={formData.yearOfEstablishment}
                      onChange={(e) => handleInputChange('yearOfEstablishment', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter year"
                      min="1900"
                      max={new Date().getFullYear()}
                      required
                    />
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
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
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="Enter phone number"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Working Hours *
                    </label>
                    <input
                      type="text"
                      value={formData.workingHours}
                      onChange={(e) => handleInputChange('workingHours', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="e.g., Mon-Sun: 24/7 or Mon-Fri: 9:00 AM - 6:00 PM"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="Enter complete address"
                    required
                  />
                </div>
              </div>

              {/* Hospital Classification Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  🏛️ Hospital Classification
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type of Hospital *
                    </label>
                    <select
                      value={formData.hospitalType}
                      onChange={(e) => handleInputChange('hospitalType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    >
                      <option value="">Select hospital type</option>
                      {hospitalTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Level of Healthcare *
                    </label>
                    <select
                      value={formData.levelOfHealthcare}
                      onChange={(e) => handleInputChange('levelOfHealthcare', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    >
                      <option value="">Select healthcare level</option>
                      {healthcareLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Hospital Categories Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  🏥 Hospital Categories *
                </h3>
                <p className="text-sm text-gray-600">Select all categories that apply to your hospital</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hospitalCategories.map((category) => (
                    <label key={category} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hospitalCategory.includes(category)}
                        onChange={() => handleCategorySelection(category)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Certificate Upload Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  📄 Registration Certificate *
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Registration Certificate
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setCertificateFile(e.target.files[0])}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
                  {certificateFile && (
                    <p className="text-sm text-green-600 mt-2">✓ File selected: {certificateFile.name}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  {loading ? 'Creating Profile...' : uploading ? 'Uploading Certificate...' : 'Complete Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}

export default HospitalProfileForm



