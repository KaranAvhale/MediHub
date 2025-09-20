import React, { createContext, useContext, useState, useEffect } from 'react'

const GovernmentAuthContext = createContext()

export const useGovernmentAuth = () => {
  const context = useContext(GovernmentAuthContext)
  if (!context) {
    throw new Error('useGovernmentAuth must be used within a GovernmentAuthProvider')
  }
  return context
}

export const GovernmentAuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if user is already authenticated on mount
  useEffect(() => {
    const authStatus = localStorage.getItem('government_auth')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = (username, password) => {
    // Simple authentication - username: "gov", password: "123"
    if (username === 'gov' && password === '123') {
      setIsAuthenticated(true)
      localStorage.setItem('government_auth', 'true')
      return { success: true }
    } else {
      return { success: false, error: 'Invalid credentials' }
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('government_auth')
  }

  const value = {
    isAuthenticated,
    loading,
    login,
    logout
  }

  return (
    <GovernmentAuthContext.Provider value={value}>
      {children}
    </GovernmentAuthContext.Provider>
  )
}

export default GovernmentAuthContext
