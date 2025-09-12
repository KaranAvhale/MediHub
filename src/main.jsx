import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { AuthProvider } from './lib/authContext'
import ErrorBoundary from './components/ErrorBoundary'
import AppWithRoutes from './App.jsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const AppTree = (
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppWithRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)

const Root = () => {
  if (PUBLISHABLE_KEY) {
    return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        {AppTree}
      </ClerkProvider>
    )
  }
  console.warn('VITE_CLERK_PUBLISHABLE_KEY missing; rendering without ClerkProvider')
  return AppTree
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />)

