import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plane, Store, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { MIGRATION_STATUSES, SELF_REGISTRABLE_ROLES } from '../../lib/enums';
import { IMG } from '../../lib/media';
import AuthLayout, { BackHome } from '../../components/AuthLayout';

const ROLES = [
  { value: 'Migrant', icon: Plane, title: "I'm moving or have moved", desc: 'Book services, join communities, use the AI tools and raise SOS alerts.' },
  { value: 'Helper', icon: Store, title: 'I want to offer services', desc: "You'll verify your identity before publishing services, and receive SOS alerts in your destination country." },
];
const STATUS_DESC = { Planning: 'Still deciding or preparing', NewlyArrived: 'Just landed in your destination', Settled: 'Already established there' };
const STEPS = ['Account type', 'Your details', 'Your journey'];

// Mirrors backend RegisterValidator password rules.
const PW_RULES = [
  ['At least 8 characters', p => p.length >= 8 && p.length <= 72],
  ['One uppercase letter', p => /[A-Z]/.test(p)],
  ['One number', p => /[0-9]/.test(p)],
  ['One symbol', p => /[^a-zA-Z0-9]/.test(p)],
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [params] = useSearchParams();
  const preset = SELF_REGISTRABLE_ROLES.includes(params.get('role')) ? params.get('role') : 'Migrant';
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    role: preset, fullName: '', email: '', password: '', phoneNumber: '',
    originCountry: '', destinationCountry: '', migrationStatus: 'Planning',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors(er => ({ ...er, [k]: undefined })); };

  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.fullName.trim()) e.fullName = 'Enter your full name.';
      else if (form.fullName.trim().length > 100) e.fullName = 'Full name must be under 100 characters.';
      if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address.';
      if (!PW_RULES.every(([, f]) => f(form.password))) e.password = 'Your password needs to meet every rule below.';
      if (form.phoneNumber.length > 30) e.phoneNumber = 'Phone number must be under 30 characters.';
    }
    return e;
  };

  const next = (e) => {
    e.preventDefault();
    const er = validate(step);
    setErrors(er);
    if (Object.keys(er).length) return;
    if (step < 2) setStep(step + 1); else submit();
  };

  const submit = async () => {
    setLoading(true); setFormError('');
    try {
      const res = await authApi.register({
        ...form,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        originCountry: form.originCountry.trim() || null,
        destinationCountry: form.destinationCountry.trim() || null,
        phoneNumber: form.phoneNumber.trim() || null,
      });
      await loginWithToken(res.data.data.token);
      toast.success('Welcome to LandEase!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.response?.status === 409) { setStep(1); setErrors({ email: 'An account with this email already exists.' }); }
      else setFormError(apiErrorMessage(err, 'Registration failed. Please try again.'));
    } finally { setLoading(false); }
  };

  const fieldProps = (k) => ({ id: `r-${k}`, className: `input ${errors[k] ? 'input-error' : ''}`, value: form[k], onChange: set(k), 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `r-${k}-e` : undefined });
  const err = (k) => errors[k] && <p id={`r-${k}-e`} className="field-error">{errors[k]}</p>;

  return (
    <AuthLayout image={IMG.sunsetHiker} wide caption="Three short steps, and you're in."
      topRight={{ left: <span className="text-[15px] text-muted">Already have an account? <Link to="/login" className="link">Sign in</Link></span>, right: <BackHome label="Home" /> }}>
      <div className="flex gap-2" aria-hidden="true">
        {STEPS.map((s, i) => <span key={s} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-electric' : 'bg-line'}`} />)}
      </div>
      <p className="text-[14.5px] text-muted font-medium mt-4">Step {step + 1} of 3 · {STEPS[step]}</p>

      <form onSubmit={next} noValidate>
        {step === 0 && (
          <>
            <h1 className="display text-[34px] mt-2">How will you use LandEase?</h1>
            <fieldset className="mt-6 space-y-3">
              <legend className="sr-only">Account type</legend>
              {ROLES.map(({ value, icon: I, title, desc }) => (
                <label key={value} className={`flex gap-4 p-4 rounded-[18px] border cursor-pointer transition-colors ${form.role === value ? 'border-electric ring-4 ring-electric/10 bg-[#F8F9FF]' : 'border-line hover:border-twotone'}`}>
                  <input type="radio" name="role" value={value} checked={form.role === value} onChange={set('role')} className="sr-only" />
                  <span className="icon-tile"><I size={18} /></span>
                  <span><span className="block font-semibold text-[16.5px]">{title}</span><span className="block text-muted text-[15px]">{desc}</span></span>
                </label>
              ))}
            </fieldset>
            <p className="text-[14px] text-muted mt-4">Agency and staff accounts are created by LandEase.</p>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="display text-[34px] mt-2">About you</h1>
            <div className="space-y-4 mt-6">
              <div><label htmlFor="r-fullName" className="label">Full name</label><input {...fieldProps('fullName')} autoComplete="name" maxLength={100} />{err('fullName')}</div>
              <div><label htmlFor="r-email" className="label">Email</label><input {...fieldProps('email')} type="email" autoComplete="email" maxLength={150} />{err('email')}</div>
              <div><label htmlFor="r-phoneNumber" className="label">Phone <span className="text-muted font-normal">(optional)</span></label>
                <input {...fieldProps('phoneNumber')} type="tel" autoComplete="tel" placeholder="+61 400 000 000" maxLength={30} />
                <p className="hint">SOS responders can call you on this number.</p>{err('phoneNumber')}</div>
              <div>
                <label htmlFor="r-password" className="label">Password</label>
                <div className="relative">
                  <input {...fieldProps('password')} type={showPw ? 'text' : 'password'} autoComplete="new-password" maxLength={72} className={`${fieldProps('password').className} pr-20`} />
                  <button type="button" onClick={() => setShowPw(s => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2.5 rounded-[8px] bg-canvas text-[14px] font-semibold">{showPw ? 'Hide' : 'Show'}</button>
                </div>
                {err('password')}
                <ul className="grid grid-cols-2 gap-1.5 mt-2.5 text-[13.5px]" aria-label="Password rules">
                  {PW_RULES.map(([label, f]) => {
                    const ok = f(form.password);
                    return <li key={label} className={`flex items-center gap-1.5 ${ok ? 'text-[#0F7B4F]' : 'text-muted'}`}>{ok ? <Check size={14} /> : <X size={14} />}{label}</li>;
                  })}
                </ul>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="display text-[34px] mt-2">Your journey</h1>
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <div><label htmlFor="r-originCountry" className="label">Origin country</label><input {...fieldProps('originCountry')} placeholder="e.g. Sri Lanka" maxLength={100} /></div>
              <div><label htmlFor="r-destinationCountry" className="label">Destination country</label><input {...fieldProps('destinationCountry')} placeholder="e.g. Australia" maxLength={100} /></div>
            </div>
            <p className="hint">Used to route SOS alerts and suggest services and communities.</p>
            <fieldset className="mt-5">
              <legend className="label">Where are you in your move?</legend>
              <div className="grid sm:grid-cols-3 gap-2.5">
                {MIGRATION_STATUSES.map(s => (
                  <label key={s.value} className={`p-3.5 rounded-[14px] border cursor-pointer ${form.migrationStatus === s.value ? 'border-electric ring-4 ring-electric/10 bg-[#F8F9FF]' : 'border-line hover:border-twotone'}`}>
                    <input type="radio" name="status" value={s.value} checked={form.migrationStatus === s.value} onChange={set('migrationStatus')} className="sr-only" />
                    <span className="block font-semibold text-[15px]">{s.label}</span><span className="block text-[13px] text-muted">{STATUS_DESC[s.value]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {formError && <p role="alert" className="mt-5 rounded-[14px] bg-[#FDECEC] text-[#7A1A12] px-4 py-3 text-[15px]">{formError}</p>}
        <div className="flex gap-3 mt-7">
          {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="btn-ghost h-12 px-6">Back</button>}
          <button type="submit" disabled={loading} className="btn-ink flex-1 h-12">{loading && <span className="spinner w-4 h-4" />}{step < 2 ? 'Continue' : 'Create account'}</button>
        </div>
      </form>
    </AuthLayout>
  );
}
