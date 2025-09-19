// Google Cloud Translation API Service
class TranslationService {
  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
    this.baseUrl = 'https://translation.googleapis.com/language/translate/v2';
    this.cache = new Map();
    this.maxCacheSize = 1000;
  }

  // Generate cache key for translation
  getCacheKey(text, targetLang, sourceLang = 'auto') {
    return `${sourceLang}-${targetLang}-${text}`;
  }

  // Clean cache if it gets too large
  cleanCache() {
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      const toDelete = entries.slice(0, Math.floor(this.maxCacheSize / 2));
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Translate text using Google Cloud Translation API
  async translateText(text, targetLanguage, sourceLanguage = 'auto') {
    if (!text || !text.trim()) return text;
    if (!this.apiKey) {
      console.warn('Google Translate API key not found');
      return text;
    }

    const cacheKey = this.getCacheKey(text, targetLanguage, sourceLanguage);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        q: text,
        target: targetLanguage,
        format: 'text'
      });

      if (sourceLanguage !== 'auto') {
        params.append('source', sourceLanguage);
      }

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      const translatedText = data.data.translations[0].translatedText;

      // Cache the result
      this.cache.set(cacheKey, translatedText);
      this.cleanCache();

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    }
  }

  // Translate multiple texts in batch
  async translateBatch(texts, targetLanguage, sourceLanguage = 'auto') {
    if (!Array.isArray(texts) || texts.length === 0) return [];
    if (!this.apiKey) {
      console.warn('Google Translate API key not found');
      return texts;
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        target: targetLanguage,
        format: 'text'
      });

      texts.forEach(text => {
        if (text && text.trim()) {
          params.append('q', text);
        }
      });

      if (sourceLanguage !== 'auto') {
        params.append('source', sourceLanguage);
      }

      const response = await fetch(`${this.baseUrl}?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const data = await response.json();
      const translations = data.data.translations.map(t => t.translatedText);

      // Cache the results
      texts.forEach((text, index) => {
        if (text && text.trim() && translations[index]) {
          const cacheKey = this.getCacheKey(text, targetLanguage, sourceLanguage);
          this.cache.set(cacheKey, translations[index]);
        }
      });

      this.cleanCache();
      return translations;
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts; // Return original texts on error
    }
  }

  // Detect language of text
  async detectLanguage(text) {
    if (!text || !text.trim()) return null;
    if (!this.apiKey) {
      console.warn('Google Translate API key not found');
      return null;
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        q: text
      });

      const response = await fetch(`https://translation.googleapis.com/language/translate/v2/detect?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      if (!response.ok) {
        throw new Error(`Language detection error: ${response.status}`);
      }

      const data = await response.json();
      return data.data.detections[0][0].language;
    } catch (error) {
      console.error('Language detection error:', error);
      return null;
    }
  }

  // Get supported languages
  async getSupportedLanguages() {
    if (!this.apiKey) {
      console.warn('Google Translate API key not found');
      return this.getDefaultLanguages();
    }

    try {
      const response = await fetch(`https://translation.googleapis.com/language/translate/v2/languages?key=${this.apiKey}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Languages API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data.languages;
    } catch (error) {
      console.error('Get languages error:', error);
      return this.getDefaultLanguages();
    }
  }

  // Default languages fallback
  getDefaultLanguages() {
    return [
      { language: 'en', name: 'English' },
      { language: 'es', name: 'Spanish' },
      { language: 'fr', name: 'French' },
      { language: 'de', name: 'German' },
      { language: 'it', name: 'Italian' },
      { language: 'pt', name: 'Portuguese' },
      { language: 'ru', name: 'Russian' },
      { language: 'ja', name: 'Japanese' },
      { language: 'ko', name: 'Korean' },
      { language: 'zh', name: 'Chinese' },
      { language: 'ar', name: 'Arabic' },
      { language: 'hi', name: 'Hindi' },
      { language: 'bn', name: 'Bengali' },
      { language: 'te', name: 'Telugu' },
      { language: 'ta', name: 'Tamil' },
      { language: 'mr', name: 'Marathi' },
      { language: 'gu', name: 'Gujarati' },
      { language: 'kn', name: 'Kannada' },
      { language: 'ml', name: 'Malayalam' },
      { language: 'pa', name: 'Punjabi' }
    ];
  }

  // Clear translation cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize
    };
  }
}

// Create singleton instance
const translationService = new TranslationService();
export default translationService;
