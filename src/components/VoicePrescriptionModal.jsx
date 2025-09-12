import React, { useState, useRef, useEffect } from 'react';
import { analyzePrescriptionWithGemini, retryPrescriptionAnalysis } from '../utils/geminiApi';

const VoicePrescriptionModal = ({ 
  isOpen, 
  onClose, 
  patient, 
  onPrescriptionsGenerated,
  treatmentFormData = null
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Only update with final transcript to avoid duplication
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript + ' ');
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    setError('');
    setTranscript('');
    setAnalysisResult(null);
    setRecordingTime(0);
    setIsRecording(true);

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const analyzePrescriptionWithAI = async (retryMode = false) => {
    if (!transcript.trim()) {
      setError('No transcript available to analyze');
      return;
    }

    // Check if API key is available
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      setError('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      let result;
      if (retryMode && analysisResult) {
        result = await retryPrescriptionAnalysis(transcript, patient, analysisResult);
      } else {
        result = await analyzePrescriptionWithGemini(transcript, patient, treatmentFormData);
      }
      
      setAnalysisResult(result);
    } catch (err) {
      console.error('Analysis error:', err);
      
      // Provide more specific error messages
      if (err.message.includes('404')) {
        setError('API endpoint not found. Please check your Gemini API key and try again.');
      } else if (err.message.includes('403')) {
        setError('API access denied. Please verify your Gemini API key is valid and has proper permissions.');
      } else if (err.message.includes('429')) {
        setError('API rate limit exceeded. Please wait a moment and try again.');
      } else {
        setError(err.message || 'Failed to analyze prescription. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApproveAll = () => {
    if (!analysisResult || !analysisResult.prescriptions) return;
    
    // Convert analysis result to prescription format
    const prescriptions = analysisResult.prescriptions.map((prescription, index) => ({
      id: Date.now() + index,
      medicineName: prescription.medicineName || '',
      dose: prescription.dose || '',
      quantity: prescription.quantity || '',
      frequency: Array.isArray(prescription.frequency) ? prescription.frequency : []
    }));

    onPrescriptionsGenerated(prescriptions, analysisResult);
    onClose();
  };

  const handleEdit = () => {
    if (!analysisResult || !analysisResult.prescriptions) return;
    
    // Convert analysis result to editable prescription format
    const prescriptions = analysisResult.prescriptions.map((prescription, index) => ({
      id: Date.now() + index,
      medicineName: prescription.medicineName || '',
      dose: prescription.dose || '',
      quantity: prescription.quantity || '',
      frequency: Array.isArray(prescription.frequency) ? prescription.frequency : [],
      suitability: prescription.suitability,
      reasoning: prescription.reasoning
    }));

    onPrescriptionsGenerated(prescriptions, analysisResult, true); // true indicates edit mode
    onClose();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSuitabilityColor = (suitability) => {
    switch (suitability) {
      case 'suitable': return 'text-green-600 bg-green-50 border-green-200';
      case 'caution': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'unsuitable': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'needs_review': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Voice Prescription</h2>
                <p className="text-sm text-gray-600">Record prescription and get AI analysis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(95vh-140px)] overflow-y-auto p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          )}

          {/* Recording Section */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 mb-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isAnalyzing}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  } text-white shadow-lg hover:shadow-xl disabled:opacity-50`}
                >
                  {isRecording ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  )}
                </button>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isRecording ? 'Recording...' : 'Start Recording'}
              </h3>
              
              {isRecording && (
                <p className="text-purple-600 font-mono text-xl mb-2">
                  {formatTime(recordingTime)}
                </p>
              )}
              
              <p className="text-gray-600 text-sm">
                {isRecording 
                  ? 'Speak clearly about the prescription. Click the button again to stop.'
                  : 'Click the microphone to start recording your prescription'
                }
              </p>
            </div>
          </div>

          {/* Transcript Section */}
          {transcript && (
            <div className="bg-blue-50 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Voice Transcript
              </h3>
              <div className="bg-white rounded-xl p-4 border border-blue-200">
                <p className="text-gray-800 whitespace-pre-wrap">{transcript}</p>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => analyzePrescriptionWithAI(false)}
                  disabled={isAnalyzing || !transcript.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 flex items-center"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Analyze with AI
                    </>
                  )}
                </button>
                <button
                  onClick={() => setTranscript('')}
                  disabled={isAnalyzing}
                  className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <div className="bg-green-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI Analysis Results
              </h3>

              {/* Critical Alerts */}
              {analysisResult.overallAssessment?.criticalAlerts?.length > 0 && (
                <div className="bg-red-100 border border-red-300 rounded-xl p-4 mb-4">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Critical Alerts
                  </h4>
                  <ul className="text-sm list-disc list-inside space-y-1 text-red-700">
                    {analysisResult.overallAssessment.criticalAlerts.map((alert, index) => (
                      <li key={index}>{alert}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Treatment Analysis */}
              {analysisResult.treatmentAnalysis && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Treatment Suitability Analysis</h4>
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-medium text-blue-700">Suitability: </span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                      analysisResult.treatmentAnalysis.treatmentSuitability === 'excellent' ? 'bg-green-100 text-green-700' :
                      analysisResult.treatmentAnalysis.treatmentSuitability === 'good' ? 'bg-blue-100 text-blue-700' :
                      analysisResult.treatmentAnalysis.treatmentSuitability === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {analysisResult.treatmentAnalysis.treatmentSuitability?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">{analysisResult.treatmentAnalysis.treatmentSuitabilityReason}</p>
                  
                  {analysisResult.treatmentAnalysis.alternativeSuggestions?.length > 0 && (
                    <div className="mt-2">
                      <h5 className="font-medium text-blue-800 mb-1">Alternative Suggestions:</h5>
                      <ul className="text-sm list-disc list-inside space-y-1 text-blue-700">
                        {analysisResult.treatmentAnalysis.alternativeSuggestions.map((alt, index) => (
                          <li key={index}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Drug Interactions */}
              {(analysisResult.drugInteractions?.withOngoingTreatments?.length > 0 || 
                analysisResult.drugInteractions?.withExistingPrescriptions?.length > 0) && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                  <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Drug Interactions
                  </h4>
                  
                  {analysisResult.drugInteractions.withOngoingTreatments?.map((interaction, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 mb-2 border border-orange-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-orange-900">
                          {interaction.newMedicine} ↔ {interaction.existingMedicine}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          interaction.interactionLevel === 'severe' ? 'bg-red-100 text-red-700' :
                          interaction.interactionLevel === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {interaction.interactionLevel?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-orange-700 mb-1">{interaction.description}</p>
                      <p className="text-sm font-medium text-orange-800">Recommendation: {interaction.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Side Effects */}
              {analysisResult.sideEffects && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                  <h4 className="font-semibold text-purple-800 mb-3">Side Effects Analysis</h4>
                  
                  {analysisResult.sideEffects.individual?.map((medicine, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 mb-2 border border-purple-200">
                      <h5 className="font-medium text-purple-900 mb-2">{medicine.medicineName}</h5>
                      
                      {medicine.commonSideEffects?.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-purple-700">Common: </span>
                          <span className="text-sm text-purple-600">{medicine.commonSideEffects.join(', ')}</span>
                        </div>
                      )}
                      
                      {medicine.seriousSideEffects?.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-red-700">Serious: </span>
                          <span className="text-sm text-red-600">{medicine.seriousSideEffects.join(', ')}</span>
                        </div>
                      )}
                      
                      {medicine.patientSpecificRisks?.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-orange-700">Patient-specific risks: </span>
                          <span className="text-sm text-orange-600">{medicine.patientSpecificRisks.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {analysisResult.sideEffects.combined && (
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <h5 className="font-medium text-purple-900 mb-2">Combined Effects</h5>
                      <div className="flex items-center mb-2">
                        <span className="text-sm font-medium text-purple-700">Risk Level: </span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                          analysisResult.sideEffects.combined.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                          analysisResult.sideEffects.combined.riskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {analysisResult.sideEffects.combined.riskLevel?.toUpperCase()}
                        </span>
                      </div>
                      
                      {analysisResult.sideEffects.combined.potentialCombinedEffects?.length > 0 && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-purple-700">Potential effects: </span>
                          <span className="text-sm text-purple-600">{analysisResult.sideEffects.combined.potentialCombinedEffects.join(', ')}</span>
                        </div>
                      )}
                      
                      {analysisResult.sideEffects.combined.monitoringRequired?.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-blue-700">Monitoring required: </span>
                          <span className="text-sm text-blue-600">{analysisResult.sideEffects.combined.monitoringRequired.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Overall Assessment */}
              <div className={`rounded-xl p-4 mb-4 border ${getStatusColor(analysisResult.overallAssessment?.status)}`}>
                <h4 className="font-semibold mb-2">Overall Assessment: {analysisResult.overallAssessment?.status?.toUpperCase()}</h4>
                <p className="text-sm mb-2">{analysisResult.overallAssessment?.summary}</p>
                
                {analysisResult.overallAssessment?.recommendations?.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-medium mb-1">Recommendations:</h5>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      {analysisResult.overallAssessment.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.overallAssessment?.warnings?.length > 0 && (
                  <div className="mt-3">
                    <h5 className="font-medium mb-1 text-red-600">Warnings:</h5>
                    <ul className="text-sm list-disc list-inside space-y-1 text-red-600">
                      {analysisResult.overallAssessment.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Prescriptions */}
              <div className="space-y-3 mb-6">
                {analysisResult.prescriptions?.map((prescription, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 border border-green-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{prescription.medicineName}</h4>
                        <p className="text-sm text-gray-600">
                          {prescription.dose} • {prescription.quantity}
                        </p>
                        {prescription.frequency?.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {prescription.frequency.map((freq) => (
                              <span key={freq} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-lg">
                                {freq}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getSuitabilityColor(prescription.suitability)}`}>
                        {prescription.suitability}
                      </span>
                    </div>
                    {prescription.reasoning && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                        {prescription.reasoning}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleApproveAll}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approve All
                </button>
                <button
                  onClick={handleEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => analyzePrescriptionWithAI(true)}
                  disabled={isAnalyzing}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoicePrescriptionModal;
