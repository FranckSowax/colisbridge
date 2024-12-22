import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthLayout } from '@layouts/AuthLayout';
import { DashboardLayout } from '@layouts/DashboardLayout';
import { PrivateRoute } from '@components/PrivateRoute';
import { Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';

// Composant de chargement
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
  </div>
)

// Chargement paresseux des pages
const Login = lazy(() => import('@pages/auth/Login'))
const Register = lazy(() => import('@pages/auth/Register'))
const ForgotPassword = lazy(() => import('@pages/auth/ForgotPassword'))
const Dashboard = lazy(() => import('@pages/dashboard/Dashboard'))
const CreateParcel = lazy(() => import('@pages/dashboard/CreateParcel'))
const ParcelsList = lazy(() => import('@pages/dashboard/ParcelsList'))
const Profile = lazy(() => import('@pages/dashboard/Profile'))
const Clients = lazy(() => import('@pages/dashboard/Clients'))
const Settings = lazy(() => import('@pages/dashboard/Settings'))
const Disputes = lazy(() => import('@pages/dashboard/Disputes'))
const FilteredParcels = lazy(() => import('@pages/dashboard/FilteredParcels'))
const Statistics = lazy(() => import('@pages/dashboard/Statistics'))

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Redirection de la racine vers la page de connexion */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Routes d'authentification */}
              <Route element={<AuthLayout />}>
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
              </Route>

              {/* Routes du tableau de bord - protégées */}
              <Route
                path="dashboard"
                element={
                  <PrivateRoute>
                    <DashboardLayout />
                  </PrivateRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="create-parcel" element={<CreateParcel />} />
                <Route path="statistics" element={
                  <Suspense fallback={<div>Chargement...</div>}>
                    <Statistics />
                  </Suspense>
                } />
                <Route path="parcels" element={<ParcelsList />} />
                <Route path="filtered-parcels" element={<FilteredParcels />} />
                <Route path="clients" element={<Clients />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="disputes" element={<Disputes />} />
              </Route>

              {/* Redirection des routes inconnues vers la page de connexion */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <Toaster position="top-right" />
          </Suspense>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}
