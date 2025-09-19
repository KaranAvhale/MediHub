import React, { useState, useEffect } from 'react';
import { useTranslate } from '../hooks/useTranslate';
import { useTranslation } from '../contexts/TranslationContext';

// Component for translating text content
const TranslatedText = ({ 
  children, 
  text,
  sourceLanguage = 'en',
  forceTranslate = false,
  fallback = null,
  showOriginalOnHover = false,
  className = '',
  as: Component = 'span',
  loadingComponent = null,
  errorComponent = null,
  ...props 
}) => {
  const { t, isLoading } = useTranslate();
  const { currentLanguage, formatText } = useTranslation();
  const [translatedText, setTranslatedText] = useState('');
  const [error, setError] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);

  // Get the text to translate
  const textToTranslate = text || (typeof children === 'string' ? children : '');

  useEffect(() => {
    const translateText = async () => {
      if (!textToTranslate || !textToTranslate.trim()) {
        setTranslatedText(textToTranslate);
        return;
      }

      // Don't translate if current language is the same as source language and not forced
      if (currentLanguage === sourceLanguage && !forceTranslate) {
        setTranslatedText(textToTranslate);
        return;
      }

      try {
        setError(null);
        const result = await t(textToTranslate, {
          sourceLanguage,
          forceTranslate
        });
        setTranslatedText(formatText(result));
      } catch (err) {
        console.error('Translation error:', err);
        setError(err);
        setTranslatedText(fallback || textToTranslate);
      }
    };

    translateText();
  }, [textToTranslate, sourceLanguage, forceTranslate, currentLanguage, t, formatText, fallback]);

  // Handle loading state
  if (isLoading(textToTranslate, sourceLanguage)) {
    if (loadingComponent) {
      return loadingComponent;
    }
    return (
      <Component className={`${className} animate-pulse`} {...props}>
        {textToTranslate}
      </Component>
    );
  }

  // Handle error state
  if (error && errorComponent) {
    return errorComponent;
  }

  // Render translated text
  const displayText = showOriginal ? textToTranslate : translatedText;

  const componentProps = {
    className,
    ...props
  };

  // Add hover functionality if enabled
  if (showOriginalOnHover && translatedText !== textToTranslate) {
    componentProps.onMouseEnter = () => setShowOriginal(true);
    componentProps.onMouseLeave = () => setShowOriginal(false);
    componentProps.title = showOriginal ? translatedText : textToTranslate;
    componentProps.style = { 
      cursor: 'help',
      ...componentProps.style 
    };
  }

  return (
    <Component {...componentProps}>
      {displayText}
    </Component>
  );
};

// Higher-order component for wrapping components with translation
export const withTranslatedText = (WrappedComponent) => {
  return function TranslatedComponent({ translationProps = {}, ...props }) {
    return (
      <TranslatedText {...translationProps}>
        <WrappedComponent {...props} />
      </TranslatedText>
    );
  };
};

// Component for translating multiple text elements
export const TranslatedGroup = ({ 
  texts = [], 
  sourceLanguage = 'en',
  forceTranslate = false,
  className = '',
  itemClassName = '',
  separator = ' ',
  as: Component = 'div',
  itemAs: ItemComponent = 'span',
  ...props 
}) => {
  const { tBatch } = useTranslate();
  const { formatText } = useTranslation();
  const [translatedTexts, setTranslatedTexts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const translateTexts = async () => {
      if (!Array.isArray(texts) || texts.length === 0) {
        setTranslatedTexts([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await tBatch(texts, {
          sourceLanguage,
          forceTranslate
        });
        setTranslatedTexts(results.map(text => formatText(text)));
      } catch (error) {
        console.error('Batch translation error:', error);
        setTranslatedTexts(texts); // Fallback to original texts
      } finally {
        setIsLoading(false);
      }
    };

    translateTexts();
  }, [texts, sourceLanguage, forceTranslate, tBatch, formatText]);

  if (isLoading) {
    return (
      <Component className={`${className} animate-pulse`} {...props}>
        {texts.map((text, index) => (
          <ItemComponent key={index} className={itemClassName}>
            {text}
            {index < texts.length - 1 && separator}
          </ItemComponent>
        ))}
      </Component>
    );
  }

  return (
    <Component className={className} {...props}>
      {translatedTexts.map((text, index) => (
        <ItemComponent key={index} className={itemClassName}>
          {text}
          {index < translatedTexts.length - 1 && separator}
        </ItemComponent>
      ))}
    </Component>
  );
};

// Component for translating form labels and placeholders
export const TranslatedFormField = ({ 
  label,
  placeholder,
  helperText,
  errorMessage,
  sourceLanguage = 'en',
  children,
  className = '',
  labelClassName = '',
  helperClassName = '',
  errorClassName = '',
  ...props 
}) => {
  return (
    <div className={className} {...props}>
      {label && (
        <TranslatedText
          text={label}
          sourceLanguage={sourceLanguage}
          as="label"
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}
        />
      )}
      
      {React.cloneElement(children, {
        placeholder: placeholder ? (
          <TranslatedText
            text={placeholder}
            sourceLanguage={sourceLanguage}
            as={React.Fragment}
          />
        ) : children.props.placeholder,
        ...children.props
      })}
      
      {helperText && (
        <TranslatedText
          text={helperText}
          sourceLanguage={sourceLanguage}
          as="p"
          className={`mt-1 text-sm text-gray-500 ${helperClassName}`}
        />
      )}
      
      {errorMessage && (
        <TranslatedText
          text={errorMessage}
          sourceLanguage={sourceLanguage}
          as="p"
          className={`mt-1 text-sm text-red-600 ${errorClassName}`}
        />
      )}
    </div>
  );
};

export default TranslatedText;
