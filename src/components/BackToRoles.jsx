import React from 'react'
import { useNavigate } from 'react-router-dom'

const BackToRoles = () => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/roles')
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span>Back to Roles</span>
    </button>
  )
}

export default BackToRoles


