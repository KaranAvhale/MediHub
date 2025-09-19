import React, { useState, useEffect, useRef } from 'react'
import { generatePatientSummary, answerPatientQuestion } from '../utils/geminiApi'
import { useTranslation } from '../contexts/TranslationContext'
import { useTranslate } from '../hooks/useTranslate'
import TranslatedText from './TranslatedText'

const PatientAIAssistant = ({ patient }) => {
  const { currentLanguage, isRTL } = useTranslation()
  const { t } = useTranslate()
  
  const [summary, setSummary] = useState(null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [summaryError, setSummaryError] = useState(null)
  const [isStarted, setIsStarted] = useState(false)
  
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false)
  const [chatError, setChatError] = useState(null)
  
  // Voice functionality states
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [currentSpeech, setCurrentSpeech] = useState(null)
  
  const chatEndRef = useRef(null)
  const questionInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const speechSynthesisRef = useRef(null)

  // Auto-scroll chat to bottom within chat container only
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      const chatContainer = chatEndRef.current.closest('.overflow-y-auto')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Check for speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setSpeechSupported(true)
      
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = currentLanguage === 'en' ? 'en-US' : 
                        currentLanguage === 'es' ? 'es-ES' :
                        currentLanguage === 'fr' ? 'fr-FR' :
                        currentLanguage === 'de' ? 'de-DE' :
                        currentLanguage === 'hi' ? 'hi-IN' :
                        currentLanguage === 'zh' ? 'zh-CN' :
                        currentLanguage === 'ja' ? 'ja-JP' :
                        currentLanguage === 'ko' ? 'ko-KR' :
                        currentLanguage === 'ar' ? 'ar-SA' :
                        'en-US'
      
      recognition.onstart = () => {
        setIsListening(true)
        setChatError(null)
      }
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setCurrentQuestion(transcript)
        setIsListening(false)
      }
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        setChatError(`Speech recognition error: ${event.error}`)
      }
      
      recognition.onend = () => {
        setIsListening(false)
      }
      
      recognitionRef.current = recognition
    }
    
    // Check for speech synthesis support
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis
    }
  }, [currentLanguage])

  // Remove automatic summary generation - now requires user to click Start

  const handleStartAIAssistant = () => {
    setIsStarted(true)
    generateAISummary()
  }

  const generateAISummary = async () => {
    if (!patient) return
    
    setIsLoadingSummary(true)
    setSummaryError(null)
    
    try {
      const result = await generatePatientSummary(patient)
      setSummary(result)
    } catch (error) {
      console.error('Error generating AI summary:', error)
      setSummaryError(error.message)
    } finally {
      setIsLoadingSummary(false)
    }
  }

  // Voice input functions
  const startListening = () => {
    if (recognitionRef.current && speechSupported && !isListening) {
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  // Text-to-speech functions
  const speakText = async (text) => {
    if (speechSynthesisRef.current && text) {
      // Stop any current speech
      speechSynthesisRef.current.cancel()
      
      // Translate text if needed
      let textToSpeak = text
      if (currentLanguage !== 'en') {
        try {
          textToSpeak = await t(text)
        } catch (error) {
          console.error('Translation error for speech:', error)
        }
      }
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      // Set language for speech synthesis
      utterance.lang = currentLanguage === 'en' ? 'en-US' : 
                      currentLanguage === 'es' ? 'es-ES' :
                      currentLanguage === 'fr' ? 'fr-FR' :
                      currentLanguage === 'de' ? 'de-DE' :
                      currentLanguage === 'hi' ? 'hi-IN' :
                      currentLanguage === 'zh' ? 'zh-CN' :
                      currentLanguage === 'ja' ? 'ja-JP' :
                      currentLanguage === 'ko' ? 'ko-KR' :
                      currentLanguage === 'ar' ? 'ar-SA' :
                      'en-US'
      
      utterance.onstart = () => {
        setIsSpeaking(true)
        setCurrentSpeech(utterance)
      }
      
      utterance.onend = () => {
        setIsSpeaking(false)
        setCurrentSpeech(null)
      }
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error)
        setIsSpeaking(false)
        setCurrentSpeech(null)
      }
      
      speechSynthesisRef.current.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel()
      setIsSpeaking(false)
      setCurrentSpeech(null)
    }
  }

  const handleAskQuestion = async () => {
    if (!currentQuestion.trim() || isLoadingAnswer) return
    
    const question = currentQuestion.trim()
    setCurrentQuestion('')
    setChatError(null)
    
    // Prevent any page scrolling during chat interaction
    const currentScrollPosition = window.pageYOffset
    
    // Add user question to chat
    const newMessages = [...chatMessages, { 
      type: 'question', 
      content: question, 
      timestamp: new Date().toISOString() 
    }]
    setChatMessages(newMessages)
    setIsLoadingAnswer(true)
    
    // Restore scroll position to prevent unwanted scrolling
    setTimeout(() => {
      window.scrollTo(0, currentScrollPosition)
    }, 0)
    
    try {
      const result = await answerPatientQuestion(question, patient, chatMessages)
      
      // Translate AI response if needed
      let translatedAnswer = result.answer
      if (currentLanguage !== 'en') {
        try {
          translatedAnswer = await t(result.answer)
        } catch (translationError) {
          console.error('Translation error for AI response:', translationError)
        }
      }
      
      // Add AI response to chat
      const aiMessage = {
        type: 'answer',
        content: translatedAnswer,
        originalContent: result.answer,
        data: result,
        timestamp: new Date().toISOString()
      }
      setChatMessages(prev => [...prev, aiMessage])
      
      // Restore scroll position after AI response
      setTimeout(() => {
        window.scrollTo(0, currentScrollPosition)
      }, 100)
      
      // Automatically speak the AI response
      setTimeout(() => {
        speakText(result.answer)
      }, 500)
      
    } catch (error) {
      console.error('Error getting AI answer:', error)
      setChatError(error.message)
      
      // Add error message to chat
      setChatMessages(prev => [...prev, {
        type: 'error',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString()
      }])
      
      // Restore scroll position even on error
      setTimeout(() => {
        window.scrollTo(0, currentScrollPosition)
      }, 100)
    } finally {
      setIsLoadingAnswer(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAskQuestion()
    }
  }

  const formatSummarySection = (title, content, bgColor = "bg-blue-50", textColor = "text-blue-900", borderColor = "border-blue-200") => {
    if (!content) return null
    
    return (
      <div className={`${bgColor} ${borderColor} border rounded-xl p-4 mb-4`}>
        <h4 className={`font-semibold ${textColor} mb-2 flex items-center`}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {title}
        </h4>
        {typeof content === 'string' ? (
          <p className={`${textColor} text-sm`}>{content}</p>
        ) : Array.isArray(content) ? (
          <ul className={`${textColor} text-sm space-y-1`}>
            {content.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="w-2 h-2 bg-current rounded-full mt-2 mr-2 flex-shrink-0 opacity-60"></span>
                {typeof item === 'string' ? item : JSON.stringify(item)}
              </li>
            ))}
          </ul>
        ) : (
          <div className={`${textColor} text-sm`}>
            {Object.entries(content).map(([key, value]) => (
              <div key={key} className="mb-2">
                <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
                {Array.isArray(value) ? value.join(', ') : String(value)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              <TranslatedText>AI Medical Assistant</TranslatedText>
            </h3>
            <p className="text-gray-600">
              <TranslatedText>Intelligent analysis and insights for</TranslatedText> {patient?.name}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowChat(!showChat)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 px-4 rounded-xl font-medium transition-all duration-200 flex items-center shadow-lg hover:shadow-xl"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <TranslatedText>Ask AI</TranslatedText>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* AI Summary Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">
              <TranslatedText>Medical Summary & Insights</TranslatedText>
            </h4>
            <button
              onClick={generateAISummary}
              disabled={isLoadingSummary}
              className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center disabled:opacity-50"
            >
              <svg className={`w-4 h-4 mr-1 ${isLoadingSummary ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isLoadingSummary ? <TranslatedText>Analyzing...</TranslatedText> : <TranslatedText>Refresh</TranslatedText>}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
            {isLoadingSummary && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600">
                  <TranslatedText>Generating AI insights...</TranslatedText>
                </span>
              </div>
            )}

            {summaryError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <svg className="w-8 h-8 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 font-medium">Error generating summary</p>
                <p className="text-red-600 text-sm mt-1">{summaryError}</p>
                <button
                  onClick={generateAISummary}
                  className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {summary && (
              <div className="space-y-4">
                {/* Patient Overview */}
                {summary.patientOverview && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Patient Overview
                    </h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <p><span className="font-medium">Demographics:</span> {summary.patientOverview.basicInfo}</p>
                      <p><span className="font-medium">Health Status:</span> {summary.patientOverview.healthStatus}</p>
                    </div>
                  </div>
                )}

                {/* Ongoing Treatments Summary */}
                {summary.ongoingTreatmentsSummary && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Ongoing Treatments ({summary.ongoingTreatmentsSummary.totalCount || 0})
                    </h4>
                    <div className="space-y-2 text-sm text-green-800">
                      <p><span className="font-medium">Complexity:</span> {summary.ongoingTreatmentsSummary.medicationComplexity}</p>
                      {summary.ongoingTreatmentsSummary.criticalTreatments?.length > 0 && (
                        <div>
                          <span className="font-medium text-red-700">Critical:</span>
                          <ul className="ml-4 mt-1">
                            {summary.ongoingTreatmentsSummary.criticalTreatments.map((treatment, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                                {treatment}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="mt-2">{summary.ongoingTreatmentsSummary.summary}</p>
                    </div>
                  </div>
                )}

                {/* Risk Assessment */}
                {summary.riskAssessment && (
                  <div className={`bg-gradient-to-r rounded-xl p-4 border ${
                    summary.riskAssessment.overallRiskLevel === 'high' ? 'from-red-50 to-pink-50 border-red-200' :
                    summary.riskAssessment.overallRiskLevel === 'moderate' ? 'from-yellow-50 to-orange-50 border-yellow-200' :
                    'from-green-50 to-emerald-50 border-green-200'
                  }`}>
                    <h4 className={`font-semibold mb-3 flex items-center ${
                      summary.riskAssessment.overallRiskLevel === 'high' ? 'text-red-900' :
                      summary.riskAssessment.overallRiskLevel === 'moderate' ? 'text-yellow-900' :
                      'text-green-900'
                    }`}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Risk Assessment - {summary.riskAssessment.overallRiskLevel?.toUpperCase()}
                    </h4>
                    <div className={`space-y-2 text-sm ${
                      summary.riskAssessment.overallRiskLevel === 'high' ? 'text-red-800' :
                      summary.riskAssessment.overallRiskLevel === 'moderate' ? 'text-yellow-800' :
                      'text-green-800'
                    }`}>
                      {summary.riskAssessment.immediateRisks?.length > 0 && (
                        <div>
                          <span className="font-medium">Immediate Risks:</span>
                          <ul className="ml-4 mt-1">
                            {summary.riskAssessment.immediateRisks.map((risk, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="w-1.5 h-1.5 bg-current rounded-full mt-2 mr-2 flex-shrink-0 opacity-60"></span>
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Critical Alerts */}
                {summary.criticalAlerts && (summary.criticalAlerts.urgentConcerns?.length > 0 || summary.criticalAlerts.contraindications?.length > 0) && (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4">
                    <h4 className="font-semibold text-red-900 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Critical Alerts
                    </h4>
                    <div className="space-y-2 text-sm text-red-800">
                      {summary.criticalAlerts.urgentConcerns?.map((concern, idx) => (
                        <div key={idx} className="flex items-start">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {concern}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isStarted && !isLoadingSummary && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">AI Medical Assistant</h4>
                <p className="text-gray-600 mb-6">Get comprehensive AI-powered medical insights and analysis for {patient?.name}</p>
                <button
                  onClick={handleStartAIAssistant}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 px-8 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Start AI Analysis
                </button>
              </div>
            )}

            {!summary && !isLoadingSummary && !summaryError && isStarted && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">AI Analysis Ready</h4>
                <p className="text-gray-600">Click "Refresh" to generate comprehensive medical insights</p>
              </div>
            )}
          </div>
        </div>

        {/* Ask AI Chat Section */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Ask AI About Patient</h4>
          
          {!showChat ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">AI Chat Assistant</h4>
              <p className="text-gray-600 mb-4">Ask questions about this patient's medical history, treatments, or get clinical insights</p>
              <button
                onClick={() => setShowChat(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2 px-6 rounded-xl font-medium transition-all duration-200"
              >
                Start Chat
              </button>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl bg-gray-50 h-96 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">Ask me anything about {patient?.name}'s medical information</p>
                    <div className="mt-4 space-y-2 text-xs text-gray-400">
                      <p>• "What are the current medications?"</p>
                      <p>• "Any drug interactions to watch for?"</p>
                      <p>• "What's the treatment history pattern?"</p>
                    </div>
                  </div>
                )}
                
                {chatMessages.map((message, index) => (
                  <div key={index} className={`flex ${message.type === 'question' ? 'justify-end' : 'justify-start'}`}>
                    {message.type === 'answer' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl p-4 ${
                      message.type === 'question' 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                        : message.type === 'error'
                        ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border border-red-200 shadow-sm'
                        : 'bg-gradient-to-r from-white to-gray-50 text-gray-800 border border-gray-200 shadow-lg'
                    }`}>
                      <div className="flex items-start justify-between">
                        {message.type === 'answer' && (
                          <div className="flex items-start w-full">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                                  AI Assistant
                                </span>
                              </div>
                              <div className="prose prose-sm max-w-none">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 mb-0">{message.content}</p>
                              </div>
                            </div>
                            <div className="flex items-center ml-3 space-x-1 flex-shrink-0">
                              <button
                                onClick={() => speakText(message.content)}
                                disabled={isSpeaking}
                                className="text-gray-400 hover:text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-all duration-200 disabled:opacity-50"
                                title="Listen to response"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M9 9v6l4-3-4-3z" />
                                </svg>
                              </button>
                              {isSpeaking && (
                                <button
                                  onClick={stopSpeaking}
                                  className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                                  title="Stop speaking"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6v6H9z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        {message.type === 'question' && (
                          <p className="text-sm whitespace-pre-wrap flex-1">{message.content}</p>
                        )}
                        {message.type === 'error' && (
                          <div className="flex items-start w-full">
                            <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm whitespace-pre-wrap flex-1">{message.content}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <p className={`text-xs opacity-70 ${
                          message.type === 'question' ? 'text-indigo-100' : 
                          message.type === 'error' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                        {message.type === 'answer' && (
                          <div className="flex items-center text-xs text-gray-400">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Powered by AI
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoadingAnswer && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              {/* Chat Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-2">
                  <input
                    ref={questionInputRef}
                    type="text"
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about patient's condition, treatments, medications..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={isLoadingAnswer || isListening}
                  />
                  
                  {/* Microphone Button */}
                  {speechSupported && (
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={isLoadingAnswer}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                        isListening 
                          ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse' 
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                      }`}
                      title={isListening ? 'Stop listening' : 'Start voice input'}
                    >
                      {isListening ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6v6H9z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={handleAskQuestion}
                    disabled={!currentQuestion.trim() || isLoadingAnswer || isListening}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                
                {/* Voice Status Indicator */}
                {isListening && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                    Listening... Speak your question
                  </div>
                )}
                
                {!speechSupported && (
                  <div className="mt-2 text-xs text-gray-500">
                    Voice input not supported in this browser
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PatientAIAssistant
