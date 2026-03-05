import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { servicesApi, bookingsApi } from '../api/endpoints';
import {
  Briefcase, Calendar, Shield, Users,
  AlertTriangle, MessageSquare, TrendingUp,
  ArrowRight, Star, CheckCircle, Clock
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  // Backend returns MigrationStatus as integer (no JsonStringEnumConverter)
  const MIGRATION_LABELS = { 0: 'Planning', 1: 'Newly Arrived', 2: 'Settled' };

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const [services, bookings] = await Promise.all([
          servicesApi.getAll({ pageSize: 3 }),
          user.role !== 'Agency' ? bookingsApi.getMine() : Promise.resolve(null)
        ]);
        setStats({
          services: services.data.data,
          bookings: bookings?.data.data || []
        });
      } catch { }
    };
    fetchStats();
  }, [user]);

  const quickLinks = [
    {
      to: '/dashboard/services',
      icon: Briefcase,
      label: 'Browse Services',
      desc: 'Find settlement support',
      color: 'text-blue-400',
      bg: 'bg-blue-900/20'
    },
    {
      to: '/dashboard/community',
      icon: Users,
      label: 'Community',
      desc: 'Connect with others',
      color: 'text-green-400',
      bg: 'bg-green-900/20'
    },
    {
      to: '/dashboard/ai-chat',
      icon: MessageSquare,
      label: 'AI Assistant',
      desc: 'Get instant guidance',
      color: 'text-purple-400',
      bg: 'bg-purple-900/20'
    },
    {
      to: '/dashboard/sos',
      icon: AlertTriangle,
      label: 'SOS Emergency',
      desc: 'Get immediate help',
      color: 'text-red-400',
      bg: 'bg-red-900/20'
    },
  ];

  return (
    <div className="space-y-8">

      {/* Welcome Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-title">
            Welcome back, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="section-subtitle">
            {user?.destinationCountry
              ? `Your journey to ${user.destinationCountry}`
              : 'Your migration dashboard'}
          </p>
        </div>
        {!user?.isKycVerified && user?.role !== 'Agency' && (
          <Link to="/dashboard/kyc"
            className="flex items-center gap-2 bg-yellow-900/20 border 
                       border-yellow-700 text-yellow-400 px-4 py-2 rounded-lg 
                       text-sm hover:bg-yellow-900/30 transition-colors">
            <Shield size={16} />
            Complete KYC Verification
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gold-500/10 rounded-lg flex items-center 
                            justify-center">
              <Shield size={20} className="text-gold-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">KYC Status</p>
              <p className="font-semibold text-white">
                {user?.isKycVerified ? 'Verified' : 'Pending'}
              </p>
            </div>
          </div>
          {user?.isKycVerified
            ? <span className="badge-success"><CheckCircle size={10} className="mr-1" />Verified</span>
            : <span className="badge-warning"><Clock size={10} className="mr-1" />Not Verified</span>
          }
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center 
                            justify-center">
              <TrendingUp size={20} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Migration Status</p>
              <p className="font-semibold text-white">{MIGRATION_LABELS[user?.migrationStatus] ?? user?.migrationStatus}</p>
            </div>
          </div>
          <span className="badge-info">{user?.role}</span>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gold-500/10 rounded-lg flex items-center 
                            justify-center">
              <Star size={20} className="text-gold-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Your Rating</p>
              <p className="font-semibold text-white">
                {user?.averageRating > 0
                  ? `${user.averageRating} ★`
                  : 'No ratings yet'}
              </p>
            </div>
          </div>
          <span className="badge bg-navy-700 text-gray-300">
            {user?.destinationCountry || 'No destination set'}
          </span>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-display font-bold text-white mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map(({ to, icon: Icon, label, desc, color, bg }) => (
            <Link key={to} to={to} className="card-hover group">
              <div className={`w-12 h-12 ${bg} rounded-xl flex items-center 
                              justify-center mb-4 group-hover:scale-110 
                              transition-transform`}>
                <Icon size={24} className={color} />
              </div>
              <p className="font-semibold text-white text-sm">{label}</p>
              <p className="text-xs text-gray-500 mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Services */}
      {stats?.services?.items?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-white">
              Recent Services
            </h2>
            <Link to="/dashboard/services"
              className="text-gold-400 hover:text-gold-300 text-sm 
                         flex items-center gap-1 transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.services.items.map(service => (
              <Link key={service.id} to={`/dashboard/services/${service.id}`}
                className="card-hover">
                <div className="flex items-start justify-between mb-3">
                  <span className="badge-info text-xs">{service.category}</span>
                  <span className="text-gold-400 font-semibold text-sm">
                    ${service.price}
                  </span>
                </div>
                <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">
                  {service.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {service.description}
                </p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t 
                                border-navy-700">
                  <div className="w-6 h-6 bg-navy-700 rounded-full flex items-center 
                                  justify-center text-xs text-gold-400 font-bold">
                    {service.providerName?.charAt(0)}
                  </div>
                  <span className="text-xs text-gray-400">
                    {service.providerName}
                  </span>
                  {service.providerRating > 0 && (
                    <span className="text-xs text-gold-400 ml-auto">
                      ★ {service.providerRating}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}