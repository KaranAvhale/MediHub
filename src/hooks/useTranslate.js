import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '../contexts/TranslationContext';

// Custom hook for easy translation with caching and loading states
export const useTranslate = () => {
  const { translate, translateBatch, currentLanguage, isTranslating } = useTranslation();
  const [translatedTexts, setTranslatedTexts] = useState(new Map());
  const [loadingTexts, setLoadingTexts] = useState(new Set());
  const translationTimeouts = useRef(new Map());

  // Clear cache when language changes
  useEffect(() => {
    setTranslatedTexts(new Map());
    setLoadingTexts(new Set());
    // Clear any pending timeouts
    translationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    translationTimeouts.current.clear();
  }, [currentLanguage]);

  // Translate single text with debouncing
  const t = useCallback(async (text, options = {}) => {
    if (!text || !text.trim()) return text;
    
    const { 
      debounce = 300, 
      sourceLanguage = 'en',
      forceTranslate = false 
    } = options;
    
    const cacheKey = `${sourceLanguage}-${currentLanguage}-${text}`;
    
    // Return cached translation if available
    if (translatedTexts.has(cacheKey)) {
      return translatedTexts.get(cacheKey);
    }
    
    // Return original text if already loading
    if (loadingTexts.has(cacheKey)) {
      return text;
    }
    
    // Clear existing timeout for this text
    if (translationTimeouts.current.has(cacheKey)) {
      clearTimeout(translationTimeouts.current.get(cacheKey));
    }
    
    // Set up debounced translation
    return new Promise((resolve) => {
      const timeoutId = setTimeout(async () => {
        setLoadingTexts(prev => new Set(prev).add(cacheKey));
        
        try {
          const translatedText = await translate(text, {
            sourceLanguage,
            forceTranslate
          });
          
          setTranslatedTexts(prev => {
            const newMap = new Map(prev);
            newMap.set(cacheKey, translatedText);
            return newMap;
          });
          
          resolve(translatedText);
        } catch (error) {
          console.error('Translation error:', error);
          resolve(text); // Return original text on error
        } finally {
          setLoadingTexts(prev => {
            const newSet = new Set(prev);
            newSet.delete(cacheKey);
            return newSet;
          });
          translationTimeouts.current.delete(cacheKey);
        }
      }, debounce);
      
      translationTimeouts.current.set(cacheKey, timeoutId);
      
      // Return original text immediately while translation is pending
      resolve(text);
    });
  }, [translate, currentLanguage, translatedTexts, loadingTexts]);

  // Translate multiple texts
  const tBatch = useCallback(async (texts, options = {}) => {
    if (!Array.isArray(texts) || texts.length === 0) return texts;
    
    const { sourceLanguage = 'en', forceTranslate = false } = options;
    
    try {
      const translations = await translateBatch(texts, {
        sourceLanguage,
        forceTranslate
      });
      
      // Cache the results
      setTranslatedTexts(prev => {
        const newMap = new Map(prev);
        texts.forEach((text, index) => {
          if (text && translations[index]) {
            const cacheKey = `${sourceLanguage}-${currentLanguage}-${text}`;
            newMap.set(cacheKey, translations[index]);
          }
        });
        return newMap;
      });
      
      return translations;
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts; // Return original texts on error
    }
  }, [translateBatch, currentLanguage]);

  // Get cached translation without triggering new translation
  const getCached = useCallback((text, sourceLanguage = 'en') => {
    const cacheKey = `${sourceLanguage}-${currentLanguage}-${text}`;
    return translatedTexts.get(cacheKey) || text;
  }, [translatedTexts, currentLanguage]);

  // Check if text is currently being translated
  const isLoading = useCallback((text, sourceLanguage = 'en') => {
    const cacheKey = `${sourceLanguage}-${currentLanguage}-${text}`;
    return loadingTexts.has(cacheKey);
  }, [loadingTexts, currentLanguage]);

  // Clear translation cache
  const clearCache = useCallback(() => {
    setTranslatedTexts(new Map());
    setLoadingTexts(new Set());
    translationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    translationTimeouts.current.clear();
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    return {
      cachedTranslations: translatedTexts.size,
      loadingTranslations: loadingTexts.size,
      pendingTimeouts: translationTimeouts.current.size
    };
  }, [translatedTexts.size, loadingTexts.size]);

  return {
    t,
    tBatch,
    getCached,
    isLoading,
    clearCache,
    getCacheStats,
    isTranslating
  };
};

// Hook for translating component text content
export const useComponentTranslation = (componentTexts = {}) => {
  const { t } = useTranslate();
  const [translatedTexts, setTranslatedTexts] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const translateTexts = async () => {
      if (Object.keys(componentTexts).length === 0) return;
      
      setIsLoading(true);
      const translated = {};
      
      try {
        // Translate all texts in parallel
        const translationPromises = Object.entries(componentTexts).map(
          async ([key, text]) => {
            const translatedText = await t(text);
            return [key, translatedText];
          }
        );
        
        const results = await Promise.all(translationPromises);
        results.forEach(([key, translatedText]) => {
          translated[key] = translatedText;
        });
        
        setTranslatedTexts(translated);
      } catch (error) {
        console.error('Component translation error:', error);
        setTranslatedTexts(componentTexts); // Fallback to original texts
      } finally {
        setIsLoading(false);
      }
    };

    translateTexts();
  }, [componentTexts, t]);

  return { translatedTexts, isLoading };
};

// Hook for form field translations
export const useFormTranslation = (formConfig = {}) => {
  const { t } = useTranslate();
  const [translatedConfig, setTranslatedConfig] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const translateFormConfig = async () => {
      if (Object.keys(formConfig).length === 0) return;
      
      setIsLoading(true);
      const translated = {};
      
      try {
        for (const [fieldName, fieldConfig] of Object.entries(formConfig)) {
          translated[fieldName] = {
            ...fieldConfig,
            label: fieldConfig.label ? await t(fieldConfig.label) : fieldConfig.label,
            placeholder: fieldConfig.placeholder ? await t(fieldConfig.placeholder) : fieldConfig.placeholder,
            helperText: fieldConfig.helperText ? await t(fieldConfig.helperText) : fieldConfig.helperText,
            errorMessage: fieldConfig.errorMessage ? await t(fieldConfig.errorMessage) : fieldConfig.errorMessage
          };
        }
        
        setTranslatedConfig(translated);
      } catch (error) {
        console.error('Form translation error:', error);
        setTranslatedConfig(formConfig); // Fallback to original config
      } finally {
        setIsLoading(false);
      }
    };

    translateFormConfig();
  }, [formConfig, t]);

  return { translatedConfig, isLoading };
};

export default useTranslate;
