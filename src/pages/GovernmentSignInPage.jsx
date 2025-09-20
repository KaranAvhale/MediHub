import React from 'react'
import { SignIn, useUser } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import TranslatedText from '../components/TranslatedText'
import LanguageSelector from '../components/LanguageSelector'

const GovernmentSignInPage = () => {
  const { isSignedIn } = useUser()

  if (isSignedIn) {
    return <Navigate to="/dashboard/government" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="absolute top-4 right-4">
        <LanguageSelector variant="compact" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          <TranslatedText>Sign in to Government Portal</TranslatedText>
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          <TranslatedText>Access your health analytics dashboard</TranslatedText>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 backdrop-blur-sm py-8 px-4 shadow-xl rounded-2xl border border-white/20 sm:px-10">
          <SignIn 
            routing="path"
            path="/auth/government/sign-in"
            redirectUrl="/dashboard/government"
            signUpUrl="/auth/government"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-none border-0 bg-transparent",
                headerTitle: "text-xl font-semibold text-gray-900",
                headerSubtitle: "text-gray-600",
                socialButtonsBlockButton: "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm",
                socialButtonsBlockButtonText: "font-medium",
                dividerLine: "bg-gray-300",
                dividerText: "text-gray-500",
                formFieldLabel: "text-gray-700 font-medium",
                formFieldInput: "border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md",
                formButtonPrimary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200",
                footerActionLink: "text-blue-600 hover:text-blue-700 font-medium"
              }
            }}
          />
        </div>

        {/* Back to Sign Up */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            <TranslatedText>Don't have an account?</TranslatedText>{' '}
            <a href="/auth/government" className="font-medium text-blue-600 hover:text-blue-700">
              <TranslatedText>Sign up</TranslatedText>
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default GovernmentSignInPage
