import React from 'react'

const TreatmentHistoryModal = ({ isOpen, onClose, treatment, treatmentHistory = [] }) => {
  if (!isOpen) return null

  const treatmentName = typeof treatment === 'string' 
    ? treatment 
    : treatment?.treatmentName || treatment?.name || 'Treatment'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Treatment History</h2>
                <p className="text-indigo-100 text-sm">{treatmentName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Current Treatment - Always show current treatment details */}
            <div className={`${treatment?.isPastTreatment ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500'} rounded-xl p-6`}>
              <div className="flex items-center mb-4">
                <div className={`w-8 h-8 ${treatment?.isPastTreatment ? 'bg-green-500' : 'bg-blue-500'} rounded-full flex items-center justify-center mr-3`}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={treatment?.isPastTreatment ? "M5 13l4 4L19 7" : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"} />
                  </svg>
                </div>
                <div>
                  <h3 className={`font-semibold ${treatment?.isPastTreatment ? 'text-green-900' : 'text-blue-900'}`}>
                    {treatment?.isPastTreatment ? 'Completed Treatment' : 'Current Treatment'}
                  </h3>
                  <p className={`text-sm ${treatment?.isPastTreatment ? 'text-green-700' : 'text-blue-700'}`}>{treatmentName}</p>
                </div>
              </div>
              
              <div className={`bg-white rounded-xl p-4 border ${treatment?.isPastTreatment ? 'border-green-200' : 'border-blue-200'}`}>
                <h4 className={`font-semibold ${treatment?.isPastTreatment ? 'text-green-900' : 'text-blue-900'} mb-2`}>{treatmentName}</h4>
                {typeof treatment === 'object' && (
                  <>
                    {treatment.description && (
                      <p className={`${treatment?.isPastTreatment ? 'text-green-700' : 'text-blue-700'} mb-3`}>{treatment.description}</p>
                    )}
                    
                    {treatment.startDate && (
                      <p className={`text-sm ${treatment?.isPastTreatment ? 'text-green-600' : 'text-blue-600'} mb-2`}>
                        <span className="font-medium">Started:</span> {new Date(treatment.startDate).toLocaleDateString()}
                      </p>
                    )}
                    
                    {treatment.followUpDate && (
                      <p className={`text-sm ${treatment?.isPastTreatment ? 'text-green-600' : 'text-blue-600'} mb-2`}>
                        <span className="font-medium">Follow-up:</span> {new Date(treatment.followUpDate).toLocaleDateString()}
                      </p>
                    )}
                    
                    {treatment.completedDate && (
                      <p className={`text-sm ${treatment?.isPastTreatment ? 'text-green-600' : 'text-blue-600'} mb-2 font-medium`}>
                        <span className="font-medium">Completed:</span> {new Date(treatment.completedDate).toLocaleDateString()}
                      </p>
                    )}
                    
                    {treatment.prescriptions && treatment.prescriptions.length > 0 && (
                      <div className="mt-3">
                        <h5 className={`font-medium ${treatment?.isPastTreatment ? 'text-green-800' : 'text-blue-800'} mb-2`}>
                          {treatment?.isPastTreatment ? 'Final Prescriptions:' : 'Current Prescriptions:'}
                        </h5>
                        <div className="space-y-2">
                          {treatment.prescriptions.map((prescription, index) => (
                            <div key={index} className={`${treatment?.isPastTreatment ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} rounded-lg p-3 border`}>
                              <p className={`font-medium ${treatment?.isPastTreatment ? 'text-green-900' : 'text-blue-900'}`}>{prescription.medicineName}</p>
                              <p className={`text-sm ${treatment?.isPastTreatment ? 'text-green-700' : 'text-blue-700'}`}>
                                {prescription.dose} {prescription.quantity && `• Qty: ${prescription.quantity}`} {prescription.frequency && prescription.frequency.length > 0 && 
                                  `• ${prescription.frequency.join(', ')}`}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {treatment.notes && (
                      <div className="mt-3">
                        <h5 className={`font-medium ${treatment?.isPastTreatment ? 'text-green-800' : 'text-blue-800'} mb-2`}>Notes:</h5>
                        <p className={`${treatment?.isPastTreatment ? 'text-green-700 bg-green-50 border-green-200' : 'text-blue-700 bg-blue-50 border-blue-200'} rounded-lg p-3 border`}>
                          {treatment.notes}
                        </p>
                      </div>
                    )}

                    {treatment.attachedReports && treatment.attachedReports.length > 0 && (
                      <div className="mt-3">
                        <h5 className={`font-medium ${treatment?.isPastTreatment ? 'text-green-800' : 'text-blue-800'} mb-2`}>Attached Reports:</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {treatment.attachedReports.map((report, rIndex) => {
                            const reportObj = typeof report === 'string' ? { name: report, url: report } : report;
                            const reportName = reportObj?.name || reportObj?.title || `Report ${rIndex + 1}`;
                            
                            return (
                              <button
                                key={rIndex}
                                onClick={() => {
                                  if (reportObj?.url && reportObj.url.startsWith('http')) {
                                    window.open(reportObj.url, '_blank');
                                  } else {
                                    alert('Report URL not available');
                                  }
                                }}
                                className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between cursor-pointer"
                              >
                                <span>{reportName}</span>
                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Treatment History Timeline - Only show if there's history */}
            {treatmentHistory && treatmentHistory.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Past Updates
                </h3>
                
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    {treatmentHistory.map((historyItem, index) => (
                      <div key={index} className="relative flex items-start">
                        {/* Timeline dot */}
                        <div className="absolute left-2 w-4 h-4 bg-indigo-500 rounded-full border-4 border-white shadow-sm"></div>
                        
                        {/* Content */}
                        <div className="ml-10 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 w-full">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">
                              Update #{treatmentHistory.length - index}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {historyItem.updatedAt || historyItem.movedToHistoryAt ? new Date(historyItem.updatedAt || historyItem.movedToHistoryAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Unknown date'}
                            </span>
                          </div>
                          
                          {historyItem.description && (
                            <p className="text-gray-700 mb-3">{historyItem.description}</p>
                          )}
                          
                          {historyItem.prescriptions && historyItem.prescriptions.length > 0 && (
                            <div className="mb-3">
                              <h5 className="font-medium text-gray-800 mb-2">Prescriptions:</h5>
                              <div className="space-y-2">
                                {historyItem.prescriptions.map((prescription, pIndex) => (
                                  <div key={pIndex} className="bg-white rounded-lg p-3 border border-gray-200">
                                    <p className="font-medium text-gray-900">{prescription.medicineName}</p>
                                    <p className="text-sm text-gray-600">
                                      {prescription.dose} {prescription.quantity && `• Qty: ${prescription.quantity}`} {prescription.frequency && prescription.frequency.length > 0 && 
                                        `• ${prescription.frequency.join(', ')}`}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {historyItem.notes && (
                            <div className="mb-3">
                              <h5 className="font-medium text-gray-800 mb-2">Notes:</h5>
                              <p className="text-gray-700 bg-white rounded-lg p-3 border border-gray-200">
                                {historyItem.notes}
                              </p>
                            </div>
                          )}
                          
                          {historyItem.attachedReports && historyItem.attachedReports.length > 0 && (
                            <div>
                              <h5 className="font-medium text-gray-800 mb-2">Attached Reports:</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {historyItem.attachedReports.map((report, rIndex) => {
                                  const reportObj = typeof report === 'string' ? { name: report, url: report } : report;
                                  const reportName = reportObj?.name || reportObj?.title || `Report ${rIndex + 1}`;
                                  
                                  return (
                                    <button
                                      key={rIndex}
                                      onClick={() => {
                                        if (reportObj?.url && reportObj.url.startsWith('http')) {
                                          window.open(reportObj.url, '_blank');
                                        } else {
                                          alert('Report URL not available');
                                        }
                                      }}
                                      className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between cursor-pointer"
                                    >
                                      <span>{reportName}</span>
                                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Show message when no history exists */}
            {(!treatmentHistory || treatmentHistory.length === 0) && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Past Updates</h4>
                <p className="text-gray-600 max-w-md mx-auto">
                  This treatment has no past updates yet. History will appear here when the treatment is modified.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-3xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default TreatmentHistoryModal
