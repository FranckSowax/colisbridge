import React, { createContext, useContext } from 'react';
import { supabase } from '../config/supabaseClient';

const SupabaseContext = createContext();

export function SupabaseProvider({ children }) {
  const value = {
    supabase,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
