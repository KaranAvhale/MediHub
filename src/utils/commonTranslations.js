// Common translations used across the application
export const commonTranslations = {
  // Navigation
  dashboard: "Dashboard",
  signOut: "Sign Out",
  signIn: "Sign In",
  signUp: "Sign Up",
  backToHome: "Back to Home",
  
  // Actions
  save: "Save",
  cancel: "Cancel",
  edit: "Edit",
  delete: "Delete",
  add: "Add",
  update: "Update",
  submit: "Submit",
  close: "Close",
  confirm: "Confirm",
  
  // Status
  loading: "Loading...",
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Information",
  
  // Forms
  name: "Name",
  email: "Email",
  phone: "Phone",
  address: "Address",
  dateOfBirth: "Date of Birth",
  gender: "Gender",
  
  // Medical Terms
  patient: "Patient",
  doctor: "Doctor",
  hospital: "Hospital",
  lab: "Lab",
  prescription: "Prescription",
  medication: "Medication",
  treatment: "Treatment",
  diagnosis: "Diagnosis",
  symptoms: "Symptoms",
  
  // Time
  today: "Today",
  yesterday: "Yesterday",
  tomorrow: "Tomorrow",
  date: "Date",
  time: "Time",
  
  // Messages
  noDataFound: "No data found",
  pleaseWait: "Please wait...",
  tryAgain: "Try Again",
  somethingWentWrong: "Something went wrong",
  
  // Placeholders
  enterName: "Enter name",
  enterEmail: "Enter email",
  enterPhone: "Enter phone number",
  selectDate: "Select date",
  searchPlaceholder: "Search...",
  
  // Validation Messages
  required: "This field is required",
  invalidEmail: "Please enter a valid email",
  invalidPhone: "Please enter a valid phone number",
  
  // Medical Dashboard
  patientRecords: "Patient Records",
  medicalHistory: "Medical History",
  appointments: "Appointments",
  labResults: "Lab Results",
  vaccinations: "Vaccinations",
  
  // Authentication
  welcomeBack: "Welcome Back",
  createAccount: "Create Account",
  forgotPassword: "Forgot Password?",
  rememberMe: "Remember Me",
  
  // Profile
  personalInfo: "Personal Information",
  contactInfo: "Contact Information",
  medicalInfo: "Medical Information",
  emergencyContact: "Emergency Contact",
  
  // Permissions
  accessDenied: "Access Denied",
  unauthorized: "Unauthorized",
  permissionRequired: "Permission Required"
};

// Function to get translation key
export const getTranslationKey = (key) => {
  return commonTranslations[key] || key;
};

// Medical specializations
export const medicalSpecializations = {
  cardiology: "Cardiology",
  dermatology: "Dermatology",
  endocrinology: "Endocrinology",
  gastroenterology: "Gastroenterology",
  neurology: "Neurology",
  oncology: "Oncology",
  orthopedics: "Orthopedics",
  pediatrics: "Pediatrics",
  psychiatry: "Psychiatry",
  radiology: "Radiology",
  surgery: "Surgery",
  urology: "Urology",
  gynecology: "Gynecology",
  ophthalmology: "Ophthalmology",
  ent: "ENT (Ear, Nose, Throat)",
  generalMedicine: "General Medicine",
  familyMedicine: "Family Medicine",
  emergencyMedicine: "Emergency Medicine",
  anesthesiology: "Anesthesiology",
  pathology: "Pathology"
};

// Hospital types
export const hospitalTypes = {
  general: "General Hospital",
  specialty: "Specialty Hospital",
  teaching: "Teaching Hospital",
  research: "Research Hospital",
  rehabilitation: "Rehabilitation Center",
  psychiatric: "Psychiatric Hospital",
  maternity: "Maternity Hospital",
  pediatric: "Pediatric Hospital",
  cardiac: "Cardiac Center",
  cancer: "Cancer Center",
  trauma: "Trauma Center",
  emergency: "Emergency Hospital"
};

// Lab test types
export const labTestTypes = {
  bloodTest: "Blood Test",
  urineTest: "Urine Test",
  xray: "X-Ray",
  mri: "MRI Scan",
  ctScan: "CT Scan",
  ultrasound: "Ultrasound",
  ecg: "ECG/EKG",
  biopsy: "Biopsy",
  pathology: "Pathology Test",
  microbiology: "Microbiology Test",
  biochemistry: "Biochemistry Test",
  hematology: "Hematology Test",
  immunology: "Immunology Test",
  genetics: "Genetic Test"
};

export default commonTranslations;
