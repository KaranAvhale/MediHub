import React, { useState } from 'react'

const VaccinationModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    vaccineName: '',
    nextDose: ''
  })
  const [error, setError] = useState('')

  const vaccines = [
    'BCG', 'Hepatitis B', 'DPT', 'Polio', 'MMR', 'Varicella', 'Pneumococcal',
    'Rotavirus', 'Influenza', 'HPV', 'Meningococcal', 'Typhoid', 'Japanese Encephalitis'
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!formData.patientName.trim()) {
      setError('Patient name is required')
      return
    }
    if (!formData.age || formData.age < 0) {
      setError('Valid age is required')
      return
    }
    if (!formData.vaccineName) {
      setError('Vaccine name is required')
      return
    }

    onSubmit(formData)
    setFormData({
      patientName: '',
      age: '',
      vaccineName: '',
      nextDose: ''
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Add Vaccination Record</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient Name *
            </label>
            <input
              type="text"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter patient name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age *
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Enter age"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vaccine Name *
            </label>
            <select
              name="vaccineName"
              value={formData.vaccineName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="">Select vaccine</option>
              {vaccines.map((vaccine) => (
                <option key={vaccine} value={vaccine}>
                  {vaccine}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Dose Date (Optional)
            </label>
            <input
              type="date"
              name="nextDose"
              value={formData.nextDose}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Vaccination
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VaccinationModal
