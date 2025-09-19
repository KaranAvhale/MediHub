# MediHub Multilingual Support Setup Guide

## Overview

MediHub now supports multilingual functionality using Google Cloud Translation API. This guide will help you set up and configure the translation features in your application.

## Features

- **Real-time Translation**: Automatic translation of UI text and content
- **20+ Languages**: Support for major world languages including English, Spanish, French, German, Hindi, Chinese, Arabic, and more
- **Voice Support**: Speech recognition and text-to-speech in multiple languages
- **Smart Caching**: Efficient translation caching to minimize API calls
- **RTL Support**: Right-to-left language support for Arabic and other RTL languages
- **Auto-detection**: Automatic language detection for user input

## Prerequisites

1. **Google Cloud Account**: You need a Google Cloud account with billing enabled
2. **Translation API**: Enable the Google Cloud Translation API
3. **API Key**: Generate an API key for the Translation API

## Setup Instructions

### 1. Google Cloud Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Cloud Translation API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Cloud Translation API"
   - Click "Enable"

### 2. API Key Generation

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Optional) Restrict the API key to Translation API only for security

### 3. Environment Configuration

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Google Translate API key to the `.env` file:
   ```env
   VITE_GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key_here
   ```

### 4. Install Dependencies

The required dependencies are already added to `package.json`. Install them:

```bash
npm install
```

### 5. Start the Application

```bash
npm run dev
```

## Usage

### Language Selector

The language selector is automatically added to the navbar. Users can:
- Click the language dropdown to select a different language
- Search for languages by name
- Toggle auto-detection mode
- See native language names alongside English names

### Translation Components

#### TranslatedText Component

Use the `TranslatedText` component to wrap any text that needs translation:

```jsx
import TranslatedText from './components/TranslatedText';

// Basic usage
<TranslatedText>Hello World</TranslatedText>

// With custom props
<TranslatedText 
  sourceLanguage="en"
  className="text-lg font-bold"
  showOriginalOnHover={true}
>
  Welcome to MediHub
</TranslatedText>
```

#### useTranslate Hook

For programmatic translation in components:

```jsx
import { useTranslate } from './hooks/useTranslate';

function MyComponent() {
  const { t, tBatch } = useTranslate();
  
  // Translate single text
  const translatedText = await t('Hello World');
  
  // Translate multiple texts
  const translatedTexts = await tBatch(['Hello', 'World', 'Welcome']);
  
  return <div>{translatedText}</div>;
}
```

#### Translation Context

Access translation state and functions:

```jsx
import { useTranslation } from './contexts/TranslationContext';

function MyComponent() {
  const { 
    currentLanguage, 
    changeLanguage, 
    isRTL, 
    isTranslating 
  } = useTranslation();
  
  return (
    <div dir={isRTL() ? 'rtl' : 'ltr'}>
      Current language: {currentLanguage}
    </div>
  );
}
```

## Supported Languages

| Code | Language | Native Name | RTL |
|------|----------|-------------|-----|
| en   | English  | English     | No  |
| es   | Spanish  | Español     | No  |
| fr   | French   | Français    | No  |
| de   | German   | Deutsch     | No  |
| it   | Italian  | Italiano    | No  |
| pt   | Portuguese | Português | No  |
| ru   | Russian  | Русский     | No  |
| ja   | Japanese | 日本語      | No  |
| ko   | Korean   | 한국어      | No  |
| zh   | Chinese  | 中文        | No  |
| ar   | Arabic   | العربية     | Yes |
| hi   | Hindi    | हिन्दी       | No  |
| bn   | Bengali  | বাংলা       | No  |
| te   | Telugu   | తెలుగు      | No  |
| ta   | Tamil    | தமிழ்       | No  |
| mr   | Marathi  | मराठी       | No  |
| gu   | Gujarati | ગુજરાતી     | No  |
| kn   | Kannada  | ಕನ್ನಡ      | No  |
| ml   | Malayalam | മലയാളം    | No  |
| pa   | Punjabi  | ਪੰਜਾਬੀ     | No  |

## Voice Features

### Speech Recognition

Speech recognition automatically adapts to the selected language:
- Supports voice input in multiple languages
- Automatically sets the correct language for recognition
- Fallback to English if language not supported

### Text-to-Speech

Text-to-speech features include:
- Automatic translation of text before speaking
- Language-specific voice selection
- Adjustable speech rate, pitch, and volume

## Performance Optimization

### Caching Strategy

The translation system includes multiple caching layers:

1. **Browser Cache**: Translations stored in memory during session
2. **Service Cache**: Translation service maintains its own cache
3. **Smart Cleanup**: Automatic cache cleanup when size limits are reached

### API Usage Optimization

- **Batch Translation**: Multiple texts translated in single API call
- **Debounced Requests**: Prevents excessive API calls during typing
- **Fallback Handling**: Graceful degradation when API is unavailable

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify the API key is correct in `.env` file
   - Ensure Translation API is enabled in Google Cloud
   - Check API key restrictions

2. **Translations Not Appearing**
   - Check browser console for errors
   - Verify internet connection
   - Ensure component is wrapped in TranslationProvider

3. **Voice Features Not Working**
   - Check browser compatibility (Chrome/Edge recommended)
   - Ensure microphone permissions are granted
   - Verify HTTPS connection (required for speech features)

### Debug Mode

Enable debug logging by adding to your component:

```jsx
import { useTranslation } from './contexts/TranslationContext';

const { translationCache } = useTranslation();
console.log('Cache size:', translationCache);
```

## Best Practices

1. **Wrap Text Early**: Use TranslatedText components from the start
2. **Batch Translations**: Use tBatch for multiple related texts
3. **Cache Management**: Monitor cache size in production
4. **Error Handling**: Always provide fallback text
5. **Performance**: Avoid translating frequently changing text

## API Costs

Google Cloud Translation API pricing (as of 2024):
- **Text Translation**: $20 per 1M characters
- **Language Detection**: $20 per 1M characters
- **Free Tier**: 500,000 characters per month

Monitor usage in Google Cloud Console to track costs.

## Security Considerations

1. **API Key Protection**: Never expose API keys in client-side code
2. **Environment Variables**: Use environment variables for sensitive data
3. **Key Restrictions**: Restrict API keys to specific APIs and domains
4. **Rate Limiting**: Implement rate limiting to prevent abuse

## Contributing

When adding new translatable text:

1. Wrap all user-facing text in TranslatedText components
2. Use descriptive text that provides context
3. Test with RTL languages for layout issues
4. Consider text expansion (some languages require more space)

## Support

For issues related to:
- **Translation API**: Check Google Cloud documentation
- **Component Issues**: Review component props and usage
- **Performance**: Monitor cache statistics and API usage
- **Browser Compatibility**: Test across different browsers

## Future Enhancements

Planned features:
- **Offline Translation**: Local translation for common phrases
- **Custom Dictionaries**: Medical terminology translation
- **User Preferences**: Remember user language preferences
- **Advanced Voice**: More natural voice synthesis options
