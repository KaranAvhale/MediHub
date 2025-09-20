import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { TranslationProvider } from './contexts/TranslationContext'
import { GovernmentAuthProvider } from './contexts/GovernmentAuthContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import Footer from './components/Footer'
import RoleSelection from './components/RoleSelection'
import PatientAuthPage from './pages/PatientAuthPage'
import DoctorAuthPage from './pages/DoctorAuthPage'
import HospitalAuthPage from './pages/HospitalAuthPage'
import LabAuthPage from './pages/LabAuthPage'
import GovernmentAuthPage from './pages/GovernmentAuthPage'
import DoctorSignInPage from './pages/DoctorSignInPage'
import HospitalSignInPage from './pages/HospitalSignInPage'
import LabSignInPage from './pages/LabSignInPage'
import PatientDashboard from './pages/PatientDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import HospitalDashboard from './pages/HospitalDashboard'
import LabDashboard from './pages/LabDashboard'
import GovernmentDashboard from './pages/GovernmentDashboard'
import DoctorProfileForm from './forms/DoctorProfileForm'
import HospitalProfileForm from './forms/HospitalProfileForm'
import LabProfileForm from './forms/LabProfileForm'

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
      </main>
      <Footer />
    </div>
  )
}

function AppWithRoutes() {
  return (
    <TranslationProvider>
      <GovernmentAuthProvider>
        <Routes>
        <Route path="/" element={<App />} />
        <Route path="/roles" element={<RoleSelection />} />
        <Route path="/auth/patient" element={<PatientAuthPage />} />
        <Route path="/auth/doctor" element={<DoctorAuthPage />} />
        <Route path="/auth/hospital" element={<HospitalAuthPage />} />
        <Route path="/auth/lab" element={<LabAuthPage />} />
        <Route path="/auth/government" element={<GovernmentAuthPage />} />
        <Route path="/auth/doctor/sign-in" element={<DoctorSignInPage />} />
        <Route path="/auth/hospital/sign-in" element={<HospitalSignInPage />} />
        <Route path="/auth/lab/sign-in" element={<LabSignInPage />} />
        <Route path="/profile/doctor" element={<DoctorProfileForm />} />
        <Route path="/profile/hospital" element={<HospitalProfileForm />} />
        <Route path="/profile/lab" element={<LabProfileForm />} />
        <Route path="/dashboard/patient" element={<PatientDashboard />} />
        <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
        <Route path="/dashboard/hospital" element={<HospitalDashboard />} />
        <Route path="/dashboard/lab" element={<LabDashboard />} />
        <Route path="/dashboard/government/*" element={<GovernmentDashboard />} />
        </Routes>
      </GovernmentAuthProvider>
    </TranslationProvider>
  )
}

export default AppWithRoutes
