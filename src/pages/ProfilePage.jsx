import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/endpoints';
import { apiErrorMessage } from '../lib/apiError';
import { MIGRATION_STATUSES, migrationStatusLabel, ROLE_LABEL } from '../lib/enums';
import { coverFor } from '../lib/media';
import { Avatar, BackendBadge } from '../components/ui';

const CHECKS = [
  ['fullName', 'your name'], ['phoneNumber', 'a phone number'], ['originCountry', 'your origin country'], ['destinationCountry', 'your destination country'],
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(null); // 'personal' | 'journey'
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const blank = () => ({
    fullName: user?.fullName || '', phoneNumber: user?.phoneNumber || '', originCountry: user?.originCountry || '',
    destinationCountry: user?.destinationCountry || '', migrationStatus: user?.migrationStatus || 'Planning',
  });
  const [form, setForm] = useState(blank);
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({}); };

  const start = (section) => { setForm(blank()); setErrors({}); setEditing(section); };
  const save = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.fullName.trim()) er.fullName = 'Enter your full name.';
    if (form.fullName.length > 100) er.fullName = 'Full name must be under 100 characters.';
    if (form.phoneNumber.length > 30) er.phoneNumber = 'Phone number must be under 30 characters.';
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      await authApi.updateProfile({
        fullName: form.fullName.trim(),
        phoneNumber: form.phoneNumber.trim() || null,
        originCountry: form.originCountry.trim() || null,
        destinationCountry: form.destinationCountry.trim() || null,
        migrationStatus: form.migrationStatus,
      });
      await refreshUser();
      toast.success('Profile updated.');
      setEditing(null);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not update your profile.'));
    } finally { setSaving(false); }
  };

  const done = [...CHECKS.filter(([k]) => user?.[k]), ['email']].length;
  const pct = Math.round((done / (CHECKS.length + 1)) * 100);
  const missing = CHECKS.find(([k]) => !user?.[k]);
  const isHelper = user?.role === 'Helper';

  const actions = (
    <div className="flex gap-2 mt-5">
      <button type="submit" disabled={saving} className="btn-ink">{saving && <span className="spinner w-4 h-4" />}Save changes</button>
      <button type="button" onClick={() => setEditing(null)} disabled={saving} className="btn-ghost">Cancel</button>
    </div>
  );

  return (
    <div className="space-y-5">
      <section className="card overflow-hidden">
        <div className="relative h-[150px]"><img src={coverFor(user?.destinationCountry)} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-royal/40 mix-blend-multiply" /></div>
        <div className="px-6 pb-6 pt-3 flex flex-col md:flex-row md:items-start gap-4">
          <span className="rounded-full border-4 border-white w-fit -mt-14 shrink-0"><Avatar name={user?.fullName} size={96} /></span>
          <div className="flex-1">
            <h1 className="display text-[32px]">{user?.fullName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="badge-cancelled h-7 px-3">{ROLE_LABEL[user?.role]}</span>
              <span className={user?.isKycVerified ? 'badge-completed h-7 px-3' : 'badge-cancelled h-7 px-3'}>{user?.isKycVerified ? 'Identity verified' : 'Identity not verified'}</span>
              {!user?.isKycVerified && <Link to="/dashboard/kyc" className="link text-[15px]">Verify{isHelper ? '' : ' (optional)'}</Link>}
              {user?.averageRating > 0 && <span className="badge-requested h-7 px-3">★ {user.averageRating}</span>}
            </div>
          </div>
          <div className="md:w-[220px]">
            <div className="flex justify-between text-[14.5px] font-semibold"><span>Profile complete</span><span>{pct}%</span></div>
            <div className="h-2 rounded-full bg-[#E3E8F0] mt-1.5 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness">
              <div className="h-full bg-electric rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[13.5px] text-muted mt-1.5">{missing ? `Add ${missing[1]} to reach 100%.` : 'Everything is filled in.'}</p>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        <form onSubmit={save} className="card p-6" noValidate>
          <div className="flex items-center justify-between"><h2 className="text-[22px]">Personal details</h2>
            {editing !== 'personal' && <button type="button" onClick={() => start('personal')} className="btn-ghost btn-sm">Edit</button>}</div>
          {editing === 'personal' ? (
            <div className="space-y-4 mt-4">
              <div><label htmlFor="p-name" className="label">Full name</label>
                <input id="p-name" className={`input ${errors.fullName ? 'input-error' : ''}`} value={form.fullName} onChange={set('fullName')} maxLength={100} aria-invalid={!!errors.fullName} />
                {errors.fullName && <p className="field-error">{errors.fullName}</p>}</div>
              <div><label htmlFor="p-email" className="label">Email</label><input id="p-email" className="input" value={user?.email || ''} disabled /><p className="hint">Email can&apos;t be changed yet.</p></div>
              <div><label htmlFor="p-phone" className="label">Phone</label>
                <input id="p-phone" type="tel" className={`input ${errors.phoneNumber ? 'input-error' : ''}`} value={form.phoneNumber} onChange={set('phoneNumber')} maxLength={30} placeholder="+61 400 000 000" />
                <p className="hint">SOS responders see this number.</p>{errors.phoneNumber && <p className="field-error">{errors.phoneNumber}</p>}</div>
              {actions}
            </div>
          ) : (
            <dl className="space-y-3.5 mt-4">
              <div><dt className="text-[14px] text-muted font-medium">Full name</dt><dd className="text-[16.5px]">{user?.fullName}</dd></div>
              <div><dt className="text-[14px] text-muted font-medium">Email</dt><dd className="text-[16.5px]">{user?.email} <span className="text-[13.5px] text-muted">· can&apos;t be changed yet</span></dd></div>
              <div><dt className="text-[14px] text-muted font-medium">Phone</dt><dd className="text-[16.5px]">{user?.phoneNumber || 'Not added — add one so SOS responders can call you'}</dd></div>
            </dl>
          )}
        </form>

        <form onSubmit={save} className="card p-6" noValidate>
          <div className="flex items-center justify-between"><h2 className="text-[22px]">Migration journey</h2>
            {editing !== 'journey' && <button type="button" onClick={() => start('journey')} className="btn-ghost btn-sm">Edit</button>}</div>
          {editing === 'journey' ? (
            <div className="space-y-4 mt-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label htmlFor="p-from" className="label">From</label><input id="p-from" className="input" value={form.originCountry} onChange={set('originCountry')} maxLength={100} placeholder="e.g. Sri Lanka" /></div>
                <div><label htmlFor="p-to" className="label">To</label><input id="p-to" className="input" value={form.destinationCountry} onChange={set('destinationCountry')} maxLength={100} placeholder="e.g. Australia" /></div>
              </div>
              <fieldset><legend className="label">Status</legend>
                <div className="seg">{MIGRATION_STATUSES.map(s => <button key={s.value} type="button" aria-pressed={form.migrationStatus === s.value} onClick={() => setForm({ ...form, migrationStatus: s.value })}>{s.label}</button>)}</div>
              </fieldset>
              <p className="note">Changing your destination changes which SOS responders are alerted. Reload the SOS page after saving.</p>
              {actions}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 rounded-[14px] bg-[#F5F8FC] px-4 py-3"><p className="text-[13.5px] text-muted font-medium">From</p><p className="font-semibold text-[17px]">{user?.originCountry || '—'}</p></div>
                <span className="text-twotone" aria-hidden="true">→</span>
                <div className="flex-1 rounded-[14px] bg-[#F5F8FC] px-4 py-3"><p className="text-[13.5px] text-muted font-medium">To</p><p className="font-semibold text-[17px]">{user?.destinationCountry || '—'}</p></div>
              </div>
              <p className="mt-3 text-[16px]">Status: <b>{migrationStatusLabel(user?.migrationStatus)}</b></p>
              <p className="note mt-4 border border-dashed border-[#BBD3EE]">Your destination routes SOS alerts to responders there and shapes service suggestions.</p>
            </>
          )}
        </form>
      </div>

      <section className="card p-6 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-[22px]">Profile photo, bio and languages</h2><p className="text-muted">Not stored by LandEase yet — initials are shown everywhere instead.</p></div>
        <BackendBadge id="G01" />
      </section>
    </div>
  );
}
