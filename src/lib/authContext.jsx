import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          setError(sessionError.message)
        } else {
          setUser(session?.user ?? null)
        }
      } catch (err) {
        console.error('Error getting session:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
            setUser(session?.user ?? null)
            setError(null)
          } catch (err) {
            console.error('Auth state change error:', err)
            setError(err.message)
          } finally {
            setLoading(false)
          }
        }
      )

      return () => subscription.unsubscribe()
    } catch (err) {
      console.error('Error setting up auth listener:', err)
      setError(err.message)
      setLoading(false)
    }
  }, [])

  const signUp = async (email, password, userData = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      })
      return { data, error }
    } catch (err) {
      console.error('Sign up error:', err)
      return { data: null, error: err }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { data, error }
    } catch (err) {
      console.error('Sign in error:', err)
      return { data: null, error: err }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (err) {
      console.error('Sign out error:', err)
      return { error: err }
    }
  }

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut
  }

  // If there's an error, show it but don't crash the app
  if (error && !loading) {
    console.error('Auth context error:', error)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
