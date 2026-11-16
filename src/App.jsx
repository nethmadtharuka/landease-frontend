import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import { PageSpinner } from './components/ui';
import { safeNext } from './lib/format';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Public pages
const ServicesPage = lazy(() => import('./pages/services/ServicesPage'));
const ServiceDetailPage = lazy(() => import('./pages/services/ServiceDetailPage'));
const ProviderPage = lazy(() => import('./pages/services/ProviderPage'));
const CommunityPage = lazy(() => import('./pages/community/CommunityPage'));
const CommunityDetailPage = lazy(() => import('./pages/community/CommunityDetailPage'));
const HowItWorksPage = lazy(() => import('./pages/public/HowItWorksPage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ToolsPage = lazy(() => import('./pages/public/ToolsPage'));
const HelpPage = lazy(() => import('./pages/public/HelpPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const LegalPage = lazy(() => import('./pages/public/LegalPage'));
const StatusPage = lazy(() => import('./pages/public/StatusPage'));
const AccountRecoveryPage = lazy(() => import('./pages/auth/AccountRecoveryPage'));

// App pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const CreateServicePage = lazy(() => import('./pages/services/CreateServicePage'));
const MyServicesPage = lazy(() => import('./pages/services/MyServicesPage'));
const ReviewsReceivedPage = lazy(() => import('./pages/services/ReviewsReceivedPage'));
const BookingsPage = lazy(() => import('./pages/bookings/BookingsPage'));
const BookingDetailPage = lazy(() => import('./pages/bookings/BookingDetailPage'));
const KycPage = lazy(() => import('./pages/kyc/KycPage'));
const SosPage = lazy(() => import('./pages/sos/SosPage'));
const SosHistoryPage = lazy(() => import('./pages/sos/SosHistoryPage'));
const AiChatPage = lazy(() => import('./pages/ai/AiChatPage'));
const PlaceRecognitionPage = lazy(() => import('./pages/ai/PlaceRecognitionPage'));
const VoiceTranslatorPage = lazy(() => import('./pages/translator/VoiceTranslatorPage'));
const ImmigrationPredictorPage = lazy(() => import('./pages/immigration/ImmigrationPredictorPage'));
const AdminKycPage = lazy(() => import('./pages/admin/AdminKycPage'));
const AdminFraudPage = lazy(() => import('./pages/admin/AdminFraudPage'));
const AdminModerationPage = lazy(() => import('./pages/admin/AdminModerationPage'));
const AdminListingsPage = lazy(() => import('./pages/admin/AdminListingsPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));

const STAFF = ['Admin', 'Agency'];

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return children;
}

/** Inside the app shell: wrong role → a 403 page instead of a silent redirect. */
function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user?.role)) return <StatusPage code={403} />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageSpinner />;
  // Signing in sets the user, which lands here: honour ?next= (in-app paths only).
  if (user) return <Navigate to={safeNext(new URLSearchParams(location.search).get('next'))} replace />;
  return children;
}

/** Public pages whose API is anonymous; signed-in users get the in-app version (same params and query). */
function PublicToApp({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageSpinner />;
  if (user) return <Navigate to={`/dashboard${location.pathname}${location.search}`} replace />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/" element={<PublicToApp><HomePage /></PublicToApp>} />

        <Route element={<PublicLayout />}>
          <Route path="/services" element={<PublicToApp><ServicesPage /></PublicToApp>} />
          <Route path="/services/:id" element={<PublicToApp><ServiceDetailPage /></PublicToApp>} />
          <Route path="/providers/:id" element={<PublicToApp><ProviderPage /></PublicToApp>} />
          <Route path="/community" element={<PublicToApp><CommunityPage /></PublicToApp>} />
          <Route path="/community/:id" element={<PublicToApp><CommunityDetailPage /></PublicToApp>} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<LegalPage kind="privacy" />} />
          <Route path="/terms" element={<LegalPage kind="terms" />} />
        </Route>

        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><AccountRecoveryPage mode="forgot" /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><AccountRecoveryPage mode="reset" /></GuestRoute>} />
        <Route path="/verify-email" element={<AccountRecoveryPage mode="verify" />} />

        <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="kyc" element={<KycPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/new" element={<RoleRoute roles={['Helper']}><CreateServicePage /></RoleRoute>} />
          <Route path="services/:id" element={<ServiceDetailPage />} />
          <Route path="services/:id/edit" element={<RoleRoute roles={['Helper']}><CreateServicePage /></RoleRoute>} />
          <Route path="providers/:id" element={<ProviderPage />} />
          <Route path="my-services" element={<RoleRoute roles={['Helper']}><MyServicesPage /></RoleRoute>} />
          <Route path="reviews" element={<RoleRoute roles={['Helper']}><ReviewsReceivedPage /></RoleRoute>} />
          <Route path="bookings" element={<RoleRoute roles={['Migrant', 'Helper']}><BookingsPage /></RoleRoute>} />
          <Route path="bookings/:id" element={<RoleRoute roles={['Migrant', 'Helper']}><BookingDetailPage /></RoleRoute>} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="community/:id" element={<CommunityDetailPage />} />
          <Route path="sos" element={<RoleRoute roles={['Migrant', 'Helper', 'Agency']}><SosPage /></RoleRoute>} />
          <Route path="sos/history" element={<RoleRoute roles={['Migrant']}><SosHistoryPage /></RoleRoute>} />
          <Route path="ai-chat" element={<AiChatPage />} />
          <Route path="voice-translator" element={<VoiceTranslatorPage />} />
          <Route path="immigration" element={<ImmigrationPredictorPage />} />
          <Route path="place-recognition" element={<PlaceRecognitionPage />} />
          <Route path="admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="admin/kyc" element={<RoleRoute roles={STAFF}><AdminKycPage /></RoleRoute>} />
          <Route path="admin/fraud" element={<RoleRoute roles={STAFF}><AdminFraudPage /></RoleRoute>} />
          <Route path="admin/moderation" element={<RoleRoute roles={STAFF}><AdminModerationPage /></RoleRoute>} />
          <Route path="admin/listings" element={<RoleRoute roles={STAFF}><AdminListingsPage /></RoleRoute>} />
          <Route path="admin/users" element={<RoleRoute roles={['Admin']}><AdminUsersPage /></RoleRoute>} />
          <Route path="*" element={<StatusPage code={404} inApp />} />
        </Route>
        <Route path="*" element={<StatusPage code={404} />} />
      </Routes>
    </Suspense>
  );
}
