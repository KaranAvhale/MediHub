import React, { useRef } from 'react'

const ChildIdPrintModal = ({ isOpen, onClose, childData, hospitalData }) => {
  const printRef = useRef()

  const handlePrint = () => {
    const printContent = printRef.current
    const originalContents = document.body.innerHTML
    const printContents = printContent.innerHTML

    document.body.innerHTML = printContents
    window.print()
    document.body.innerHTML = originalContents
    window.location.reload() // Reload to restore React functionality
  }


  if (!isOpen) return null

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Print Child ID Certificate</h2>
                <p className="text-blue-100 mt-1">Preview and print the child identification document</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handlePrint}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print</span>
                </button>
                <button
                  onClick={onClose}
                  className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="p-8 max-h-[calc(95vh-120px)] overflow-y-auto">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-4">Preview of the document that will be printed:</p>
              <div className="bg-white border-2 border-dashed border-gray-300 p-4 rounded-lg">
                <div ref={printRef}>
                  <PrintableContent childData={childData} hospitalData={hospitalData} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}

const PrintableContent = ({ childData, hospitalData }) => {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  return (
    <div className="min-h-screen p-8 bg-white">
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
            * {
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `
      }} />

      {/* Header with Hospital Info */}
      <div className="text-center border-b-4 border-blue-600 pb-6 mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-blue-600 text-white p-3 rounded-full mr-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{hospitalData?.hospital_name}</h1>
            <p className="text-lg text-gray-600">{hospitalData?.hospital_type}</p>
          </div>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Address:</strong> {hospitalData?.address}</p>
          <p><strong>Registration No:</strong> {hospitalData?.registration_number}</p>
          <p><strong>Phone:</strong> {hospitalData?.phone} | <strong>Email:</strong> {hospitalData?.email}</p>
        </div>
      </div>

      {/* Certificate Title */}
      <div className="text-center mb-8">
        <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold">CHILD IDENTIFICATION CERTIFICATE</h2>
          <p className="text-blue-100 mt-1">Temporary Aadhaar Document</p>
        </div>
      </div>

      {/* Child Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Personal Information */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Personal Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Child Name:</span>
              <span className="font-bold text-gray-900">{childData?.child_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Date of Birth:</span>
              <span className="text-gray-900">{new Date(childData?.date_of_birth).toLocaleDateString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Birth Time:</span>
              <span className="text-gray-900">{childData?.birth_time}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Gender:</span>
              <span className="text-gray-900">{childData?.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Age:</span>
              <span className="text-gray-900">{childData?.age}</span>
            </div>
            {childData?.blood_group && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">Blood Group:</span>
                <span className="text-gray-900">{childData?.blood_group}</span>
              </div>
            )}
          </div>
        </div>

        {/* Temporary Aadhaar */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Identification Details
          </h3>
          <div className="text-center bg-white rounded-lg p-4 border-2 border-dashed border-green-300">
            <p className="text-sm font-medium text-gray-600 mb-2">Temporary Aadhaar Number</p>
            <p className="text-3xl font-bold text-green-800 font-mono tracking-wider">{childData?.child_aadhaar}</p>
            <p className="text-xs text-gray-500 mt-2">This is a temporary identification number</p>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Issue Date:</span>
              <span className="text-gray-900">{currentDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Status:</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Parent Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Mother Information */}
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-pink-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Mother Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Name:</span>
              <span className="text-gray-900">{childData?.mother_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Aadhaar:</span>
              <span className="text-gray-900 font-mono">{childData?.mother_aadhaar}</span>
            </div>
          </div>
        </div>

        {/* Father Information */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Father Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Name:</span>
              <span className="text-gray-900">{childData?.father_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Aadhaar:</span>
              <span className="text-gray-900 font-mono">{childData?.father_aadhaar}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 mb-8">
        <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Contact Information
        </h3>
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Parent Mobile Number:</span>
          <span className="text-gray-900 font-mono">{childData?.parent_mobile_num}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-6 mt-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Document Generated On:</p>
            <p className="font-medium text-gray-900">{new Date().toLocaleString('en-IN')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Authorized by:</p>
            <p className="font-medium text-gray-900">{hospitalData?.hospital_name}</p>
            <div className="mt-4 border-t border-gray-400 pt-2">
              <p className="text-xs text-gray-500">Authorized Signature</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This is a computer-generated document and does not require a physical signature.
            For verification, contact {hospitalData?.hospital_name} at {hospitalData?.phone}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChildIdPrintModal
