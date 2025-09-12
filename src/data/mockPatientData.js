// Mock patient data for doctor dashboard
export const mockPatientData = {
  "123456789012": {
    aadhar: "123456789012",
    name: "Ravi Sharma",
    age: 42,
    gender: "Male",
    contact: "+91-9876543210",
    bloodGroup: "B+",
    ongoingTreatment: [
      "Diabetes - Insulin Therapy",
      "Hypertension - ACE Inhibitors"
    ],
    pastTreatment: [
      "Hypertension - 2022",
      "Minor Surgery - Appendectomy - 2020"
    ],
    labReports: [
      "Blood Test - Normal (Dec 2024)",
      "X-Ray - Clear (Nov 2024)",
      "HbA1c - 7.2% (Oct 2024)"
    ],
    prescriptions: [
      "Metformin 500mg - Twice daily",
      "Atorvastatin 10mg - Once daily",
      "Lisinopril 5mg - Once daily"
    ]
  },
  "987654321098": {
    aadhar: "987654321098",
    name: "Priya Patel",
    age: 28,
    gender: "Female",
    contact: "+91-8765432109",
    bloodGroup: "A+",
    ongoingTreatment: [
      "Pregnancy Care - Second Trimester"
    ],
    pastTreatment: [
      "Migraine Treatment - 2023"
    ],
    labReports: [
      "Prenatal Screening - Normal (Dec 2024)",
      "Blood Test - Normal (Nov 2024)"
    ],
    prescriptions: [
      "Folic Acid 5mg - Once daily",
      "Iron Tablets - Twice daily",
      "Calcium Supplements - Once daily"
    ]
  },
  "456789123456": {
    aadhar: "456789123456",
    name: "Amit Kumar",
    age: 65,
    gender: "Male",
    contact: "+91-7654321098",
    bloodGroup: "O-",
    ongoingTreatment: [
      "Cardiac Rehabilitation",
      "Diabetes Management"
    ],
    pastTreatment: [
      "Coronary Angioplasty - 2023",
      "Cataract Surgery - 2022"
    ],
    labReports: [
      "ECG - Stable (Dec 2024)",
      "Lipid Profile - Improved (Nov 2024)",
      "Blood Sugar - Controlled (Dec 2024)"
    ],
    prescriptions: [
      "Aspirin 75mg - Once daily",
      "Metformin 1000mg - Twice daily",
      "Atorvastatin 20mg - Once daily",
      "Metoprolol 25mg - Twice daily"
    ]
  },
  "789012345678": {
    aadhar: "789012345678",
    name: "Sunita Devi",
    age: 55,
    gender: "Female",
    contact: "+91-6543210987",
    bloodGroup: "AB+",
    ongoingTreatment: [
      "Thyroid Management",
      "Osteoporosis Treatment"
    ],
    pastTreatment: [
      "Gallbladder Surgery - 2021",
      "Fracture Treatment - 2020"
    ],
    labReports: [
      "Thyroid Function - Normal (Dec 2024)",
      "Bone Density - Improved (Nov 2024)",
      "Vitamin D - Adequate (Oct 2024)"
    ],
    prescriptions: [
      "Levothyroxine 50mcg - Once daily",
      "Calcium Carbonate 500mg - Twice daily",
      "Vitamin D3 1000IU - Once daily"
    ]
  },
  "234567890123": {
    aadhar: "234567890123",
    name: "Rajesh Gupta",
    age: 38,
    gender: "Male",
    contact: "+91-5432109876",
    bloodGroup: "B-",
    ongoingTreatment: [
      "Asthma Management",
      "Allergy Treatment"
    ],
    pastTreatment: [
      "Pneumonia - 2023",
      "Bronchitis - 2022"
    ],
    labReports: [
      "Pulmonary Function - Stable (Dec 2024)",
      "Allergy Panel - Positive (Nov 2024)",
      "Chest X-ray - Clear (Oct 2024)"
    ],
    prescriptions: [
      "Salbutamol Inhaler - As needed",
      "Montelukast 10mg - Once daily",
      "Cetirizine 10mg - Once daily"
    ]
  }
};

export const getPatientByAadhar = (aadharNumber) => {
  return mockPatientData[aadharNumber] || null;
};
