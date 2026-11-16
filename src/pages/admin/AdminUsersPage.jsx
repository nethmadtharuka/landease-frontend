import { useRef, useState } from 'react';
import { Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { ROLE_LABEL } from '../../lib/enums';
import { Avatar, BackendBadge } from '../../components/ui';

const ROLES = [
  ['Migrant', 'Books services, joins communities, raises SOS.'],
  ['Helper', 'Service provider: lists services after identity checks; responds to SOS.'],
  ['Agency', 'Vetted organisation: reviews KYC and moderation, responds to SOS.'],
  ['Admin', 'Platform staff: everything Agency can do, plus role changes.'],
];

/** Admin-only. Changing a role works today (PUT /api/Admin/users/{id}/role); listing users needs backend gap G14. */
export default function AdminUsersPage() {
  const { user } = useAuth();
  const [open, setOpen] = useState(null); // preset role
  const [form, setForm] = useState({ id: '', role: 'Agency' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [changed, setChanged] = useState([]);
  const dialog = useRef(null);

  const show = (role) => { setForm({ id: '', role }); setError(''); setOpen(role); setTimeout(() => dialog.current?.showModal(), 0); };
  const close = () => { dialog.current?.close(); setOpen(null); };

  const submit = async (e) => {
    e.preventDefault();
    const id = Number(form.id);
    if (!Number.isInteger(id) || id <= 0) { setError('Enter the numeric user ID.'); return; }
    if (id === user.id) { setError("You can't change your own role."); return; }
    setBusy(true); setError('');
    try {
      const res = await adminApi.changeRole(id, form.role);
      setChanged(c => [res.data.data, ...c.filter(x => x.id !== id)]);
      toast.success(`${res.data.data.fullName} is now ${ROLE_LABEL[form.role].toLowerCase()}. It applies at their next sign-in.`);
      close();
    } catch (err) {
      setError(err.response?.status === 404 ? 'No user has that ID.' : apiErrorMessage(err, 'Could not change the role.'));
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="page-title">Users &amp; roles</h1><p className="page-sub text-[17px]">Admin only. Create Agency accounts and change roles.</p></div>
        <button type="button" onClick={() => show('Agency')} className="btn-ink">Create Agency account</button>
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-3 text-[14.5px] text-muted"><BackendBadge id="G14 user list" />Role changes work now; the user list needs a backend endpoint.</p>

      <div className="card mt-6 overflow-hidden">
        <div className="bg-[#F5F8FC] px-5 py-3 text-[14px] text-muted font-medium grid grid-cols-[1.6fr_1fr_auto] gap-4"><span>User</span><span>Role</span><span>Change role</span></div>
        {changed.length === 0 ? (
          <div className="p-10 text-center">
            <span className="icon-tile mx-auto"><Users size={20} /></span>
            <p className="font-display text-[22px] mt-4">Users can&apos;t be listed yet</p>
            <p className="text-muted mt-1 max-w-[460px] mx-auto">To change a role today, enter the person&apos;s user ID. To create an Agency account, ask the organisation to sign up, then change their role to Agency.</p>
            <button type="button" onClick={() => show('Helper')} className="btn-ghost mt-5">Change a role by user ID</button>
          </div>
        ) : changed.map(u => (
          <div key={u.id} className="px-5 py-3.5 border-t border-line grid grid-cols-[1.6fr_1fr_auto] gap-4 items-center">
            <span className="flex items-center gap-3 min-w-0"><Avatar name={u.fullName} size={36} /><span className="min-w-0"><b className="block font-semibold truncate">{u.fullName}</b><span className="block text-[14px] text-muted truncate">{u.email} · ID {u.id}</span></span></span>
            <span><span className="badge-cancelled">{ROLE_LABEL[u.role]}</span></span>
            <button type="button" onClick={() => { show(u.role); setForm({ id: String(u.id), role: u.role }); }} className="btn-ghost btn-sm">Change</button>
          </div>
        ))}
      </div>
      {changed.length > 0 && <p className="text-[14px] text-muted mt-3">Changed in this session. Role changes apply at the user&apos;s next sign-in (within 60 minutes).</p>}

      {open && (
        <dialog ref={dialog} onClose={() => setOpen(null)} aria-labelledby="role-title" className="backdrop:bg-navy/40 rounded-card p-0 w-[min(520px,calc(100vw-24px))] shadow-float">
          <form onSubmit={submit} className="p-6">
            <div className="flex items-start justify-between gap-3"><h2 id="role-title" className="text-[24px]">{open === 'Agency' ? 'Create Agency account' : 'Change role'}</h2>
              <button type="button" onClick={close} aria-label="Close" className="w-10 h-10 rounded-full bg-canvas inline-flex items-center justify-center"><X size={18} /></button></div>
            <label htmlFor="role-id" className="label mt-4">User ID</label>
            <input id="role-id" inputMode="numeric" className={`input ${error ? 'input-error' : ''}`} value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value.replace(/\D/g, '') }))} />
            <fieldset className="mt-4"><legend className="label">New role</legend>
              <div className="space-y-2">{ROLES.map(([r, d]) => (
                <label key={r} className={`flex gap-3 p-3 rounded-[14px] border cursor-pointer ${form.role === r ? 'border-electric bg-[#F8F9FF]' : 'border-line'}`}>
                  <input type="radio" name="role" value={r} checked={form.role === r} onChange={() => setForm(f => ({ ...f, role: r }))} className="mt-1 accent-electric" />
                  <span><b className="block">{ROLE_LABEL[r]}</b><span className="text-[14px] text-muted">{d}</span></span>
                </label>))}</div>
            </fieldset>
            <p className="note mt-4">Takes effect next time they sign in (within 60 minutes).</p>
            {error && <p role="alert" className="field-error">{error}</p>}
            <div className="flex justify-end gap-2 mt-5"><button type="button" onClick={close} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={busy} className="btn-ink">{busy && <span className="spinner w-4 h-4" />}Change role</button></div>
          </form>
        </dialog>
      )}
    </div>
  );
}
