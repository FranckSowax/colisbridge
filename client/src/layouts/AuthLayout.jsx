import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function AuthLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Affiche un loader pendant la vérification de l'authentification
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  // Si l'utilisateur est connecté et essaie d'accéder à une page d'authentification,
  // redirige vers le tableau de bord
  if (user && ['/login', '/register', '/forgot-password'].includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  // Si l'utilisateur n'est pas connecté et n'est pas sur une page d'authentification,
  // redirige vers la page de connexion
  if (!user && location.pathname === '/') {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Twinsk Parcel
          </h1>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
