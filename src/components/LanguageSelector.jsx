import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { useTranslate } from '../hooks/useTranslate';

const LanguageSelector = ({ 
  variant = 'dropdown', // 'dropdown', 'button', 'compact'
  showFlag = true,
  showNativeName = true,
  className = '',
  position = 'bottom-right' // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
}) => {
  const { 
    currentLanguage, 
    changeLanguage, 
    availableLanguages, 
    languageConfig,
    isTranslating,
    autoDetect,
    toggleAutoDetect
  } = useTranslation();
  
  const { t } = useTranslate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter languages based on search term
  const filteredLanguages = availableLanguages.filter(langCode => {
    const config = languageConfig[langCode];
    if (!config) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      config.name.toLowerCase().includes(searchLower) ||
      config.nativeName.toLowerCase().includes(searchLower) ||
      langCode.toLowerCase().includes(searchLower)
    );
  });

  const handleLanguageChange = async (langCode) => {
    await changeLanguage(langCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  const currentLangConfig = languageConfig[currentLanguage];

  // Compact button variant
  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1 px-2 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          title={`Current language: ${currentLangConfig?.name}`}
        >
          {showFlag && <span className="text-lg">{currentLangConfig?.flag}</span>}
          <span className="font-medium">{currentLanguage.toUpperCase()}</span>
          <svg 
            className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div 
            ref={dropdownRef}
            className={`absolute z-50 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg ${
              position.includes('right') ? 'right-0' : 'left-0'
            } ${position.includes('top') ? 'bottom-full mb-1' : 'top-full'}`}
          >
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search languages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredLanguages.map(langCode => {
                const config = languageConfig[langCode];
                return (
                  <button
                    key={langCode}
                    onClick={() => handleLanguageChange(langCode)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 text-sm text-left hover:bg-blue-50 transition-colors ${
                      currentLanguage === langCode ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {showFlag && <span className="text-base">{config.flag}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{config.name}</div>
                      {showNativeName && config.nativeName !== config.name && (
                        <div className="text-xs text-gray-500 truncate">{config.nativeName}</div>
                      )}
                    </div>
                    {currentLanguage === langCode && (
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Auto-detect option */}
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={toggleAutoDetect}
                className="w-full flex items-center justify-between px-2 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
              >
                <span>Auto-detect language</span>
                <div className={`w-8 h-4 rounded-full transition-colors ${autoDetect ? 'bg-blue-500' : 'bg-gray-300'}`}>
                  <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${autoDetect ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTranslating}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {showFlag && <span className="text-xl">{currentLangConfig?.flag}</span>}
        <div className="text-left">
          <div className="font-medium text-gray-900">{currentLangConfig?.name}</div>
          {showNativeName && currentLangConfig?.nativeName !== currentLangConfig?.name && (
            <div className="text-xs text-gray-500">{currentLangConfig?.nativeName}</div>
          )}
        </div>
        {isTranslating ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        ) : (
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div 
          ref={dropdownRef}
          className={`absolute z-50 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg ${
            position.includes('right') ? 'right-0' : 'left-0'
          } ${position.includes('top') ? 'bottom-full mb-2' : 'top-full'}`}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-2">Select Language</h3>
            <input
              type="text"
              placeholder="Search languages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Language List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredLanguages.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No languages found matching "{searchTerm}"
              </div>
            ) : (
              filteredLanguages.map(langCode => {
                const config = languageConfig[langCode];
                return (
                  <button
                    key={langCode}
                    onClick={() => handleLanguageChange(langCode)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                      currentLanguage === langCode ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {showFlag && <span className="text-2xl">{config.flag}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{config.name}</div>
                      {showNativeName && config.nativeName !== config.name && (
                        <div className="text-sm text-gray-500 truncate">{config.nativeName}</div>
                      )}
                    </div>
                    {currentLanguage === langCode && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer with Auto-detect */}
          <div className="border-t border-gray-100 p-4">
            <button
              onClick={toggleAutoDetect}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Auto-detect language</span>
              </div>
              <div className={`relative w-10 h-5 rounded-full transition-colors ${autoDetect ? 'bg-blue-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${autoDetect ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
