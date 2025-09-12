import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import BackToRoles from '../components/BackToRoles'

const LabProfileForm = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [certificateFile, setCertificateFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    labName: '',
    ownerName: '',
    registrationNumber: '',
    yearOfEstablishment: '',
    email: '',
    phone: '',
    address: '',
    workingHours: '',
    testsOffered: [],
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

  // Available test types
  const availableTests = [
    'Blood Test',
    'Urine Test',
    'X-ray',
    'MRI',
    'CT Scan',
    'Ultrasound',
    'ECG',
    'Echo',
    'Pathology',
    'Microbiology',
    'Biochemistry',
    'Hematology'
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

  const handleTestSelection = (test) => {
    setFormData(prev => ({
      ...prev,
      testsOffered: prev.testsOffered.includes(test)
        ? prev.testsOffered.filter(t => t !== test)
        : [...prev.testsOffered, test]
    }))
  }

  const handleFileUpload = async (file) => {
    if (!file) return null

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}_${Date.now()}.${fileExt}`
      const filePath = `lab-certificates/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('lab-certificates')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('lab-certificates')
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
    if (!formData.labName.trim()) {
      setError('Lab name is required')
      return false
    }
    if (!formData.ownerName.trim()) {
      setError('Owner/Authorized person name is required')
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
    if (formData.testsOffered.length === 0) {
      setError('Please select at least one test type')
      return false
    }
    if (!certificateFile) {
      setError('Registration certificate is required')
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

      const labData = {
        clerk_user_id: user.id,
        lab_name: formData.labName,
        owner_name: formData.ownerName,
        registration_number: formData.registrationNumber,
        year_of_establishment: parseInt(formData.yearOfEstablishment),
        email: formData.email,
        phone: `${selectedCountryCode}${formData.phone}`,
        address: formData.address,
        working_hours: formData.workingHours,
        tests_offered: formData.testsOffered,
        certificate_url: certificateUrl
      }

      const { error } = await supabase
        .from('labs')
        .upsert([labData], { onConflict: 'clerk_user_id' })

      if (error) throw error

      setSuccess('Lab profile created successfully!')
      
      // Clear form
      setFormData({
        labName: '',
        ownerName: '',
        registrationNumber: '',
        yearOfEstablishment: '',
        email: user.primaryEmailAddress?.emailAddress || '',
        phone: '',
        address: '',
        workingHours: '',
        testsOffered: [],
        certificateUrl: ''
      })
      setCertificateFile(null)

      setTimeout(() => {
        navigate('/dashboard/lab')
      }, 2000)

    } catch (error) {
      console.error('Error saving lab profile:', error)
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
              <h2 className="text-3xl font-bold text-white mb-2">Complete Your Lab Profile</h2>
              <p className="text-primary-100">Please provide your laboratory information to complete your registration.</p>
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
                      Lab Name *
                    </label>
                    <input
                      type="text"
                      value={formData.labName}
                      onChange={(e) => handleInputChange('labName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter lab name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner/Authorized Person Name *
                    </label>
                    <input
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) => handleInputChange('ownerName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Enter owner name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Number / License ID *
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Hours *
                  </label>
                  <input
                    type="text"
                    value={formData.workingHours}
                    onChange={(e) => handleInputChange('workingHours', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="e.g., Mon-Sat: 9:00 AM - 6:00 PM"
                    required
                  />
                </div>
              </div>

              {/* Tests Offered Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  🧪 Types of Tests Offered *
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableTests.map((test) => (
                    <label key={test} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.testsOffered.includes(test)}
                        onChange={() => handleTestSelection(test)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700">{test}</span>
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

export default LabProfileForm



