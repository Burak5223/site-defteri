import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, Language } from '../i18n/translations';
import { languageService } from '../services/language.service';

export type { Language };

interface I18nContextType {
  language: Language;
  changeLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@app_language';

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('tr');
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    loadLanguage();
  }, []);

  // Debug: Log language changes
  useEffect(() => {
    console.log('🌍 Current language state:', language);
  }, [language]);

  const loadLanguage = async () => {
    try {
      console.log('📖 [I18nContext] loadLanguage called');
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      console.log('📖 [I18nContext] Saved language from AsyncStorage:', savedLanguage);
      
      if (savedLanguage && ['tr', 'en', 'ru', 'ar'].includes(savedLanguage)) {
        const localLang = savedLanguage as Language;
        console.log('📖 [I18nContext] Setting language to:', localLang);
        setLanguage(localLang); // Set immediately - THIS IS THE MAIN THING
        
        // Backend sync is completely optional - don't even try if it fails
        // Just use local language
      } else {
        console.log('📖 [I18nContext] No saved language or invalid, using default: tr');
      }
    } catch (error) {
      console.error('❌ [I18nContext] Load language error:', error);
    }
  };

  const changeLanguage = async (lang: Language) => {
    try {
      console.log('🌍 [I18nContext] changeLanguage called with:', lang);
      console.log('🌍 [I18nContext] Current language state:', language);
      
      // Save to AsyncStorage first (immediate UI update)
      console.log('💾 [I18nContext] Saving to AsyncStorage...');
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      console.log('✅ [I18nContext] Saved to AsyncStorage:', lang);
      
      // Update state immediately - this should trigger re-render
      console.log('🔄 [I18nContext] Updating state...');
      setLanguage(lang);
      setUpdateTrigger(prev => prev + 1); // Force update
      console.log('✅ [I18nContext] State updated to:', lang);
      console.log('✅ [I18nContext] Update trigger incremented');
      
      // Backend sync is disabled for now (403 error)
      // Will be enabled after fixing authentication
      console.log('ℹ️ [I18nContext] Backend sync skipped (using local only)');
      
      console.log('🎉 [I18nContext] changeLanguage completed successfully');
    } catch (error) {
      console.error('❌ [I18nContext] Change language error:', error);
      throw error; // Only throw if AsyncStorage or state update fails
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to Turkish if key not found
        value = translations.tr;
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // Return key itself if not found
          }
        }
        break;
      }
    }
    
    let result = typeof value === 'string' ? value : key;
    
    // Handle interpolation
    if (params && typeof result === 'string') {
      Object.keys(params).forEach(paramKey => {
        const placeholder = `{${paramKey}}`;
        result = result.replace(new RegExp(placeholder, 'g'), String(params[paramKey]));
      });
    }
    
    return result;
  };

  const isRTL = language === 'ar';

  const contextValue = {
    language,
    changeLanguage,
    t,
    isRTL,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
};
