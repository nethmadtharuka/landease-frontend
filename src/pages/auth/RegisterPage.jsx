import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import {
  UserPlus, ArrowRight, ArrowLeft, Check,
  User, Mail, Lock, Phone, Globe, MapPin, Eye, EyeOff
} from 'lucide-react';

const ROLES = [
  {
    value: 0,
    label: 'Migrant',
    emoji: '🌍',
    desc: 'I need settlement support and services',
    color: 'from-blue-500/20 to-indigo-500/20',
    border: 'border-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    value: 1,
    label: 'Helper',
    emoji: '🤝',
    desc: 'I offer services to help migrants settle',
    color: 'from-green-500/20 to-emerald-500/20',
    border: 'border-green-500',
    bg: 'bg-green-500/10',
  },
  {
    value: 2,
    label: 'Agency',
    emoji: '🏢',
    desc: 'I manage and verify users on the platform',
    color: 'from-purple-500/20 to-violet-500/20',
    border: 'border-purple-500',
    bg: 'bg-purple-500/10',
  },
];

const STATUSES = [
  { value: 0, label: 'Planning', emoji: '📋', desc: 'Still deciding or preparing' },
  { value: 1, label: 'Newly Arrived', emoji: '✈️', desc: 'Just landed in destination' },
  { value: 2, label: 'Settled', emoji: '🏡', desc: 'Already established there' },
];

