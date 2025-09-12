import React from 'react'
import { SignUp } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import BackToRoles from '../components/BackToRoles'

const HospitalAuthPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                MediHub
              </h1>
            </div>
            <BackToRoles />
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
                <div className="w-24 h-24 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6 shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Join as a <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Hospital</span>
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed mb-8">
                  Register your healthcare facility to manage patients, staff, and medical operations efficiently. Join our comprehensive healthcare network and streamline your hospital operations with advanced digital tools.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section - Right Side */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 order-2 lg:order-2">
          <div className="w-full max-w-md">
            {/* Sign Up Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <h3 className="text-white font-semibold text-lg">Create Your Hospital Account</h3>
                <p className="text-green-100 text-sm">Start managing your healthcare facility</p>
              </div>
              <div className="p-6">
                <SignUp 
                  routing="hash" 
                  signInUrl="/auth/hospital/sign-in" 
                  afterSignUpUrl="/profile/hospital"
                  appearance={{
                    elements: {
                      formButtonPrimary: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl',
                      card: 'shadow-none',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      socialButtonsBlockButton: 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200',
                      dividerLine: 'bg-gray-200',
                      dividerText: 'text-gray-500 font-medium',
                      formFieldInput: 'border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg py-3 px-4 transition-all duration-200',
                      formFieldLabel: 'text-gray-700 font-medium mb-2',
                      footerActionLink: 'text-green-600 hover:text-green-700 font-medium',
                      footerActionText: 'text-gray-600'
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default HospitalAuthPage



