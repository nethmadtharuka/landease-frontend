import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe } from 'lucide-react'; 
import { Scale } from 'lucide-react'; // add to import
import {
  Home, Briefcase, Calendar, Shield, Users,
  AlertTriangle, MessageSquare, Settings, LogOut,
  Bell, User, ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: Home, label: 'Dashboard', roles: ['Migrant', 'Helper', 'Agency'] },
  { to: '/dashboard/services', icon: Briefcase, label: 'Services', roles: ['Migrant', 'Helper', 'Agency'] },
  { to: '/dashboard/bookings', icon: Calendar, label: 'Bookings', roles: ['Migrant', 'Helper'] },
  { to: '/dashboard/kyc', icon: Shield, label: 'KYC Verify', roles: ['Migrant', 'Helper'] },
  { to: '/dashboard/community', icon: Users, label: 'Community', roles: ['Migrant', 'Helper', 'Agency'] },
  { to: '/dashboard/sos', icon: AlertTriangle, label: 'SOS', roles: ['Migrant', 'Helper', 'Agency'] },
  { to: '/dashboard/ai-chat', icon: MessageSquare, label: 'AI Assistant', roles: ['Migrant', 'Helper'] },
  { to: '/dashboard/admin', icon: Settings, label: 'Admin', roles: ['Agency'] },
{ to: '/dashboard/voice-translator', icon: Globe, label: 'Voice Translator', roles: ['Migrant', 'Helper', 'Agency'] },
{to: '/dashboard/immigration',icon: Scale,label: 'Case Predictor',roles: ['Migrant', 'Helper', 'Agency']
},

];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredNav = navItems.filter(item =>
    item.roles.includes(user?.role)
  );

  return (
    <div className="min-h-screen bg-navy-950 flex">

      {/* Sidebar */}
      <aside className="w-64 bg-navy-900 border-r border-navy-800 
                        flex flex-col fixed h-full z-10">

        {/* Logo */}
        <div className="p-6 border-b border-navy-800">
          <div>
            <h1 className="font-display font-bold text-white text-lg leading-none">
              LandEase
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Migration Platform</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm 
                 font-medium transition-all duration-200 group
                 ${isActive
                  ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-navy-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-gold-400' : ''} />
                  {label}
                  {isActive && (
                    <ChevronRight size={14} className="ml-auto text-gold-400" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-navy-800">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 bg-navy-700 rounded-full flex items-center 
                            justify-center text-gold-400 text-sm font-bold">
              {user?.fullName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.fullName}
              </p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm 
                       text-gray-400 hover:text-red-400 hover:bg-red-950/30 
                       rounded-lg transition-all duration-200"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">

        {/* Top Bar */}
        <header className="bg-navy-900/50 backdrop-blur border-b border-navy-800 
                           px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div />
          <div className="flex items-center gap-4">
            {user?.isKycVerified && (
              <span className="badge-success">
                <Shield size={10} className="mr-1" />
                KYC Verified
              </span>
            )}
            <NavLink to="/dashboard/profile">
              <div className="w-8 h-8 bg-navy-700 hover:bg-navy-600 rounded-full 
                              flex items-center justify-center text-gold-400 
                              text-sm font-bold transition-colors cursor-pointer">
                {user?.fullName?.charAt(0)}
              </div>
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-container animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}