// Gemini Pro API integration for prescription analysis
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// Available Gemini models in order of preference (including 2.5 models)
const GEMINI_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-exp-1206', 
  'gemini-2.0-flash-thinking-exp-1219',
  'gemini-1.5-pro-002',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-pro'
];

// Retry with exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      console.log(`Retry ${i + 1} after ${delay}ms delay...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Try multiple models with fallback using direct API calls
const tryMultipleModels = async (prompt) => {
  let lastError = null;
  
  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`Trying model: ${modelName}`);
      
      const result = await retryWithBackoff(async () => {
        const response = await fetch(`${GEMINI_API_URL}/${modelName}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH", 
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE"
              }
            ]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} ${response.statusText}. ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          throw new Error('Invalid response from Gemini API');
        }

        return data.candidates[0].content.parts[0].text;
      });
      
      console.log(`Success with model: ${modelName}`);
      return result;
    } catch (error) {
      console.log(`Model ${modelName} failed:`, error.message);
      lastError = error;
      
      // If it's a 503 (overloaded) or rate limit, try next model
      if (error.message.includes('503') || 
          error.message.includes('overloaded') || 
          error.message.includes('rate limit') ||
          error.message.includes('429') ||
          error.message.includes('UNAVAILABLE')) {
        continue;
      }
      
      // For other errors, still try next model but with shorter delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  throw new Error(`All Gemini models failed. Last error: ${lastError?.message || 'Unknown error'}`);
};

export const analyzePrescriptionWithGemini = async (transcript, patientInfo, treatmentFormData = null) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not found. Please add VITE_GEMINI_API_KEY to your environment variables.');
  }

  // Extract detailed ongoing treatments with medications
  const ongoingTreatmentsDetails = patientInfo.ongoing_treatments ? 
    patientInfo.ongoing_treatments.map(treatment => {
      const medications = treatment.prescriptions ? 
        treatment.prescriptions.map(med => `${med.medicineName} ${med.dose} (${med.frequency ? med.frequency.join(', ') : 'frequency not specified'})`).join('; ') 
        : 'No medications specified';
      return `Treatment: ${treatment.treatmentName || treatment.name} | Medications: ${medications} | Started: ${treatment.startDate || 'Date not specified'}`;
    }).join('\n') : 'None';

  // Extract past treatments with medications
  const pastTreatmentsDetails = patientInfo.past_treatments ? 
    patientInfo.past_treatments.map(treatment => {
      const medications = treatment.prescriptions ? 
        treatment.prescriptions.map(med => `${med.medicineName} ${med.dose}`).join('; ') 
        : 'No medications specified';
      return `Treatment: ${treatment.treatmentName || treatment.name} | Medications: ${medications} | Completed: ${treatment.completedDate || 'Date not specified'}`;
    }).join('\n') : 'None';

  const prompt = `
As a medical AI assistant, analyze the following voice prescription and comprehensive patient information to determine if the prescribed medications are suitable for the patient and the specific treatment context.

VOICE PRESCRIPTION TRANSCRIPT:
"${transcript}"

COMPREHENSIVE PATIENT INFORMATION:
- Name: ${patientInfo.name}
- Age: ${patientInfo.age} years
- Gender: ${patientInfo.gender}
- Blood Group: ${patientInfo.bloodGroup}
- Medical History: ${patientInfo.medicalHistory ? patientInfo.medicalHistory.join(', ') : 'None available'}

CURRENT TREATMENT CONTEXT:
${treatmentFormData ? `
- Treatment Name: ${treatmentFormData.treatmentName || 'Not specified'}
- Treatment Description: ${treatmentFormData.description || 'Not specified'}
- Treatment Start Date: ${treatmentFormData.startDate || 'Not specified'}
- Treatment Notes: ${treatmentFormData.notes || 'None'}
- Existing Prescriptions in Form: ${treatmentFormData.prescriptions && treatmentFormData.prescriptions.length > 0 ? 
  treatmentFormData.prescriptions.map(p => `${p.medicineName} ${p.dose} (${p.frequency ? p.frequency.join(', ') : 'frequency not specified'})`).join('; ') 
  : 'None'}
` : 'No current treatment context provided'}

ONGOING TREATMENTS WITH MEDICATIONS:
${ongoingTreatmentsDetails}

PAST TREATMENTS WITH MEDICATIONS:
${pastTreatmentsDetails}

Please provide your analysis in the following JSON format:
{
  "prescriptions": [
    {
      "medicineName": "extracted medicine name",
      "dose": "extracted dosage",
      "quantity": "extracted quantity",
      "frequency": ["morning", "afternoon", "evening", "night"],
      "suitability": "suitable|caution|unsuitable",
      "reasoning": "explanation for suitability assessment",
      "treatmentRelevance": "highly_relevant|moderately_relevant|questionable",
      "treatmentRelevanceReason": "why this medicine is/isn't suitable for the specific treatment condition"
    }
  ],
  "drugInteractions": {
    "withOngoingTreatments": [
      {
        "newMedicine": "medicine name from voice prescription",
        "existingMedicine": "medicine from ongoing treatment",
        "interactionLevel": "severe|moderate|mild|none",
        "description": "detailed interaction description",
        "recommendation": "specific action to take"
      }
    ],
    "withExistingPrescriptions": [
      {
        "medicine1": "first medicine",
        "medicine2": "second medicine", 
        "interactionLevel": "severe|moderate|mild|none",
        "description": "interaction details",
        "recommendation": "action needed"
      }
    ]
  },
  "sideEffects": {
    "individual": [
      {
        "medicineName": "medicine name",
        "commonSideEffects": ["side effect 1", "side effect 2"],
        "seriousSideEffects": ["serious effect 1", "serious effect 2"],
        "patientSpecificRisks": ["risk based on age/gender/history"]
      }
    ],
    "combined": {
      "potentialCombinedEffects": ["effect when medicines taken together"],
      "monitoringRequired": ["what to monitor", "how often"],
      "riskLevel": "low|moderate|high"
    }
  },
  "treatmentAnalysis": {
    "treatmentSuitability": "excellent|good|fair|poor",
    "treatmentSuitabilityReason": "why these medicines are suitable/unsuitable for the specific treatment",
    "alternativeSuggestions": ["alternative medicine 1", "alternative medicine 2"],
    "dosageOptimization": ["dosage adjustment suggestion 1", "suggestion 2"]
  },
  "overallAssessment": {
    "status": "approved|needs_review|rejected",
    "summary": "comprehensive assessment summary including treatment context",
    "recommendations": ["recommendation 1", "recommendation 2"],
    "warnings": ["warning 1", "warning 2"],
    "criticalAlerts": ["critical alert 1", "critical alert 2"]
  },
  "extractedText": "cleaned and structured prescription text"
}

CRITICAL ANALYSIS REQUIREMENTS:
1. Extract medicine names, dosages, quantities, and frequencies from voice transcript
2. Analyze each medicine's suitability for the SPECIFIC TREATMENT CONDITION mentioned
3. Check for drug interactions with ALL ongoing treatment medications
4. Identify potential side effects when combining with existing medications
5. Consider patient age, gender, medical history for personalized risk assessment
6. Provide treatment-specific recommendations and alternatives
7. Flag any critical drug interactions or contraindications
8. Assess if the prescribed medicines align with the treatment goals

INTERACTION ANALYSIS PRIORITY:
- Severe interactions: Contraindicated combinations
- Moderate interactions: Require monitoring or dose adjustment  
- Mild interactions: Minor effects, usually manageable
- Consider timing of administration to minimize interactions

If the voice transcript is unclear or incomplete, indicate this in your response with specific suggestions for clarification.
`;

  try {
    console.log('Starting multi-model Gemini analysis...');
    
    const responseText = await tryMultipleModels(prompt);
    
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Gemini response');
    }

    const analysisResult = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!analysisResult.prescriptions || !analysisResult.overallAssessment) {
      throw new Error('Invalid analysis result structure');
    }

    return analysisResult;
  } catch (error) {
    console.error('Error analyzing prescription:', error);
    throw error;
  }
};

export const retryPrescriptionAnalysis = async (transcript, patientInfo, previousAnalysis, treatmentFormData = null) => {
  const prompt = `
Please re-analyze this voice prescription with more focus on accuracy and completeness.

PREVIOUS ANALYSIS HAD ISSUES - Please provide a better analysis.

VOICE PRESCRIPTION TRANSCRIPT:
"${transcript}"

PATIENT INFORMATION:
- Name: ${patientInfo.name}
- Age: ${patientInfo.age} years
- Gender: ${patientInfo.gender}
- Blood Group: ${patientInfo.bloodGroup}
- Medical History: ${patientInfo.medicalHistory ? patientInfo.medicalHistory.join(', ') : 'None available'}
- Current Treatments: ${patientInfo.ongoing_treatments ? patientInfo.ongoing_treatments.map(t => t.treatmentName || t.name).join(', ') : 'None'}

${previousAnalysis ? `PREVIOUS ANALYSIS FOR REFERENCE:
${JSON.stringify(previousAnalysis, null, 2)}` : ''}

Please provide a more accurate analysis in the same JSON format as before, paying special attention to:
1. More precise medicine name extraction
2. Clearer dosage and frequency interpretation
3. More thorough safety assessment
4. Better structured recommendations
`;

  try {
    console.log('Retrying prescription analysis with multiple models...');
    const responseText = await tryMultipleModels(prompt);
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from retry response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error in retry analysis:', error);
    throw error;
  }
};

// Generate patient summary with AI analysis
export const generatePatientSummary = async (patientInfo) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not found. Please add VITE_GEMINI_API_KEY to your environment variables.');
  }

  // Extract detailed ongoing treatments
  const ongoingTreatmentsDetails = patientInfo.ongoing_treatments ? 
    patientInfo.ongoing_treatments.map(treatment => {
      const medications = treatment.prescriptions ? 
        treatment.prescriptions.map(med => `${med.medicineName} ${med.dose} (${med.frequency ? med.frequency.join(', ') : 'frequency not specified'})`).join('; ') 
        : 'No medications specified';
      return `Treatment: ${treatment.treatmentName || treatment.name} | Medications: ${medications} | Started: ${treatment.startDate || 'Date not specified'} | Description: ${treatment.description || 'No description'}`;
    }).join('\n') : 'None';

  // Extract past treatments
  const pastTreatmentsDetails = patientInfo.past_treatments ? 
    patientInfo.past_treatments.map(treatment => {
      const medications = treatment.prescriptions ? 
        treatment.prescriptions.map(med => `${med.medicineName} ${med.dose}`).join('; ') 
        : 'No medications specified';
      return `Treatment: ${treatment.treatmentName || treatment.name} | Medications: ${medications} | Started: ${treatment.startDate || 'Date not specified'} | Completed: ${treatment.completedDate || 'Date not specified'} | Description: ${treatment.description || 'No description'}`;
    }).join('\n') : 'None';

  // Extract vaccinations
  const vaccinationsDetails = patientInfo.patient_vaccinations ?
    patientInfo.patient_vaccinations.map(vac => `${vac.vaccine_name || vac.name} on ${vac.vaccination_date || vac.date || 'Date not specified'}`).join(', ') : 'None';

  const prompt = `
As a medical AI assistant, analyze the following comprehensive patient information and provide a detailed medical summary focusing on ongoing treatments, major past treatments, and critical health insights.

PATIENT INFORMATION:
- Name: ${patientInfo.name}
- Age: ${patientInfo.age} years
- Gender: ${patientInfo.gender}
- Blood Group: ${patientInfo.bloodGroup}
- Contact: ${patientInfo.contact}
- Address: ${patientInfo.address || 'Not provided'}
- Date of Birth: ${patientInfo.dob || 'Not provided'}
- Medical History: ${patientInfo.medicalHistory ? patientInfo.medicalHistory.join(', ') : 'None available'}

ONGOING TREATMENTS:
${ongoingTreatmentsDetails}

PAST TREATMENTS:
${pastTreatmentsDetails}

VACCINATIONS:
${vaccinationsDetails}

Please provide your analysis in the following JSON format:
{
  "patientOverview": {
    "basicInfo": "concise patient demographics and key identifiers",
    "healthStatus": "current overall health assessment based on available data"
  },
  "ongoingTreatmentsSummary": {
    "totalCount": number,
    "criticalTreatments": ["list of treatments requiring immediate attention"],
    "routineTreatments": ["list of routine/maintenance treatments"],
    "medicationComplexity": "low|moderate|high",
    "potentialConcerns": ["concern 1", "concern 2"],
    "summary": "comprehensive summary of all ongoing treatments"
  },
  "pastTreatmentsInsights": {
    "majorTreatments": [
      {
        "treatmentName": "name",
        "significance": "why this treatment is medically significant",
        "outcome": "treatment outcome assessment",
        "relevanceToCurrentHealth": "how it affects current health status"
      }
    ],
    "treatmentPatterns": "patterns or trends in treatment history",
    "chronicConditions": ["identified chronic conditions from history"],
    "summary": "key insights from treatment history"
  },
  "riskAssessment": {
    "immediateRisks": ["immediate health risks based on current treatments"],
    "longTermRisks": ["potential long-term health risks"],
    "drugInteractionRisks": ["potential drug interaction concerns"],
    "ageGenderSpecificRisks": ["risks specific to patient's age and gender"],
    "overallRiskLevel": "low|moderate|high"
  },
  "recommendations": {
    "monitoringNeeded": ["what should be monitored regularly"],
    "lifestyleRecommendations": ["lifestyle advice based on conditions"],
    "followUpPriorities": ["priority areas for follow-up care"],
    "preventiveCare": ["recommended preventive measures"]
  },
  "criticalAlerts": {
    "urgentConcerns": ["any urgent medical concerns identified"],
    "drugAllergies": ["potential drug allergies to watch for"],
    "contraindications": ["important contraindications"],
    "emergencyInformation": ["critical info for emergency situations"]
  },
  "vaccinationStatus": {
    "upToDate": "assessment of vaccination status",
    "missingVaccinations": ["vaccines that might be needed"],
    "nextDueVaccinations": ["upcoming vaccination needs"]
  }
}

ANALYSIS REQUIREMENTS:
1. Focus on medically significant patterns and insights
2. Identify potential health risks and drug interactions
3. Highlight critical information for emergency situations
4. Provide actionable recommendations for ongoing care
5. Consider age, gender, and medical history in your assessment
6. Flag any concerning treatment combinations or gaps in care
7. Assess vaccination completeness for the patient's age group

If any information is incomplete or unclear, indicate this in your response with specific suggestions for additional data collection.
`;

  try {
    console.log('Generating patient summary with Gemini...');
    const responseText = await tryMultipleModels(prompt);
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Gemini response');
    }

    const summaryResult = JSON.parse(jsonMatch[0]);
    
    if (!summaryResult.patientOverview || !summaryResult.ongoingTreatmentsSummary) {
      throw new Error('Invalid summary result structure');
    }

    return summaryResult;
  } catch (error) {
    console.error('Error generating patient summary:', error);
    throw error;
  }
};

// Answer doctor questions about patient
export const answerPatientQuestion = async (question, patientInfo, conversationHistory = []) => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not found. Please add VITE_GEMINI_API_KEY to your environment variables.');
  }

  // Prepare comprehensive patient context
  const ongoingTreatmentsDetails = patientInfo.ongoing_treatments ? 
    patientInfo.ongoing_treatments.map(treatment => {
      const medications = treatment.prescriptions ? 
        treatment.prescriptions.map(med => `${med.medicineName} ${med.dose} (${med.frequency ? med.frequency.join(', ') : 'frequency not specified'})`).join('; ') 
        : 'No medications specified';
      return `Treatment: ${treatment.treatmentName || treatment.name} | Medications: ${medications} | Started: ${treatment.startDate || 'Date not specified'} | Description: ${treatment.description || 'No description'}`;
    }).join('\n') : 'None';

  const pastTreatmentsDetails = patientInfo.past_treatments ? 
    patientInfo.past_treatments.map(treatment => {
      const medications = treatment.prescriptions ? 
        treatment.prescriptions.map(med => `${med.medicineName} ${med.dose}`).join('; ') 
        : 'No medications specified';
      return `Treatment: ${treatment.treatmentName || treatment.name} | Medications: ${medications} | Started: ${treatment.startDate || 'Date not specified'} | Completed: ${treatment.completedDate || 'Date not specified'}`;
    }).join('\n') : 'None';

  const vaccinationsDetails = patientInfo.patient_vaccinations ?
    patientInfo.patient_vaccinations.map(vac => `${vac.vaccine_name || vac.name} on ${vac.vaccination_date || vac.date || 'Date not specified'}`).join(', ') : 'None';

  const conversationContext = conversationHistory.length > 0 ? 
    conversationHistory.map(msg => `${msg.type === 'question' ? 'Doctor' : 'AI'}: ${msg.content}`).join('\n') : 'No previous conversation';

  const prompt = `
You are an AI medical assistant helping a doctor with patient care. Answer the doctor's question based on the comprehensive patient information provided.

DOCTOR'S QUESTION:
"${question}"

PATIENT INFORMATION:
- Name: ${patientInfo.name}
- Age: ${patientInfo.age} years
- Gender: ${patientInfo.gender}
- Blood Group: ${patientInfo.bloodGroup}
- Medical History: ${patientInfo.medicalHistory ? patientInfo.medicalHistory.join(', ') : 'None available'}

ONGOING TREATMENTS:
${ongoingTreatmentsDetails}

PAST TREATMENTS:
${pastTreatmentsDetails}

VACCINATIONS:
${vaccinationsDetails}

PREVIOUS CONVERSATION:
${conversationContext}

Please provide your response in the following JSON format:
{
  "answer": "comprehensive answer to the doctor's question",
  "relevantData": {
    "treatments": ["relevant treatments mentioned"],
    "medications": ["relevant medications"],
    "conditions": ["relevant medical conditions"],
    "dates": ["relevant dates or timelines"]
  },
  "clinicalInsights": {
    "keyFindings": ["important clinical findings related to the question"],
    "riskFactors": ["relevant risk factors to consider"],
    "recommendations": ["clinical recommendations based on the question"],
    "followUpSuggestions": ["suggested follow-up actions"]
  },
  "additionalConsiderations": {
    "drugInteractions": ["potential drug interactions to consider"],
    "contraindications": ["relevant contraindications"],
    "monitoringNeeds": ["what should be monitored"],
    "patientSpecificFactors": ["age, gender, or condition-specific considerations"]
  },
  "confidence": "high|medium|low",
  "dataLimitations": ["any limitations in available data that affect the answer"],
  "suggestedQuestions": ["follow-up questions the doctor might want to ask"]
}

RESPONSE GUIDELINES:
1. Provide accurate, evidence-based medical information
2. Consider the patient's specific context (age, gender, conditions, treatments)
3. Highlight any concerning patterns or interactions
4. Be clear about limitations in available data
5. Suggest relevant follow-up questions or actions
6. Use professional medical terminology while remaining clear
7. If the question cannot be fully answered with available data, explain what additional information would be helpful

If the question is unclear or requires clarification, ask for more specific information.
`;

  try {
    console.log('Answering patient question with Gemini...');
    const responseText = await tryMultipleModels(prompt);
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Gemini response');
    }

    const answerResult = JSON.parse(jsonMatch[0]);
    
    if (!answerResult.answer) {
      throw new Error('Invalid answer result structure');
    }

    return answerResult;
  } catch (error) {
    console.error('Error answering patient question:', error);
    throw error;
  }
};
