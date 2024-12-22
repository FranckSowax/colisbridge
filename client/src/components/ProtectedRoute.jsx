import { useAuth } from '@hooks/useAuth'

export const ProtectedRoute = ({ children, requireAuth = true }) => {
  const { user, loading, isInitialized } = useAuth()

  // Ne rien afficher pendant le chargement initial
  if (loading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Laisser le hook useAuth gérer les redirections
  return children
}
