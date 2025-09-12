import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'

const RoleSelection = () => {
  const navigate = useNavigate()
  const { isSignedIn } = useUser()
  const { signOut } = useClerk()

  const handleBackToHome = () => {
    navigate('/')
  }

  const handleRoleClick = async (roleId) => {
    // If a user is already signed in, sign out so SignUp is shown next
    if (isSignedIn) {
      try {
        await signOut()
      } catch (e) {
        console.warn('Sign out before signup failed:', e)
      }
    }

    // Navigate to the appropriate auth page based on role
    switch (roleId) {
      case 'patient':
        navigate('/auth/patient')
        break
      case 'doctor':
        navigate('/auth/doctor')
        break
      case 'hospital':
        navigate('/auth/hospital')
        break
      case 'labs':
        navigate('/auth/lab')
        break
      default:
        console.error(`Unknown role: ${roleId}`)
    }
  }

  const roles = [
    {
      id: 'patient',
      name: 'Patient',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'doctor',
      name: 'Doctor',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'hospital',
      name: 'Hospital',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      id: 'labs',
      name: 'Labs',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MediHub
              </h1>
            </div>
            <button
              onClick={handleBackToHome}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto w-full">
          {/* Heading */}
          <div className="text-center mb-16">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Choose Your <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Role</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Select your role to access the appropriate MediHub features and services. 
              Join our comprehensive healthcare ecosystem designed for modern medical practice.
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {roles.map((role, index) => {
              const gradients = [
                'from-blue-500 to-cyan-500',
                'from-purple-500 to-pink-500', 
                'from-green-500 to-emerald-500',
                'from-orange-500 to-amber-500'
              ]
              const bgColors = [
                'from-blue-50 to-cyan-50',
                'from-purple-50 to-pink-50',
                'from-green-50 to-emerald-50', 
                'from-orange-50 to-amber-50'
              ]
              return (
                <div
                  key={role.id}
                  onClick={() => handleRoleClick(role.id)}
                  className={`bg-gradient-to-br ${bgColors[index]} rounded-2xl shadow-lg border border-white/20 p-8 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 group backdrop-blur-sm`}
                >
                  <div className="text-center">
                    <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r ${gradients[index]} text-white rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      {role.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {role.name}
                    </h3>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Additional Info */}
          <div className="text-center mt-16">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">New to MediHub?</h3>
              <p className="text-gray-600 leading-relaxed">
                Our platform connects all healthcare stakeholders in a secure, unified ecosystem. 
                Choose your role above to get started with features tailored specifically for your needs.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default RoleSelection
