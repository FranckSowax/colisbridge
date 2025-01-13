import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../config/supabaseClient'

export const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    // Vérifie la session actuelle
    const getSession = async () => {
      try {
        console.log('Récupération de la session en cours...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erreur lors de la récupération de la session:', error.message)
          if (mounted) setError(error.message)
          return
        }
        
        console.log('État de la session:', {
          sessionExiste: !!session,
          userId: session?.user?.id,
          email: session?.user?.email
        })
        
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setError(null)
        }
      } catch (error) {
        console.error('Erreur inattendue:', error.message)
        if (mounted) setError(error.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    getSession()

    // Écoute les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Changement d\'état d\'authentification:', {
        event,
        userId: session?.user?.id,
        email: session?.user?.email
      })

      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        setError(null)
      }
    })

    // Nettoyage
    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  // Fonctions d'authentification
  const signIn = async ({ email, password }) => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) throw error
      
      return data
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signOut,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
