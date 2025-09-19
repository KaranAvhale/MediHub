import React from 'react'
import TranslatedText from './TranslatedText'

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-gray-600">
            <TranslatedText>© 2025 MediHub. All rights reserved.</TranslatedText>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

