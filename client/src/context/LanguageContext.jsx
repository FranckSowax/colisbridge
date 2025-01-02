import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import toast from 'react-hot-toast';

const LanguageContext = createContext();

const DEFAULT_LANGUAGE = 'fr';
const LANGUAGE_KEY = 'app_language';

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Try to get language from localStorage first
    const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
    return savedLanguage || DEFAULT_LANGUAGE;
  });
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    loadLanguagePreference();
    loadTranslations(language);
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', user.id)
          .single();

        if (profile?.language) {
          setLanguage(profile.language);
          localStorage.setItem(LANGUAGE_KEY, profile.language);
          await loadTranslations(profile.language);
        }
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
      // Fallback to localStorage or default language
      const savedLanguage = localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE;
      setLanguage(savedLanguage);
      await loadTranslations(savedLanguage);
    }
  };

  const loadTranslations = async (lang) => {
    try {
      const translations = await import(`../locales/${lang}.json`);
      setTranslations(translations.default);
    } catch (error) {
      console.error('Error loading translations:', error);
      // If translations fail to load, try to load default language
      if (lang !== DEFAULT_LANGUAGE) {
        const defaultTranslations = await import(`../locales/${DEFAULT_LANGUAGE}.json`);
        setTranslations(defaultTranslations.default);
      }
    }
  };

  const changeLanguage = async (newLanguage) => {
    try {
      // Update localStorage first for immediate feedback
      localStorage.setItem(LANGUAGE_KEY, newLanguage);
      setLanguage(newLanguage);
      await loadTranslations(newLanguage);

      // Then try to update the database if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('profiles')
          .update({ language: newLanguage })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating language in database:', error);
          // Don't throw error here, as the language is already updated locally
          toast.error("Couldn't save language preference to server, but it's saved locally");
        } else {
          toast.success('Language preference saved');
        }
      }
    } catch (error) {
      console.error('Error changing language:', error);
      toast.error('Error changing language');
      // Revert to previous language on error
      setLanguage(language);
      localStorage.setItem(LANGUAGE_KEY, language);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      value = value?.[k];
      if (!value) break;
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
