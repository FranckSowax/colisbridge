import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Récupérer la session actuelle
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        setUser(session?.user ?? null);
        
        // Écouter les changements d'auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          setUser(session?.user ?? null);
          if (_event === 'SIGNED_IN') {
            toast.success('Connexion réussie');
          } else if (_event === 'SIGNED_OUT') {
            toast.success('Déconnexion réussie');
          }
        });

        return () => {
          subscription?.unsubscribe();
        };
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err);
        toast.error('Erreur lors de l\'initialisation de l\'authentification');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (credentials) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;
      setUser(data.user);
      return { data, error: null };
    } catch (error) {
      console.error('Error in signIn:', error.message);
      toast.error(error.message);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error in signOut:', error.message);
      toast.error('Erreur lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur d'authentification</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const value = {
    signIn,
    signOut,
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
