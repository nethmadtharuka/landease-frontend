import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, ArrowRight, Shield, Globe, Users, Star } from 'lucide-react';

const FEATURES = [
  { icon: Shield, text: 'KYC-verified helpers & agencies' },
  { icon: Globe, text: 'Services in 40+ countries' },
  { icon: Users, text: '8,000+ migrants supported' },
  { icon: Star, text: 'Rated 4.9/5 by our community' },
];

/* Floating review card shown on the left panel */
function ReviewCard({ name, country, text, delay }) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/8 backdrop-blur-sm animate-slide-up"
      style={{ animationDelay: delay }}>
      <p className="text-gray-300 text-sm leading-relaxed mb-3">"{text}"</p>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600
                        flex items-center justify-center text-navy-950 text-xs font-bold">
          {name[0]}
        </div>
        <div>
          <p className="text-white text-xs font-medium">{name}</p>
          <p className="text-gray-500 text-xs">{country}</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex overflow-hidden">

      {/* ── LEFT PANEL ──────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-14 overflow-hidden">

        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full
                          bg-gold-500/6 blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-[-5%] w-[50%] h-[50%] rounded-full
                          bg-indigo-500/8 blur-3xl animate-blob"
            style={{ animationDelay: '5s' }} />
          <div className="absolute top-[40%] left-[40%] w-[35%] h-[35%] rounded-full
                          bg-blue-500/6 blur-3xl animate-blob"
            style={{ animationDelay: '10s' }} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }} />
          {/* Right border gradient */}
          <div className="absolute right-0 top-0 bottom-0 w-px
                          bg-gradient-to-b from-transparent via-white/8 to-transparent" />
        </div>

        <div className="relative z-10 flex items-center gap-3 animate-slide-down">
          <Link to="/" className="flex items-center group">
            <span className="font-display text-2xl font-bold text-white group-hover:text-gold-400 transition-colors">
              LandEase
            </span>
          </Link>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-10 animate-slide-up">
          <div>
            <h2 className="font-display text-5xl font-bold leading-tight text-white mb-4">
              Your journey to a<br />
              <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-amber-400
                               bg-clip-text text-transparent">
                new home
              </span>{' '}starts here.
            </h2>
            <p className="text-gray-400 text-base leading-relaxed max-w-sm">
              Thousands of migrants found housing, legal help, and community through LandEase.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <div key={text}
                className="flex items-center gap-3 animate-slide-in-left"
                style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20
                                flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-gold-400" />
                </div>
                <span className="text-gray-300 text-sm">{text}</span>
              </div>
            ))}
          </div>

          {/* Review cards */}
          <div className="space-y-3">
            <ReviewCard
              name="Amina H."
              country="Migrant · Canada"
              text="Found my apartment and a translator within 48 hours of landing."
              delay="200ms"
            />
            <ReviewCard
              name="Rafael S."
              country="Migrant · Germany"
              text="The AI assistant saved me hours of government website confusion."
              delay="350ms"
            />
          </div>
        </div>

        <p className="relative z-10 text-gray-600 text-xs">© 2026 LandEase. Built for migrants.</p>
      </div>

      {/* ── RIGHT PANEL — FORM ──────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 relative">

        {/* Background blur circles */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 rounded-full bg-indigo-500/7 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10 animate-scale-in">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-10">
            <Link to="/">
              <span className="font-display text-xl font-bold text-white">LandEase</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <p className="text-gold-400 text-sm font-semibold tracking-wider uppercase mb-2">Welcome back</p>
            <h1 className="font-display text-4xl font-bold text-white mb-2">Sign In</h1>
            <p className="text-gray-400">
              New here?{' '}
              <Link to="/register"
                className="text-gold-400 hover:text-gold-300 font-semibold transition-colors inline-flex items-center gap-1 group">
                Create an account
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Email address</label>
              <div className={`relative rounded-xl border transition-all duration-200
                              ${focused === 'email'
                  ? 'border-gold-500 shadow-lg shadow-gold-500/10'
                  : 'border-white/8 hover:border-white/15'}`}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  required
                  className="w-full bg-navy-900 border-0 text-white placeholder-gray-500 rounded-xl
                             px-4 py-3.5 outline-none text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <div className={`relative rounded-xl border transition-all duration-200
                              ${focused === 'password'
                  ? 'border-gold-500 shadow-lg shadow-gold-500/10'
                  : 'border-white/8 hover:border-white/15'}`}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  required
                  className="w-full bg-navy-900 border-0 text-white placeholder-gray-500 rounded-xl
                             px-4 py-3.5 pr-12 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500
                             hover:text-gray-300 transition-colors">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 rounded-xl font-bold text-navy-950 text-base
                         bg-gradient-to-r from-gold-400 to-gold-500
                         hover:from-gold-300 hover:to-gold-400
                         disabled:opacity-60 disabled:cursor-not-allowed
                         shadow-xl shadow-gold-500/25 hover:shadow-gold-500/40
                         transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                         flex items-center justify-center gap-2.5">
              {loading ? (
                <div className="w-5 h-5 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In to LandEase
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="flex-1 h-px bg-white/6" />
            <span className="text-gray-600 text-xs">secure & encrypted</span>
            <div className="flex-1 h-px bg-white/6" />
          </div>

          {/* Register CTA */}
          <div className="p-4 rounded-xl bg-white/3 border border-white/6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account yet?{' '}
              <Link to="/register" className="text-gold-400 hover:text-gold-300 font-semibold transition-colors">
                Join LandEase free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}