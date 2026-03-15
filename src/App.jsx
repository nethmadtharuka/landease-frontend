import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ServicesPage from './pages/services/ServicesPage';
import ServiceDetailPage from './pages/services/ServiceDetailPage';
import CreateServicePage from './pages/services/CreateServicePage';
import BookingsPage from './pages/bookings/BookingsPage';
import KycPage from './pages/kyc/KycPage';
import CommunityPage from './pages/community/CommunityPage';
import CommunityDetailPage from './pages/community/CommunityDetailPage';
import SosPage from './pages/sos/SosPage';
import AiChatPage from './pages/ai/AiChatPage';
import AdminPage from './pages/admin/AdminPage';
import VoiceTranslatorPage from './pages/translator/VoiceTranslatorPage';
import ImmigrationPredictorPage from './pages/immigration/ImmigrationPredictorPage';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicHome() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

export default function App() {
  return (
    <Routes>
      {/* Public landing */}
      <Route path="/" element={<PublicHome />} />

      {/* Auth routes */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Protected routes inside Layout */}
      <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="services/new" element={<CreateServicePage />} />
        <Route path="services/:id" element={<ServiceDetailPage />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="kyc" element={<KycPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="community/:id" element={<CommunityDetailPage />} />
        <Route path="sos" element={<SosPage />} />
        <Route path="ai-chat" element={<AiChatPage />} />
        <Route path="voice-translator" element={<VoiceTranslatorPage />} />
        <Route path='immigration' element={<ImmigrationPredictorPage />} />

        <Route path="admin" element={
          <PrivateRoute roles={['Agency']}><AdminPage /></PrivateRoute>
        } />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
