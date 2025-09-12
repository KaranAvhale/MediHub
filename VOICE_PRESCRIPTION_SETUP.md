# Voice Prescription Feature Setup Guide

## Overview
The Voice Prescription feature allows doctors to dictate prescriptions using voice commands, which are then analyzed by Google's Gemini Pro AI for safety and suitability assessment.

## Features
- 🎤 **Voice-to-Text**: Uses Web Speech API for real-time voice recognition
- 🤖 **AI Analysis**: Gemini Pro analyzes prescriptions for patient suitability
- ✅ **Smart Actions**: Approve All, Edit, or Retry analysis options
- ⚠️ **Safety Checks**: Identifies potential drug interactions and contraindications
- 📝 **Auto-populate**: Automatically fills prescription forms with analyzed data

## Setup Instructions

### 1. Environment Variables
Add your Gemini Pro API key to your `.env` file:

```bash
# Copy the example file
cp env.example .env

# Add your Gemini Pro API key
VITE_GEMINI_API_KEY=your_actual_gemini_pro_api_key_here
```

### 2. Get Gemini Pro API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your `.env` file

### 3. Browser Compatibility
The voice recognition feature requires a modern browser with Web Speech API support:
- ✅ Chrome (recommended)
- ✅ Edge
- ✅ Safari (iOS 14.5+)
- ❌ Firefox (limited support)

## How to Use

### 1. Access Voice Prescription
1. Navigate to Patient Details View
2. Click "Add New" treatment
3. In the Prescriptions section, click "Voice Prescription" button

### 2. Record Prescription
1. Click the microphone button to start recording
2. Speak clearly about the prescription:
   ```
   "Prescribe Amoxicillin 500mg, one tablet three times daily for 7 days.
   Also prescribe Paracetamol 650mg, one tablet twice daily as needed for pain."
   ```
3. Click the microphone again to stop recording

### 3. AI Analysis
1. Click "Analyze with AI" to process the transcript
2. Review the AI analysis results:
   - **Medicine extraction**: Names, dosages, quantities, frequencies
   - **Suitability assessment**: Safe, Caution, or Unsuitable ratings
   - **Recommendations**: AI suggestions for optimization
   - **Warnings**: Potential interactions or contraindications

### 4. Take Action
Choose one of three options:
- **Approve All**: Accept all prescriptions as analyzed
- **Edit**: Add prescriptions to form for manual editing
- **Retry**: Re-analyze with improved AI processing

## Voice Command Examples

### Single Medicine
```
"Prescribe Metformin 500 milligrams, one tablet twice daily with meals"
```

### Multiple Medicines
```
"Prescribe Lisinopril 10mg once daily in the morning, and Amlodipine 5mg once daily in the evening"
```

### Complex Prescription
```
"Give Azithromycin 500mg on day one, then 250mg daily for four more days. 
Also prescribe Prednisolone 20mg twice daily for three days, then reduce to 10mg daily for two days"
```

## AI Analysis Features

### Safety Checks
- Drug interaction detection
- Age-appropriate dosing
- Contraindication identification
- Allergy consideration (based on patient history)

### Smart Extraction
- Medicine name standardization
- Dosage format normalization
- Frequency pattern recognition
- Duration calculation

### Patient Context Analysis
The AI considers:
- Patient age and weight
- Current medications
- Medical history
- Past treatments
- Known allergies

## Troubleshooting

### Voice Recognition Issues
- **No microphone access**: Grant microphone permissions in browser
- **Poor recognition**: Speak clearly and reduce background noise
- **Language issues**: Ensure browser language is set to English

### API Issues
- **Invalid API key**: Verify your Gemini Pro API key in `.env`
- **Rate limiting**: Wait a moment before retrying analysis
- **Network errors**: Check internet connection

### Analysis Problems
- **Unclear transcript**: Use "Retry" for better analysis
- **Missing medicines**: Manually add using "Edit" option
- **Wrong dosages**: Review and correct in edit mode

## Security Notes

### API Key Protection
- Never commit your actual API key to version control
- Use environment variables for API keys
- Rotate API keys regularly for security

### Patient Data Privacy
- Voice data is processed locally using Web Speech API
- Only transcript text is sent to Gemini Pro API
- No audio recordings are stored or transmitted
- Patient data is anonymized in API requests

## Browser Permissions

### Required Permissions
- **Microphone access**: For voice recording
- **HTTPS connection**: Required for Web Speech API

### Permission Setup
1. Browser will prompt for microphone access on first use
2. Click "Allow" to enable voice recording
3. Permissions can be managed in browser settings

## Development Notes

### File Structure
```
src/
├── components/
│   ├── VoicePrescriptionModal.jsx  # Main voice prescription component
│   └── TreatmentModal.jsx          # Updated with voice integration
└── utils/
    └── geminiApi.js                # Gemini Pro API integration
```

### Key Components
- **VoicePrescriptionModal**: Handles voice recording and AI analysis
- **geminiApi.js**: Manages Gemini Pro API communication
- **TreatmentModal**: Integrated with voice prescription feature

### Customization
The AI prompt can be customized in `src/utils/geminiApi.js` to:
- Adjust analysis criteria
- Modify output format
- Add specific medical guidelines
- Include hospital-specific protocols

## Support
For technical issues or feature requests, please contact the development team.
