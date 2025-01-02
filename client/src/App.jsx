import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';
import { PrivateRoute } from './components/PrivateRoute';
import { Suspense, lazy } from 'react';

// Composant de chargement
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
  </div>
)

// Importation des composants avec lazy loading
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const CreateParcel = lazy(() => import('./pages/dashboard/CreateParcel'));
const Statistics = lazy(() => import('./pages/dashboard/Statistics'));
const ParcelList = lazy(() => import('./pages/dashboard/ParcelList'));
const FilteredParcels = lazy(() => import('./pages/dashboard/FilteredParcels'));
const Clients = lazy(() => import('./pages/dashboard/Clients'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const Disputes = lazy(() => import('./pages/dashboard/Disputes'));
const Litiges = lazy(() => import('./pages/dashboard/Litiges'));

export default function App() {
  return (
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
                  <Route path="filtered-parcels" element={<FilteredParcels />} />
                  <Route path="clients" element={<Clients />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="disputes" element={<Disputes />} />
                  <Route path="litiges" element={<Litiges />} />
                </Route>

                {/* Redirection des routes inconnues vers la page de connexion */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </div>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
