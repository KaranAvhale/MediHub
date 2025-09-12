import React from 'react'
import { SignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'
import BackToRoles from '../components/BackToRoles'

const DoctorSignInPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
                <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-6 shadow-xl">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  Welcome Back, <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Doctor</span>
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed mb-8">
                  Sign in to access your dashboard and continue providing excellent healthcare services. Manage your patients and medical records efficiently.
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
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h3 className="text-white font-semibold text-lg">Sign In to Your Account</h3>
                <p className="text-purple-100 text-sm">Access your medical dashboard</p>
              </div>
              <div className="p-6">
                <SignIn 
                  routing="hash" 
                  signUpUrl="/auth/doctor" 
                  afterSignInUrl="/dashboard/doctor"
                  appearance={{
                    elements: {
                      formButtonPrimary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl',
                      card: 'shadow-none',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      socialButtonsBlockButton: 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200',
                      dividerLine: 'bg-gray-200',
                      dividerText: 'text-gray-500 font-medium',
                      formFieldInput: 'border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 rounded-lg py-3 px-4 transition-all duration-200',
                      formFieldLabel: 'text-gray-700 font-medium mb-2',
                      footerActionLink: 'text-purple-600 hover:text-purple-700 font-medium',
                      footerActionText: 'text-gray-600'
                    }
                  }}
                />
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/auth/doctor" className="text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200">
                    Sign up here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default DoctorSignInPage
