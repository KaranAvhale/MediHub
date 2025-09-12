import React from 'react'

const LabInfo = ({ labData, onDataUpdate }) => {
  if (!labData) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-500 text-center">No lab information found.</p>
          </div>
        </div>
      </div>
    )
  }

  const handleCertificateClick = () => {
    if (labData.certificate_url) {
      window.open(labData.certificate_url, '_blank')
    }
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-8">
            <h2 className="text-3xl font-bold text-white mb-2">Laboratory Information</h2>
            <p className="text-primary-100">Complete details about your laboratory</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                🏥 Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Lab Name</label>
                  <p className="text-lg font-semibold text-gray-900">{labData.lab_name}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Owner/Authorized Person</label>
                  <p className="text-lg font-semibold text-gray-900">{labData.owner_name}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Registration Number</label>
                  <p className="text-lg font-semibold text-gray-900">{labData.registration_number}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Year of Establishment</label>
                  <p className="text-lg font-semibold text-gray-900">{labData.year_of_establishment}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
                  <p className="text-lg font-semibold text-gray-900">{labData.email}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                  <p className="text-lg font-semibold text-gray-900">{labData.phone}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Full Address</label>
                <p className="text-lg font-semibold text-gray-900">{labData.address}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-600 mb-1">Working Hours</label>
                <p className="text-lg font-semibold text-gray-900">{labData.working_hours}</p>
              </div>
            </div>

            {/* Tests Offered */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                🧪 Types of Tests Offered
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {labData.tests_offered && labData.tests_offered.map((test, index) => (
                  <div key={index} className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                    <span className="text-sm font-medium text-primary-700">{test}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Registration Certificate */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                📄 Registration Certificate
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">Certificate Document</label>
                {labData.certificate_url ? (
                  <button
                    onClick={handleCertificateClick}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Certificate
                  </button>
                ) : (
                  <p className="text-gray-500">No certificate uploaded</p>
                )}
              </div>
            </div>

            {/* Refresh Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={onDataUpdate}
                className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2"
              >
                Refresh Information
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LabInfo
