import React from 'react'

const DoctorNavbar = ({ doctorName, currentView, onNavigate, onSignOut }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">MediHub</h1>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </button>
            
            <button
              onClick={() => onNavigate('personal-info')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentView === 'personal-info'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Personal Info
            </button>

            <button
              onClick={onSignOut}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default DoctorNavbar
