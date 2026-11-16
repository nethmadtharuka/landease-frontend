import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { IMG } from '../../lib/media';
import { safeNext } from '../../lib/format';
import AuthLayout, { BackHome } from '../../components/AuthLayout';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErr, setFieldErr] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fe = {};
    if (!form.email.trim()) fe.email = 'Enter your email address.';
    if (!form.password) fe.password = 'Enter your password.';
    setFieldErr(fe);
    if (Object.keys(fe).length) return;
    setLoading(true); setError('');
    try {
      await login({ email: form.email.trim(), password: form.password });
      toast.success('Welcome back!');
      navigate(safeNext(params.get('next')), { replace: true });
    } catch (err) {
      setError(err.response?.status === 401 ? 'Email or password is incorrect.' : apiErrorMessage(err, 'Sign-in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout image={IMG.airportBoard} caption="Welcome back. Your bookings, communities and tools are where you left them."
      topRight={{ right: <BackHome /> }}>
      <h1 className="display text-[40px]">Sign in</h1>
      <p className="text-muted text-[17px] mt-1">New to LandEase? <Link to="/register" className="link">Create an account</Link></p>
      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
        {error && <p role="alert" className="rounded-[14px] bg-[#FDECEC] text-[#7A1A12] px-4 py-3 text-[15px]">{error}</p>}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" className={`input ${fieldErr.email ? 'input-error' : ''}`} value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} aria-invalid={!!fieldErr.email} aria-describedby={fieldErr.email ? 'email-e' : undefined} />
          {fieldErr.email && <p id="email-e" className="field-error">{fieldErr.email}</p>}
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" className={`input pr-20 ${fieldErr.password ? 'input-error' : ''}`}
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} aria-invalid={!!fieldErr.password} aria-describedby={fieldErr.password ? 'pw-e' : undefined} />
            <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-2.5 rounded-[8px] bg-canvas text-[14px] font-semibold">{show ? 'Hide' : 'Show'}</button>
          </div>
          {fieldErr.password && <p id="pw-e" className="field-error">{fieldErr.password}</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-ink w-full h-12">{loading && <span className="spinner w-4 h-4" />}Sign in</button>
      </form>
    </AuthLayout>
  );
}