/* ── Step indicator ──────────────────────────────────────── */
function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold
                           transition-all duration-500
                           ${i < currentStep
              ? 'bg-gold-500 text-navy-950 scale-100'
              : i === currentStep
                ? 'bg-gold-500/20 border-2 border-gold-500 text-gold-400 scale-110'
                : 'bg-white/5 border border-white/10 text-gray-600'
            }`}>
            {i < currentStep ? <Check size={14} /> : i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div className={`flex-1 h-px w-8 transition-all duration-700
                             ${i < currentStep ? 'bg-gold-500' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Floating input ──────────────────────────────────────── */
function FloatingInput({ label, icon: Icon, type = 'text', placeholder, value, onChange, required, rightSlot }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
        {Icon && <Icon size={13} className="text-gray-500" />}
        {label}{required && <span className="text-gold-500">*</span>}
      </label>
      <div className={`relative rounded-xl border transition-all duration-200
                       ${focused ? 'border-gold-500 shadow-lg shadow-gold-500/10' : 'border-white/8 hover:border-white/15'}`}>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-navy-900 border-0 text-white placeholder-gray-500 rounded-xl
                     px-4 py-3.5 outline-none text-sm pr-10"
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState(0); // 0: role, 1: credentials, 2: migration
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    role: null, originCountry: '', destinationCountry: '',
    migrationStatus: 0, phoneNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [slideDir, setSlideDir] = useState('right'); // 'right' | 'left'
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const goNext = () => {
    if (step === 0 && form.role === null) return toast.error('Please select your role.');
    if (step === 1) {
      if (!form.fullName.trim()) return toast.error('Full name is required.');
      if (!form.email.trim()) return toast.error('Email is required.');
      if (form.password.length < 8) return toast.error('Password must be at least 8 characters.');
    }
    setSlideDir('right');
    setStep(s => s + 1);
  };

  const goBack = () => {
    setSlideDir('left');
    setStep(s => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.register({
        ...form,
        role: parseInt(form.role),
        migrationStatus: parseInt(form.migrationStatus),
      });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const STEP_LABELS = ['Choose Role', 'Your Info', 'Migration Details'];

  return (
    <div className="min-h-screen bg-navy-950 flex overflow-hidden">

      {/* ── LEFT PANEL — decorative ──────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-col justify-between p-14 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute top-[-5%] right-[-15%] w-[65%] h-[65%] rounded-full
                          bg-indigo-500/8 blur-3xl animate-blob" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full
                          bg-gold-500/8 blur-3xl animate-blob"
            style={{ animationDelay: '6s' }} />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }} />
          <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/8 to-transparent" />
        </div>

        {/* Logo */}
        <div className="relative z-10 animate-slide-down">
          <Link to="/" className="flex items-center group">
            <span className="font-display text-2xl font-bold text-white group-hover:text-gold-400 transition-colors">
              LandEase
            </span>
          </Link>
        </div>

        {/* Progress visual */}
        <div className="relative z-10 space-y-8 animate-slide-up">
          <div>
            <h2 className="font-display text-4xl font-bold text-white mb-3 leading-tight">
              One platform.<br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Every step
              </span>{' '}covered.
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              Get set up in under 2 minutes and start accessing services immediately.
            </p>
          </div>

          {/* Step preview */}
          <div className="space-y-3">
            {STEP_LABELS.map((label, i) => (
              <div key={label}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-500
                             ${i === step
                    ? 'border-gold-500/40 bg-gold-500/8 shadow-lg shadow-gold-500/10'
                    : i < step
                      ? 'border-green-500/20 bg-green-500/5'
                      : 'border-white/5 opacity-40'
                  }`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs
                                 transition-all duration-500
                                 ${i < step
                    ? 'bg-green-500 text-white'
                    : i === step
                      ? 'bg-gold-500 text-navy-950'
                      : 'bg-white/10 text-gray-500'
                  }`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-sm font-medium transition-colors
                                  ${i === step ? 'text-white' : i < step ? 'text-green-400' : 'text-gray-600'}`}>
                  {label}
                </span>
                {i === step && (
                  <span className="ml-auto text-xs text-gold-400 animate-pulse">Current</span>
                )}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: '2 min', label: 'Setup time' },
              { value: 'Free', label: 'No cost ever' },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl bg-white/3 border border-white/5 text-center">
                <p className="font-display font-bold text-gold-400 text-xl">{s.value}</p>
                <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-gray-600 text-xs">© 2026 LandEase.</p>
      </div>

      {/* ── RIGHT PANEL — SLIDING FORM ───────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">

        {/* Bg accents */}
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-56 h-56 rounded-full bg-indigo-500/7 blur-3xl pointer-events-none" />

        <div className="w-full max-w-lg relative z-10">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Link to="/">
              <span className="font-display text-lg font-bold text-white">LandEase</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-6">
            <p className="text-gold-400 text-sm font-semibold tracking-wider uppercase mb-2">Create Account</p>
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-white mb-1">
              {step === 0 && 'Who are you?'}
              {step === 1 && 'About you'}
              {step === 2 && 'Your journey'}
            </h1>
            <p className="text-gray-500 text-sm">
              {step === 0 && 'Choose the role that best describes you.'}
              {step === 1 && 'Enter your personal details to get started.'}
              {step === 2 && 'Tell us about your migration story.'}
            </p>
          </div>

          {/* Step indicator */}
          <StepIndicator currentStep={step} totalSteps={3} />

          {/* ── STEP 0: ROLE SELECTION ────────────────────── */}
          {step === 0 && (
            <div className="space-y-3 animate-scale-in">
              {ROLES.map(role => (
                <button key={role.value} type="button"
                  onClick={() => setForm({ ...form, role: role.value })}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border text-left
                               transition-all duration-300 group
                               ${form.role === role.value
                      ? `${role.border} ${role.bg} shadow-lg scale-[1.01]`
                      : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5'
                    }`}>
                  <span className="text-3xl">{role.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-base transition-colors
                                   ${form.role === role.value ? 'text-white' : 'text-gray-200'}`}>
                      {role.label}
                    </p>
                    <p className="text-gray-400 text-sm mt-0.5">{role.desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                   transition-all duration-200
                                   ${form.role === role.value
                      ? 'border-gold-400 bg-gold-400'
                      : 'border-white/20'
                    }`}>
                    {form.role === role.value && <Check size={11} className="text-navy-950" />}
                  </div>
                </button>
              ))}

              <button type="button" onClick={goNext}
                className="w-full mt-4 py-4 rounded-xl font-bold text-navy-950 text-base
                           bg-gradient-to-r from-gold-400 to-gold-500
                           hover:from-gold-300 hover:to-gold-400
                           shadow-xl shadow-gold-500/25 hover:shadow-gold-500/40
                           transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]
                           flex items-center justify-center gap-2 group">
                Continue
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* ── STEP 1: CREDENTIALS ──────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 animate-scale-in">
              <div className="grid grid-cols-2 gap-4">
                <FloatingInput label="Full Name" icon={User} placeholder="Jane Smith"
                  value={form.fullName} onChange={set('fullName')} required />
                <FloatingInput label="Phone Number" icon={Phone} placeholder="+1234567890"
                  value={form.phoneNumber} onChange={set('phoneNumber')} />
              </div>
              <FloatingInput label="Email" icon={Mail} type="email" placeholder="you@example.com"
                value={form.email} onChange={set('email')} required />
              <FloatingInput
                label="Password" icon={Lock} type={showPass ? 'text' : 'password'}
                placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required
                rightSlot={
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="text-gray-500 hover:text-gray-300 transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={goBack}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-white/10
                             text-gray-400 hover:text-white hover:border-white/20
                             transition-all duration-200 font-medium text-sm">
                  <ArrowLeft size={16} />
                  Back
                </button>
                <button type="button" onClick={goNext}
                  className="flex-1 py-3.5 rounded-xl font-bold text-navy-950
                             bg-gradient-to-r from-gold-400 to-gold-500
                             hover:from-gold-300 hover:to-gold-400
                             shadow-xl shadow-gold-500/25 hover:shadow-gold-500/40
                             transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]
                             flex items-center justify-center gap-2 group text-base">
                  Continue
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: MIGRATION ────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 animate-scale-in">

                <div className="grid grid-cols-2 gap-4">
                  <FloatingInput label="Origin Country" icon={Globe} placeholder="e.g. Sri Lanka"
                    value={form.originCountry} onChange={set('originCountry')} />
                  <FloatingInput label="Destination" icon={MapPin} placeholder="e.g. Australia"
                    value={form.destinationCountry} onChange={set('destinationCountry')} />
                </div>

                {/* Migration Status */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300">Migration Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {STATUSES.map(s => (
                      <button key={s.value} type="button"
                        onClick={() => setForm({ ...form, migrationStatus: s.value })}
                        className={`p-3 rounded-xl border text-center transition-all duration-200
                                     ${form.migrationStatus === s.value
                            ? 'border-gold-500 bg-gold-500/10 text-white shadow-md'
                            : 'border-white/8 bg-white/3 text-gray-400 hover:border-white/20'
                          }`}>
                        <div className="text-2xl mb-1">{s.emoji}</div>
                        <p className="text-xs font-semibold">{s.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-tight hidden sm:block">{s.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary card */}
                <div className="p-4 rounded-xl bg-white/3 border border-white/8 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Summary</p>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">Role: </span>
                      <span className="text-white font-medium">
                        {ROLES.find(r => r.value === form.role)?.emoji} {ROLES.find(r => r.value === form.role)?.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Name: </span>
                      <span className="text-white font-medium">{form.fullName || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={goBack}
                    className="flex items-center gap-2 px-5 py-3.5 rounded-xl border border-white/10
                               text-gray-400 hover:text-white hover:border-white/20
                               transition-all duration-200 font-medium text-sm">
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3.5 rounded-xl font-bold text-navy-950
                               bg-gradient-to-r from-gold-400 to-gold-500
                               hover:from-gold-300 hover:to-gold-400
                               shadow-xl shadow-gold-500/25 hover:shadow-gold-500/40
                               transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]
                               flex items-center justify-center gap-2 disabled:opacity-60 text-base">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus size={18} />
                        Create My Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Sign-in link */}
          <p className="text-center text-gray-600 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-gold-400 hover:text-gold-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}