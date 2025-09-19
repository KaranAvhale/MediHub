import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import BackToRoles from '../components/BackToRoles'
import TranslatedText from '../components/TranslatedText'
import TranslatedInput from '../components/TranslatedInput'
import LanguageSelector from '../components/LanguageSelector'
import { useTranslate } from '../hooks/useTranslate'

const PatientSignIn = () => {
  const { t } = useTranslate()
  const [aadharNumber, setAadharNumber] = useState('')
  const [aadharOtp, setAadharOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { data, error: queryError } = await supabase
        .from('patients')
        .select('*')
        .eq('aadhar_number', aadharNumber)
        .eq('aadhar_otp', aadharOtp)
        .single()

      if (queryError) {
        throw queryError
      }

      if (!data) {
        const errorMsg = await t('Invalid Aadhaar number or OTP. Please try again.')
        setError(errorMsg)
        return
      }

      // Persist for the dashboard
      localStorage.setItem('patientData', JSON.stringify(data))

      navigate('/dashboard/patient')
    } catch (err) {
      console.error('Sign-in error:', err)
      const errorMsg = await t('Invalid Aadhaar number or OTP. Please try again.')
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                MediHub
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector variant="compact" />
              <BackToRoles />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
        {/* Content Section - Left Side */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 order-1 lg:order-1">
          <div className="w-full max-w-lg">
            {/* Hero Section */}
            <div className="text-center lg:text-left">
              <div className="mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6 shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  <TranslatedText>Welcome Back,</TranslatedText> <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"><TranslatedText>Patient</TranslatedText></span>
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed mb-8">
                  <TranslatedText>
                    Sign in to access your health records securely with Aadhaar authentication. View your medical history and manage your healthcare journey.
                  </TranslatedText>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section - Right Side */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 order-2 lg:order-2">
          <div className="w-full max-w-md">
            {/* Sign In Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h3 className="text-white font-semibold text-lg"><TranslatedText>Sign In to Your Account</TranslatedText></h3>
                <p className="text-blue-100 text-sm"><TranslatedText>Access your health records</TranslatedText></p>
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Aadhaar Number */}
                  <TranslatedInput
                    label="Aadhaar Number"
                    placeholder="Enter your 12-digit Aadhaar number"
                    type="text"
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-all duration-200"
                    required
                    maxLength={12}
                    pattern="[0-9]{12}"
                  />

                  {/* Aadhaar OTP */}
                  <TranslatedInput
                    label="Aadhaar OTP"
                    placeholder="Enter your Aadhaar OTP"
                    type="password"
                    value={aadharOtp}
                    onChange={(e) => setAadharOtp(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-all duration-200"
                    required
                  />

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        {error}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <TranslatedText>Signing In...</TranslatedText>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        <TranslatedText>Sign In Securely</TranslatedText>
                      </div>
                    )}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default PatientSignIn



