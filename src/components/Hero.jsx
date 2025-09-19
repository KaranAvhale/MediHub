import React from 'react'
import { useNavigate } from 'react-router-dom'
import TranslatedText from './TranslatedText'

const Hero = () => {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    navigate('/roles')
  }


  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-12">
          {/* Medical icon */}
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MediHub</span>
            <br />
            <span className="text-gray-700 text-3xl sm:text-4xl lg:text-5xl">
              <TranslatedText>Your Health Records,</TranslatedText>
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent text-3xl sm:text-4xl lg:text-5xl">
              <TranslatedText>Secured & Accessible</TranslatedText>
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            <TranslatedText>
              Experience the future of healthcare with our secure, comprehensive platform. 
              Connect patients, doctors, labs, and hospitals in one unified ecosystem with 
              enterprise-grade security and seamless accessibility.
            </TranslatedText>
          </p>
          
          <div className="flex justify-center mb-10">
            <button 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl font-semibold px-10 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center justify-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <TranslatedText>Get Started Today</TranslatedText>
              </span>
            </button>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/20 shadow-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                <TranslatedText>Bank-Level Security</TranslatedText>
              </h3>
              <p className="text-sm text-gray-600">
                <TranslatedText>Your medical data is protected with enterprise-grade encryption</TranslatedText>
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/20 shadow-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                <TranslatedText>Instant Access</TranslatedText>
              </h3>
              <p className="text-sm text-gray-600">
                <TranslatedText>Access your health records anytime, anywhere, on any device</TranslatedText>
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/20 shadow-lg">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                <TranslatedText>Connected Care</TranslatedText>
              </h3>
              <p className="text-sm text-gray-600">
                <TranslatedText>Seamlessly connect with healthcare providers nationwide</TranslatedText>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

