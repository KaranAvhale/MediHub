import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import TranslatedText from '../components/TranslatedText'
import { useTranslate } from '../hooks/useTranslate'

const GovernmentAnalytics = () => {
  const { t } = useTranslate()
  const [analyticsData, setAnalyticsData] = useState({
    diseases: {},
    patientCount: 0,
    totalTreatments: 0,
    loading: true
  })
  const [filters, setFilters] = useState({
    state: '',
    district: '',
    city: ''
  })
  const [locations, setLocations] = useState({
    states: [],
    districts: [],
    cities: []
  })

  // Extract diseases from treatment data
  const extractDiseases = (treatments) => {
    const diseases = {}
    
    if (!treatments || !Array.isArray(treatments)) return diseases

    treatments.forEach(treatment => {
      if (treatment && typeof treatment === 'object') {
        // Extract disease name (treatment name is disease name)
        const diseaseName = treatment.treatmentName || treatment.name || treatment.disease || 'Unknown Disease'
        
        if (diseases[diseaseName]) {
          diseases[diseaseName]++
        } else {
          diseases[diseaseName] = 1
        }
      }
    })

    return diseases
  }

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsData(prev => ({ ...prev, loading: true }))

      // Build query with location filters
      let query = supabase.from('patients').select('*')

      if (filters.state) {
        query = query.ilike('address', `%${filters.state}%`)
      }
      if (filters.district) {
        query = query.ilike('address', `%${filters.district}%`)
      }
      if (filters.city) {
        query = query.ilike('address', `%${filters.city}%`)
      }

      const { data: patients, error } = await query

      if (error) throw error

      // Calculate filtered location counts and extract diseases
      const filteredStates = new Set()
      const filteredDistricts = new Set()
      const filteredCities = new Set()
      const allDiseases = {}
      let totalTreatments = 0

      patients.forEach(patient => {
        if (patient.address) {
          const addressParts = patient.address.split(',').map(part => part.trim())
          if (addressParts.length >= 1) filteredCities.add(addressParts[0])
          if (addressParts.length >= 2) filteredDistricts.add(addressParts[1])
          if (addressParts.length >= 3) filteredStates.add(addressParts[2])
        }

        // Process ongoing treatments
        if (patient.ongoing_treatments) {
          const ongoingTreatments = Array.isArray(patient.ongoing_treatments) 
            ? patient.ongoing_treatments 
            : [patient.ongoing_treatments]
          
          const ongoingDiseases = extractDiseases(ongoingTreatments)
          Object.keys(ongoingDiseases).forEach(disease => {
            allDiseases[disease] = (allDiseases[disease] || 0) + ongoingDiseases[disease]
            totalTreatments += ongoingDiseases[disease]
          })
        }

        // Process past treatments
        if (patient.past_treatments) {
          const pastTreatments = Array.isArray(patient.past_treatments) 
            ? patient.past_treatments 
            : [patient.past_treatments]
          
          const pastDiseases = extractDiseases(pastTreatments)
          Object.keys(pastDiseases).forEach(disease => {
            allDiseases[disease] = (allDiseases[disease] || 0) + pastDiseases[disease]
            totalTreatments += pastDiseases[disease]
          })
        }

        // Process ongoing treatment past
        if (patient.ongoing_treatment_past) {
          const ongoingPastTreatments = Array.isArray(patient.ongoing_treatment_past) 
            ? patient.ongoing_treatment_past 
            : [patient.ongoing_treatment_past]
          
          const ongoingPastDiseases = extractDiseases(ongoingPastTreatments)
          Object.keys(ongoingPastDiseases).forEach(disease => {
            allDiseases[disease] = (allDiseases[disease] || 0) + ongoingPastDiseases[disease]
            totalTreatments += ongoingPastDiseases[disease]
          })
        }

        // Process past treatments past (if exists)
        if (patient.past_treatments_past) {
          const pastTreatmentsPast = Array.isArray(patient.past_treatments_past) 
            ? patient.past_treatments_past 
            : [patient.past_treatments_past]
          
          const pastPastDiseases = extractDiseases(pastTreatmentsPast)
          Object.keys(pastPastDiseases).forEach(disease => {
            allDiseases[disease] = (allDiseases[disease] || 0) + pastPastDiseases[disease]
            totalTreatments += pastPastDiseases[disease]
          })
        }
      })

      setAnalyticsData({
        diseases: allDiseases,
        patientCount: patients.length,
        totalTreatments,
        filteredLocations: {
          states: filteredStates.size,
          districts: filteredDistricts.size,
          cities: filteredCities.size
        },
        loading: false
      })

    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setAnalyticsData(prev => ({ ...prev, loading: false }))
    }
  }

  // Fetch unique locations for filters
  const fetchLocations = async () => {
    try {
      const { data: patients, error } = await supabase
        .from('patients')
        .select('address')

      if (error) throw error

      const states = new Set()
      const districts = new Set()
      const cities = new Set()

      patients.forEach(patient => {
        if (patient.address) {
          const addressParts = patient.address.split(',').map(part => part.trim())
          if (addressParts.length >= 1) cities.add(addressParts[0])
          if (addressParts.length >= 2) districts.add(addressParts[1])
          if (addressParts.length >= 3) states.add(addressParts[2])
        }
      })

      setLocations({
        states: Array.from(states).sort(),
        districts: Array.from(districts).sort(),
        cities: Array.from(cities).sort()
      })

    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  useEffect(() => {
    fetchLocations()
  }, [])

  useEffect(() => {
    fetchAnalyticsData()
  }, [filters])

  // Get top diseases for display
  const getTopDiseases = (limit = 10) => {
    return Object.entries(analyticsData.diseases)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
  }

  const topDiseases = getTopDiseases()
  const maxCount = topDiseases.length > 0 ? topDiseases[0][1] : 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                <TranslatedText>Government Health Analytics</TranslatedText>
              </h1>
              <p className="text-gray-600 mt-2">
                <TranslatedText>Comprehensive patient statistics and regional insights</TranslatedText>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-blue-600 font-semibold">
                  <TranslatedText>Total Patients:</TranslatedText> {analyticsData.patientCount}
                </span>
              </div>
              <div className="bg-green-50 px-4 py-2 rounded-lg">
                <span className="text-green-600 font-semibold">
                  <TranslatedText>Total Treatments:</TranslatedText> {analyticsData.totalTreatments}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            <TranslatedText>Filters</TranslatedText>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* State Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TranslatedText>State</TranslatedText>
              </label>
              <select
                value={filters.state}
                onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value=""><TranslatedText>All States</TranslatedText></option>
                {locations.states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TranslatedText>District</TranslatedText>
              </label>
              <select
                value={filters.district}
                onChange={(e) => setFilters(prev => ({ ...prev, district: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value=""><TranslatedText>All Districts</TranslatedText></option>
                {locations.districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <TranslatedText>City</TranslatedText>
              </label>
              <select
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value=""><TranslatedText>All Cities</TranslatedText></option>
                {locations.cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Loading State */}
        {analyticsData.loading && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600"><TranslatedText>Loading analytics data...</TranslatedText></p>
          </div>
        )}

        {/* Analytics Content */}
        {!analyticsData.loading && (
          <>
            {/* Filter Summary */}
            {(filters.state || filters.district || filters.city) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="text-blue-800 font-medium">
                    <TranslatedText>Filtered Results:</TranslatedText>
                  </span>
                  <span className="text-blue-700 ml-2">
                    {filters.state && `${filters.state}`}
                    {filters.district && ` > ${filters.district}`}
                    {filters.city && ` > ${filters.city}`}
                  </span>
                </div>
              </div>
            )}

            {/* Patient Statistics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-blue-100">
                      <TranslatedText>{(filters.state || filters.district || filters.city) ? 'Filtered Patients' : 'Total Patients'}</TranslatedText>
                    </p>
                    <p className="text-2xl font-bold">{analyticsData.patientCount}</p>
                    {(filters.state || filters.district || filters.city) && (
                      <p className="text-blue-200 text-sm">
                        <TranslatedText>in selected area</TranslatedText>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-green-100"><TranslatedText>States Covered</TranslatedText></p>
                    <p className="text-2xl font-bold">{analyticsData.filteredLocations?.states || locations.states.length}</p>
                    <p className="text-green-200 text-sm">
                      <TranslatedText>{filters.state ? 'Selected State' : 'Total States'}</TranslatedText>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-purple-100"><TranslatedText>Districts Covered</TranslatedText></p>
                    <p className="text-2xl font-bold">{analyticsData.filteredLocations?.districts || locations.districts.length}</p>
                    <p className="text-purple-200 text-sm">
                      <TranslatedText>{filters.district ? 'Selected District' : 'Total Districts'}</TranslatedText>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-orange-100"><TranslatedText>Cities Covered</TranslatedText></p>
                    <p className="text-2xl font-bold">{analyticsData.filteredLocations?.cities || locations.cities.length}</p>
                    <p className="text-orange-200 text-sm">
                      <TranslatedText>{filters.city ? 'Selected City' : 'Total Cities'}</TranslatedText>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-red-100"><TranslatedText>Unique Diseases</TranslatedText></p>
                    <p className="text-2xl font-bold">{Object.keys(analyticsData.diseases).length}</p>
                    <p className="text-red-200 text-sm">
                      <TranslatedText>Different Conditions</TranslatedText>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Disease Statistics */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                <TranslatedText>Top Diseases (Treatment Names)</TranslatedText>
              </h2>
              
              {topDiseases.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  <TranslatedText>No disease data available for the selected filters.</TranslatedText>
                </p>
              ) : (
                <div className="space-y-4">
                  {topDiseases.map(([disease, count], index) => (
                    <div key={disease} className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900">{disease}</h3>
                          <span className="text-gray-600 font-semibold">{count} cases</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(count / maxCount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Disease Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  <TranslatedText>All Diseases with Patient Numbers</TranslatedText>
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <TranslatedText>Disease Name (Treatment Name)</TranslatedText>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <TranslatedText>Number of Cases</TranslatedText>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <TranslatedText>Percentage</TranslatedText>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.entries(analyticsData.diseases)
                      .sort(([,a], [,b]) => b - a)
                      .map(([disease, count]) => (
                        <tr key={disease} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {disease}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {analyticsData.totalTreatments > 0 
                              ? ((count / analyticsData.totalTreatments) * 100).toFixed(1)
                              : 0}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Patient Details Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  <TranslatedText>{(filters.state || filters.district || filters.city) ? 'Filtered Patient Details' : 'All Patient Details'}</TranslatedText>
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  <TranslatedText>Showing {analyticsData.patientCount} patients</TranslatedText>
                  {(filters.state || filters.district || filters.city) && (
                    <span>
                      {' '}<TranslatedText>in</TranslatedText>{' '}
                      {filters.state && filters.state}
                      {filters.district && ` > ${filters.district}`}
                      {filters.city && ` > ${filters.city}`}
                    </span>
                  )}
                </p>
              </div>
              
              {analyticsData.patientCount === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    <TranslatedText>No patients found</TranslatedText>
                  </h3>
                  <p className="text-gray-600">
                    <TranslatedText>No patients match the selected filter criteria. Try adjusting your filters.</TranslatedText>
                  </p>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            <TranslatedText>States in Results</TranslatedText>
                          </p>
                          <p className="text-2xl font-bold text-blue-700">
                            {analyticsData.filteredLocations?.states || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-900">
                            <TranslatedText>Districts in Results</TranslatedText>
                          </p>
                          <p className="text-2xl font-bold text-green-700">
                            {analyticsData.filteredLocations?.districts || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-900">
                            <TranslatedText>Cities in Results</TranslatedText>
                          </p>
                          <p className="text-2xl font-bold text-purple-700">
                            {analyticsData.filteredLocations?.cities || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  {(filters.state || filters.district || filters.city) && (
                    <div className="mt-6 text-center">
                      <button
                        onClick={() => setFilters({ state: '', district: '', city: '' })}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors duration-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <TranslatedText>Clear All Filters</TranslatedText>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default GovernmentAnalytics
