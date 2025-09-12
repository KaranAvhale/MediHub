import { useState } from 'react'
import { useClerk, useSignIn, useSignUp } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

export const useClerkAuth = (userType) => {
  const { signIn, signUp } = useClerk()
  const { isLoaded: signInLoaded } = useSignIn()
  const { isLoaded: signUpLoaded } = useSignUp()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignUp = async (formData) => {
    setLoading(true)
    setError('')
    
    try {
      const { username, email, password } = formData
      
      console.log('Attempting sign up with:', { username, email, userType })
      
      const result = await signUp.create({
        username,
        emailAddress: email,
        password,
        unsafeMetadata: {
          userType: userType
        }
      })

      console.log('Sign up result:', result)

      if (result.status === 'complete') {
        // Sign up successful, redirect to dashboard
        navigate(`/dashboard/${userType}`)
      } else if (result.status === 'missing_requirements') {
        // Handle email verification or other requirements
        if (result.verifications?.emailAddress?.status === 'missing_requirements') {
          setError('Please check your email to verify your account before signing in.')
        } else {
          setError('Account created but requires additional verification.')
        }
      } else {
        setError('Sign up completed but status is unclear. Please try signing in.')
      }
    } catch (err) {
      console.error('Sign up error:', err)
      
      // Provide more specific error messages
      if (err.errors && err.errors.length > 0) {
        const errorMessage = err.errors[0].message
        if (errorMessage.includes('username')) {
          setError('Username is already taken. Please choose a different username.')
        } else if (errorMessage.includes('email')) {
          setError('Email address is already registered. Please use a different email or sign in.')
        } else if (errorMessage.includes('password')) {
          setError('Password does not meet requirements. Please use a stronger password.')
        } else {
          setError(errorMessage)
        }
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('An error occurred during sign up. Please check your internet connection and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (formData) => {
    setLoading(true)
    setError('')
    
    try {
      const { identifier, password } = formData
      
      console.log('Attempting sign in with:', { identifier, userType })
      
      const result = await signIn.create({
        identifier,
        password
      })

      console.log('Sign in result:', result)

      if (result.status === 'complete') {
        // Sign in successful, redirect to dashboard
        navigate(`/dashboard/${userType}`)
      } else {
        setError('Sign in completed but status is unclear.')
      }
    } catch (err) {
      console.error('Sign in error:', err)
      
      // Provide more specific error messages
      if (err.errors && err.errors.length > 0) {
        const errorMessage = err.errors[0].message
        if (errorMessage.includes('credentials')) {
          setError('Invalid username/email or password. Please check your credentials.')
        } else if (errorMessage.includes('email')) {
          setError('Please verify your email address before signing in.')
        } else {
          setError(errorMessage)
        }
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('Invalid credentials. Please check your username/email and password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    handleSignUp,
    handleSignIn,
    isLoaded: signInLoaded && signUpLoaded
  }
}
