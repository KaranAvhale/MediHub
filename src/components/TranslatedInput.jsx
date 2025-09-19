import React, { useState, useEffect } from 'react';
import { useTranslate } from '../hooks/useTranslate';

// Translated input component that handles placeholder translation
const TranslatedInput = ({ 
  placeholder,
  label,
  helperText,
  errorMessage,
  sourceLanguage = 'en',
  className = '',
  labelClassName = '',
  helperClassName = '',
  errorClassName = '',
  ...inputProps 
}) => {
  const { t } = useTranslate();
  const [translatedPlaceholder, setTranslatedPlaceholder] = useState(placeholder || '');
  const [translatedLabel, setTranslatedLabel] = useState(label || '');
  const [translatedHelper, setTranslatedHelper] = useState(helperText || '');
  const [translatedError, setTranslatedError] = useState(errorMessage || '');

  useEffect(() => {
    const translateTexts = async () => {
      if (placeholder) {
        const translated = await t(placeholder, { sourceLanguage });
        setTranslatedPlaceholder(translated);
      }
      
      if (label) {
        const translated = await t(label, { sourceLanguage });
        setTranslatedLabel(translated);
      }
      
      if (helperText) {
        const translated = await t(helperText, { sourceLanguage });
        setTranslatedHelper(translated);
      }
      
      if (errorMessage) {
        const translated = await t(errorMessage, { sourceLanguage });
        setTranslatedError(translated);
      }
    };

    translateTexts();
  }, [placeholder, label, helperText, errorMessage, sourceLanguage, t]);

  return (
    <div className={className}>
      {translatedLabel && (
        <label className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}>
          {translatedLabel}
        </label>
      )}
      
      <input
        {...inputProps}
        placeholder={translatedPlaceholder}
        className={inputProps.className || "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"}
      />
      
      {translatedHelper && (
        <p className={`mt-1 text-sm text-gray-500 ${helperClassName}`}>
          {translatedHelper}
        </p>
      )}
      
      {translatedError && (
        <p className={`mt-1 text-sm text-red-600 ${errorClassName}`}>
          {translatedError}
        </p>
      )}
    </div>
  );
};

// Translated textarea component
export const TranslatedTextarea = ({ 
  placeholder,
  label,
  helperText,
  errorMessage,
  sourceLanguage = 'en',
  className = '',
  labelClassName = '',
  helperClassName = '',
  errorClassName = '',
  ...textareaProps 
}) => {
  const { t } = useTranslate();
  const [translatedPlaceholder, setTranslatedPlaceholder] = useState(placeholder || '');
  const [translatedLabel, setTranslatedLabel] = useState(label || '');
  const [translatedHelper, setTranslatedHelper] = useState(helperText || '');
  const [translatedError, setTranslatedError] = useState(errorMessage || '');

  useEffect(() => {
    const translateTexts = async () => {
      if (placeholder) {
        const translated = await t(placeholder, { sourceLanguage });
        setTranslatedPlaceholder(translated);
      }
      
      if (label) {
        const translated = await t(label, { sourceLanguage });
        setTranslatedLabel(translated);
      }
      
      if (helperText) {
        const translated = await t(helperText, { sourceLanguage });
        setTranslatedHelper(translated);
      }
      
      if (errorMessage) {
        const translated = await t(errorMessage, { sourceLanguage });
        setTranslatedError(translated);
      }
    };

    translateTexts();
  }, [placeholder, label, helperText, errorMessage, sourceLanguage, t]);

  return (
    <div className={className}>
      {translatedLabel && (
        <label className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}>
          {translatedLabel}
        </label>
      )}
      
      <textarea
        {...textareaProps}
        placeholder={translatedPlaceholder}
        className={textareaProps.className || "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"}
      />
      
      {translatedHelper && (
        <p className={`mt-1 text-sm text-gray-500 ${helperClassName}`}>
          {translatedHelper}
        </p>
      )}
      
      {translatedError && (
        <p className={`mt-1 text-sm text-red-600 ${errorClassName}`}>
          {translatedError}
        </p>
      )}
    </div>
  );
};

// Translated select component
export const TranslatedSelect = ({ 
  label,
  helperText,
  errorMessage,
  options = [],
  sourceLanguage = 'en',
  className = '',
  labelClassName = '',
  helperClassName = '',
  errorClassName = '',
  ...selectProps 
}) => {
  const { t, tBatch } = useTranslate();
  const [translatedLabel, setTranslatedLabel] = useState(label || '');
  const [translatedHelper, setTranslatedHelper] = useState(helperText || '');
  const [translatedError, setTranslatedError] = useState(errorMessage || '');
  const [translatedOptions, setTranslatedOptions] = useState(options);

  useEffect(() => {
    const translateTexts = async () => {
      if (label) {
        const translated = await t(label, { sourceLanguage });
        setTranslatedLabel(translated);
      }
      
      if (helperText) {
        const translated = await t(helperText, { sourceLanguage });
        setTranslatedHelper(translated);
      }
      
      if (errorMessage) {
        const translated = await t(errorMessage, { sourceLanguage });
        setTranslatedError(translated);
      }
      
      // Translate option labels
      if (options.length > 0) {
        const optionTexts = options.map(option => 
          typeof option === 'string' ? option : option.label || option.text || ''
        );
        
        const translatedTexts = await tBatch(optionTexts, { sourceLanguage });
        
        const newOptions = options.map((option, index) => {
          if (typeof option === 'string') {
            return translatedTexts[index];
          }
          return {
            ...option,
            label: translatedTexts[index] || option.label,
            text: translatedTexts[index] || option.text
          };
        });
        
        setTranslatedOptions(newOptions);
      }
    };

    translateTexts();
  }, [label, helperText, errorMessage, options, sourceLanguage, t, tBatch]);

  return (
    <div className={className}>
      {translatedLabel && (
        <label className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}>
          {translatedLabel}
        </label>
      )}
      
      <select
        {...selectProps}
        className={selectProps.className || "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"}
      >
        {translatedOptions.map((option, index) => {
          if (typeof option === 'string') {
            return (
              <option key={index} value={option}>
                {option}
              </option>
            );
          }
          
          return (
            <option key={index} value={option.value || option.id}>
              {option.label || option.text || option.name}
            </option>
          );
        })}
      </select>
      
      {translatedHelper && (
        <p className={`mt-1 text-sm text-gray-500 ${helperClassName}`}>
          {translatedHelper}
        </p>
      )}
      
      {translatedError && (
        <p className={`mt-1 text-sm text-red-600 ${errorClassName}`}>
          {translatedError}
        </p>
      )}
    </div>
  );
};

export default TranslatedInput;
