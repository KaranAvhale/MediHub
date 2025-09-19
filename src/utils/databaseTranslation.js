import { useTranslate } from '../hooks/useTranslate';

// Hook for translating database content
export const useDatabaseTranslation = () => {
  const { t, tBatch } = useTranslate();

  // Translate medical terms commonly found in database
  const translateMedicalTerm = async (term) => {
    if (!term) return term;
    
    // Common medical terms that should be translated
    const medicalTerms = {
      // Blood groups
      'A+': 'A Positive',
      'A-': 'A Negative', 
      'B+': 'B Positive',
      'B-': 'B Negative',
      'AB+': 'AB Positive',
      'AB-': 'AB Negative',
      'O+': 'O Positive',
      'O-': 'O Negative',
      
      // Gender
      'Male': 'Male',
      'Female': 'Female',
      'Other': 'Other',
      
      // Common medical conditions
      'Diabetes': 'Diabetes',
      'Hypertension': 'Hypertension',
      'Asthma': 'Asthma',
      'Heart Disease': 'Heart Disease',
      'Cancer': 'Cancer',
      'Arthritis': 'Arthritis',
      
      // Treatment types
      'Medication': 'Medication',
      'Surgery': 'Surgery',
      'Therapy': 'Therapy',
      'Consultation': 'Consultation',
      'Follow-up': 'Follow-up',
      'Emergency': 'Emergency',
      
      // Vaccination names
      'COVID-19': 'COVID-19 Vaccine',
      'Influenza': 'Influenza Vaccine',
      'Hepatitis B': 'Hepatitis B Vaccine',
      'MMR': 'MMR Vaccine',
      'Polio': 'Polio Vaccine',
      'DPT': 'DPT Vaccine',
      
      // Hospital departments
      'Cardiology': 'Cardiology',
      'Neurology': 'Neurology',
      'Orthopedics': 'Orthopedics',
      'Pediatrics': 'Pediatrics',
      'Gynecology': 'Gynecology',
      'Emergency': 'Emergency Department',
      'ICU': 'Intensive Care Unit',
      
      // Test types
      'Blood Test': 'Blood Test',
      'X-Ray': 'X-Ray',
      'MRI': 'MRI Scan',
      'CT Scan': 'CT Scan',
      'Ultrasound': 'Ultrasound',
      'ECG': 'ECG/EKG'
    };

    // Check if it's a known medical term
    const standardTerm = medicalTerms[term] || term;
    
    try {
      return await t(standardTerm);
    } catch (error) {
      console.error('Error translating medical term:', error);
      return term; // Return original if translation fails
    }
  };

  // Translate patient data
  const translatePatientData = async (patient) => {
    if (!patient) return patient;

    try {
      const translatedPatient = { ...patient };

      // Translate gender
      if (patient.gender) {
        translatedPatient.translatedGender = await translateMedicalTerm(patient.gender);
      }

      // Translate blood group
      if (patient.bloodGroup) {
        translatedPatient.translatedBloodGroup = await translateMedicalTerm(patient.bloodGroup);
      }

      // Translate medical history
      if (patient.medicalHistory && Array.isArray(patient.medicalHistory)) {
        translatedPatient.translatedMedicalHistory = await Promise.all(
          patient.medicalHistory.map(async (condition) => {
            if (typeof condition === 'string') {
              return await translateMedicalTerm(condition);
            }
            return condition;
          })
        );
      }

      return translatedPatient;
    } catch (error) {
      console.error('Error translating patient data:', error);
      return patient;
    }
  };

  // Translate treatment data
  const translateTreatment = async (treatment) => {
    if (!treatment) return treatment;

    try {
      const translatedTreatment = { ...treatment };

      // Translate treatment name
      if (treatment.treatmentName || treatment.name) {
        const treatmentName = treatment.treatmentName || treatment.name;
        translatedTreatment.translatedName = await translateMedicalTerm(treatmentName);
      }

      // Translate description
      if (treatment.description) {
        translatedTreatment.translatedDescription = await t(treatment.description);
      }

      // Translate medication names
      if (treatment.medications && Array.isArray(treatment.medications)) {
        translatedTreatment.translatedMedications = await Promise.all(
          treatment.medications.map(async (med) => {
            if (typeof med === 'string') {
              return await translateMedicalTerm(med);
            } else if (med.name) {
              return {
                ...med,
                translatedName: await translateMedicalTerm(med.name)
              };
            }
            return med;
          })
        );
      }

      return translatedTreatment;
    } catch (error) {
      console.error('Error translating treatment:', error);
      return treatment;
    }
  };

  // Translate vaccination data
  const translateVaccination = async (vaccination) => {
    if (!vaccination) return vaccination;

    try {
      const translatedVaccination = { ...vaccination };

      // Translate vaccine name
      if (vaccination.vaccineName || vaccination.name) {
        const vaccineName = vaccination.vaccineName || vaccination.name;
        translatedVaccination.translatedName = await translateMedicalTerm(vaccineName);
      }

      // Translate administered by
      if (vaccination.administeredBy) {
        translatedVaccination.translatedAdministeredBy = await t(vaccination.administeredBy);
      }

      return translatedVaccination;
    } catch (error) {
      console.error('Error translating vaccination:', error);
      return vaccination;
    }
  };

  // Batch translate array of items
  const translateBatch = async (items, translateFunction) => {
    if (!Array.isArray(items)) return items;

    try {
      return await Promise.all(items.map(translateFunction));
    } catch (error) {
      console.error('Error in batch translation:', error);
      return items;
    }
  };

  // Translate common UI labels based on data type
  const getTranslatedLabel = async (key, value) => {
    const labelMap = {
      'name': 'Name',
      'age': 'Age',
      'gender': 'Gender', 
      'bloodGroup': 'Blood Group',
      'contact': 'Contact',
      'address': 'Address',
      'dob': 'Date of Birth',
      'aadhar': 'Aadhaar Number',
      'treatmentName': 'Treatment',
      'description': 'Description',
      'startDate': 'Start Date',
      'endDate': 'End Date',
      'followUpDate': 'Follow-up Date',
      'vaccineName': 'Vaccine',
      'vaccinationDate': 'Vaccination Date',
      'nextDue': 'Next Due',
      'batchNumber': 'Batch Number',
      'administeredBy': 'Administered By'
    };

    const label = labelMap[key] || key;
    try {
      return await t(label);
    } catch (error) {
      console.error('Error translating label:', error);
      return label;
    }
  };

  return {
    translateMedicalTerm,
    translatePatientData,
    translateTreatment,
    translateVaccination,
    translateBatch,
    getTranslatedLabel,
    t,
    tBatch
  };
};

// Utility function to format dates with translation
export const useTranslatedDate = () => {
  const { t } = useTranslate();

  const formatDate = async (date, options = {}) => {
    if (!date) return '';

    try {
      const dateObj = new Date(date);
      const formatted = dateObj.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options
      });

      // For now, return the formatted date as-is
      // In future, could translate month names
      return formatted;
    } catch (error) {
      console.error('Error formatting date:', error);
      return date.toString();
    }
  };

  const formatDateTime = async (date) => {
    return await formatDate(date, {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    formatDate,
    formatDateTime
  };
};

export default useDatabaseTranslation;
