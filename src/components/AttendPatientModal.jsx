import React, { useState } from 'react'

const AttendPatientModal = ({ isOpen, onClose, onAadharSubmit }) => {
  const [aadharNumber, setAadharNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!aadharNumber.trim()) return

    setIsSubmitting(true)
    try {
      await onAadharSubmit(aadharNumber.trim())
      setAadharNumber('')
    } catch (error) {
      console.error('Error submitting Aadhaar:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setAadharNumber('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 transform transition-all animate-slideUp">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Attend Patient</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-6">
          <p className="text-gray-600 mb-6 text-center">Choose how you'd like to identify the patient:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fingerprint Scan Option */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center flex flex-col justify-between min-h-[280px]">
              <div>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-3 text-lg">Fingerprint Scan</h3>
                <p className="text-sm text-gray-500 mb-6">Scan patient's fingerprint for quick and secure identification</p>
              </div>
              <button
                disabled
                className="w-full bg-gray-200 text-gray-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>

            {/* Aadhaar Number Option */}
            <div className="border-2 border-blue-200 bg-blue-50/30 rounded-xl p-6 flex flex-col justify-between min-h-[280px]">
              <div>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-3 text-lg text-center">Aadhaar Number</h3>
                <p className="text-sm text-gray-500 mb-6 text-center">Enter patient's 12-digit Aadhaar number</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={aadharNumber}
                    onChange={(e) => setAadharNumber(e.target.value)}
                    placeholder="Enter 12-digit Aadhaar number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-wider"
                    maxLength={12}
                    pattern="[0-9]{12}"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!aadharNumber.trim() || isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  {isSubmitting ? 'Fetching Details...' : 'Fetch Details'}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AttendPatientModal
