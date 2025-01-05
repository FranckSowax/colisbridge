import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PrivateRoute } from './components/PrivateRoute';

// Composant de chargement
const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
  </div>
);

// Lazy loading des composants
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const CreateParcel = lazy(() => import('./pages/dashboard/CreateParcel'));
const Statistics = lazy(() => import('./pages/dashboard/Statistics'));
const ParcelList = lazy(() => import('./pages/dashboard/ParcelList'));
const ParcelDetails = lazy(() => import('./pages/dashboard/ParcelDetails'));
const Clients = lazy(() => import('./pages/dashboard/Clients'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const Disputes = lazy(() => import('./pages/dashboard/Disputes'));

export default function App() {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <LanguageProvider>
          <ThemeProvider>
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
              <Toaster position="top-right" />
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
                    <Route path="statistics" element={<Statistics />} />
                    <Route path="parcels" element={<ParcelList />} />
                    <Route path="parcel-details" element={<ParcelDetails />} />
                    <Route path="clients" element={<Clients />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="disputes" element={<Disputes />} />
                  </Route>

                  {/* Redirection des routes inconnues vers la page de connexion */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
            </div>
          </ThemeProvider>
        </LanguageProvider>
      </AuthProvider>
    </SupabaseProvider>
  );
}
