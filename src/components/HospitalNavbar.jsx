import React from 'react'

const HospitalNavbar = ({ currentPage, setCurrentPage, onSignOut, hospitalName }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Hospital Name */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-600">MediHub</h1>
              {hospitalName && (
                <p className="text-xs text-gray-500">{hospitalName}</p>
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                currentPage === 'dashboard'
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentPage('info')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                currentPage === 'info'
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Hospital Info
            </button>
            <button
              onClick={onSignOut}
              className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default HospitalNavbar
