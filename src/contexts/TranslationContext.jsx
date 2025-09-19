import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import translationService from '../services/translationService';

// Create Translation Context
const TranslationContext = createContext();

// Language configurations with RTL support
const LANGUAGE_CONFIG = {
  en: { name: 'English', nativeName: 'English', rtl: false, flag: '🇺🇸' },
  es: { name: 'Spanish', nativeName: 'Español', rtl: false, flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', rtl: false, flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', rtl: false, flag: '🇩🇪' },
  it: { name: 'Italian', nativeName: 'Italiano', rtl: false, flag: '🇮🇹' },
  pt: { name: 'Portuguese', nativeName: 'Português', rtl: false, flag: '🇵🇹' },
  ru: { name: 'Russian', nativeName: 'Русский', rtl: false, flag: '🇷🇺' },
  ja: { name: 'Japanese', nativeName: '日本語', rtl: false, flag: '🇯🇵' },
  ko: { name: 'Korean', nativeName: '한국어', rtl: false, flag: '🇰🇷' },
  zh: { name: 'Chinese', nativeName: '中文', rtl: false, flag: '🇨🇳' },
  ar: { name: 'Arabic', nativeName: 'العربية', rtl: true, flag: '🇸🇦' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', rtl: false, flag: '🇮🇳' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', rtl: false, flag: '🇧🇩' },
  te: { name: 'Telugu', nativeName: 'తెలుగు', rtl: false, flag: '🇮🇳' },
  ta: { name: 'Tamil', nativeName: 'தமிழ்', rtl: false, flag: '🇮🇳' },
  mr: { name: 'Marathi', nativeName: 'मराठी', rtl: false, flag: '🇮🇳' },
  gu: { name: 'Gujarati', nativeName: 'ગુજરાતી', rtl: false, flag: '🇮🇳' },
  kn: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', rtl: false, flag: '🇮🇳' },
  ml: { name: 'Malayalam', nativeName: 'മലയാളം', rtl: false, flag: '🇮🇳' },
  pa: { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', rtl: false, flag: '🇮🇳' }
};

// Translation Provider Component
export const TranslationProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState(Object.keys(LANGUAGE_CONFIG));
  const [translationCache, setTranslationCache] = useState(new Map());
  const [autoDetect, setAutoDetect] = useState(false);

  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('medihub-language');
    const savedAutoDetect = localStorage.getItem('medihub-auto-detect') === 'true';
    
    if (savedLanguage && LANGUAGE_CONFIG[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
    setAutoDetect(savedAutoDetect);

    // Set document direction based on language
    updateDocumentDirection(savedLanguage || 'en');
  }, []);

  // Update document direction for RTL languages
  const updateDocumentDirection = useCallback((langCode) => {
    const isRTL = LANGUAGE_CONFIG[langCode]?.rtl || false;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = langCode;
  }, []);

  // Change language
  const changeLanguage = useCallback(async (newLanguage) => {
    if (newLanguage === currentLanguage) return;
    
    setCurrentLanguage(newLanguage);
    localStorage.setItem('medihub-language', newLanguage);
    updateDocumentDirection(newLanguage);
    
    // Clear cache when language changes to force retranslation
    setTranslationCache(new Map());
    translationService.clearCache();
  }, [currentLanguage, updateDocumentDirection]);

  // Toggle auto-detect
  const toggleAutoDetect = useCallback(() => {
    const newAutoDetect = !autoDetect;
    setAutoDetect(newAutoDetect);
    localStorage.setItem('medihub-auto-detect', newAutoDetect.toString());
  }, [autoDetect]);

  // Translate text
  const translate = useCallback(async (text, options = {}) => {
    if (!text || !text.trim()) return text;
    if (currentLanguage === 'en' && !options.forceTranslate) return text;

    const {
      sourceLanguage = 'en',
      targetLanguage = currentLanguage,
      forceTranslate = false
    } = options;

    // Check cache first
    const cacheKey = `${sourceLanguage}-${targetLanguage}-${text}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    try {
      setIsTranslating(true);
      const translatedText = await translationService.translateText(
        text,
        targetLanguage,
        sourceLanguage
      );

      // Update cache
      setTranslationCache(prev => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, translatedText);
        return newCache;
      });

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage, translationCache]);

  // Translate multiple texts in batch
  const translateBatch = useCallback(async (texts, options = {}) => {
    if (!Array.isArray(texts) || texts.length === 0) return texts;
    if (currentLanguage === 'en' && !options.forceTranslate) return texts;

    const {
      sourceLanguage = 'en',
      targetLanguage = currentLanguage
    } = options;

    try {
      setIsTranslating(true);
      const translations = await translationService.translateBatch(
        texts,
        targetLanguage,
        sourceLanguage
      );

      // Update cache
      setTranslationCache(prev => {
        const newCache = new Map(prev);
        texts.forEach((text, index) => {
          if (text && translations[index]) {
            const cacheKey = `${sourceLanguage}-${targetLanguage}-${text}`;
            newCache.set(cacheKey, translations[index]);
          }
        });
        return newCache;
      });

      return translations;
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts; // Return original texts on error
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage, translationCache]);

  // Detect language
  const detectLanguage = useCallback(async (text) => {
    if (!text || !text.trim()) return null;
    
    try {
      return await translationService.detectLanguage(text);
    } catch (error) {
      console.error('Language detection error:', error);
      return null;
    }
  }, []);

  // Get language info
  const getLanguageInfo = useCallback((langCode) => {
    return LANGUAGE_CONFIG[langCode] || LANGUAGE_CONFIG.en;
  }, []);

  // Get current language info
  const getCurrentLanguageInfo = useCallback(() => {
    return getLanguageInfo(currentLanguage);
  }, [currentLanguage, getLanguageInfo]);

  // Check if current language is RTL
  const isRTL = useCallback(() => {
    return getCurrentLanguageInfo().rtl;
  }, [getCurrentLanguageInfo]);

  // Format text for current language direction
  const formatText = useCallback((text, options = {}) => {
    if (!text) return text;
    
    const { preserveSpacing = true, trimWhitespace = false } = options;
    let formattedText = text;
    
    if (trimWhitespace) {
      formattedText = formattedText.trim();
    }
    
    if (isRTL() && preserveSpacing) {
      // Add proper spacing for RTL languages
      formattedText = formattedText.replace(/\s+/g, ' ');
    }
    
    return formattedText;
  }, [isRTL]);

  // Context value
  const contextValue = {
    // State
    currentLanguage,
    isTranslating,
    availableLanguages,
    autoDetect,
    
    // Language info
    getLanguageInfo,
    getCurrentLanguageInfo,
    isRTL,
    
    // Actions
    changeLanguage,
    toggleAutoDetect,
    translate,
    translateBatch,
    detectLanguage,
    formatText,
    
    // Utilities
    languageConfig: LANGUAGE_CONFIG,
    translationCache: translationCache.size
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

// Custom hook to use translation context
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

// Higher-order component for translation
export const withTranslation = (Component) => {
  return function TranslatedComponent(props) {
    const translation = useTranslation();
    return <Component {...props} translation={translation} />;
  };
};

export default TranslationContext;
