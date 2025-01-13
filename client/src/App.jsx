import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Profile from './pages/dashboard/Profile';
import Settings from './pages/dashboard/Settings';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PrivateRoute } from './components/PrivateRoute';
import Disputes from './pages/dashboard/Disputes';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { SupabaseProvider } from './contexts/SupabaseContext';
import CreateParcel from './pages/dashboard/CreateParcel';

// Composant de chargement
const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
  </div>
);

// Lazy loading des composants
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const Statistics = React.lazy(() => import('./pages/dashboard/Statistics'));
const ParcelList = React.lazy(() => import('./pages/dashboard/ParcelList'));
const ParcelDetails = React.lazy(() => import('./pages/dashboard/ParcelDetails'));
const ClientList = React.lazy(() => import('./pages/dashboard/ClientList'));

export default function App() {
  return (
    <AuthProvider>
      <SupabaseProvider>
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
                    <Route path="clients" element={<ClientList />} />
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
      </SupabaseProvider>
    </AuthProvider>
  );
}
