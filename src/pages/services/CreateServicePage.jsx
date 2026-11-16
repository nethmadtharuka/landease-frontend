import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { servicesApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { SERVICE_CATEGORIES } from '../../lib/enums';
import { PageSpinner, ServiceCard } from '../../components/ui';
import { ConfirmDialog } from '../../components/reviews';
import StatusPage from '../public/StatusPage';

const COUNTRIES = ['Australia', 'Canada', 'United Kingdom', 'New Zealand', 'Germany', 'Japan', 'United States', 'Portugal'];

/** Create (/dashboard/services/new) and edit (/dashboard/services/:id/edit) a listing. */
export default function CreateServicePage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', category: '', price: '', destinationCountry: user?.destinationCountry || '', isActive: true });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const blocked = !isEdit && !user?.isKycVerified;

  useEffect(() => {
    if (!isEdit) return;
    servicesApi.getById(id).then(r => {
      const s = r.data.data;
      if (s.providerId !== user?.id) { setForbidden(true); return; }
      setForm({ title: s.title, description: s.description, category: s.category, price: String(s.price), destinationCountry: s.destinationCountry, isActive: s.isActive });
    }).catch(err => { toast.error(apiErrorMessage(err, 'Could not load this service.')); navigate('/dashboard/my-services'); })
      .finally(() => setLoading(false));
  }, [id, isEdit, user?.id, navigate]);

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setErrors(er => ({ ...er, [k]: undefined })); };

  // Mirrors CreateServiceValidator / UpdateServiceValidator.
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Add a title.'; else if (form.title.length > 200) e.title = 'Title must be under 200 characters.';
    if (!form.category) e.category = 'Choose a category.';
    if (!form.description.trim()) e.description = 'Describe what you offer.'; else if (form.description.length > 2000) e.description = 'Description must be under 2000 characters.';
    if (form.price === '' || Number(form.price) < 0 || Number.isNaN(Number(form.price))) e.price = 'Enter a price of 0 or more.';
    if (!form.destinationCountry.trim()) e.destinationCountry = 'Choose where you deliver this service.';
    return e;
  };

  const save = async (e) => {
    e?.preventDefault();
    const er = validate(); setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    const body = { title: form.title.trim(), description: form.description.trim(), category: form.category, price: Number(form.price), destinationCountry: form.destinationCountry.trim() };
    try {
      if (isEdit) {
        await servicesApi.update(id, { ...body, isActive: form.isActive });
        toast.success('Service updated.');
        navigate('/dashboard/my-services');
      } else {
        const created = (await servicesApi.create(body)).data.data;
        toast.success('Service published.');
        navigate(`/dashboard/services/${created.id}`);
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, isEdit ? 'Could not update the service.' : 'Could not publish the service.'));
    } finally { setSaving(false); setConfirmOff(false); }
  };
  const submit = (e) => { e.preventDefault(); if (isEdit && !form.isActive) setConfirmOff(true); else save(); };

  if (loading) return <PageSpinner />;
  if (forbidden) return <StatusPage code={403} />;
  const countries = form.destinationCountry && !COUNTRIES.includes(form.destinationCountry) ? [form.destinationCountry, ...COUNTRIES] : COUNTRIES;
  const preview = { title: form.title || 'Your service title', description: form.description || 'A short description appears here.', category: form.category || 'Category',
    destinationCountry: form.destinationCountry || 'Destination', price: Number(form.price) || 0, providerName: user?.fullName, providerIsKycVerified: user?.isKycVerified, providerRating: user?.averageRating };

  return (
    <div>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[14.5px] text-muted sm:hidden mb-3">
        <Link to="/dashboard/my-services">My services</Link><ChevronRight size={14} /><span className="text-ink font-medium">{isEdit ? 'Edit service' : 'List a service'}</span>
      </nav>
      <h1 className="page-title">{isEdit ? 'Edit service' : 'List a new service'}</h1>
      <p className="page-sub text-[17px]">Migrants see this exactly as previewed.</p>

      {blocked && (
        <div className="card p-4 mt-5 flex flex-wrap items-center gap-3" role="note">
          <span className="icon-tile bg-[#FFF4E0] text-[#9A5B00]"><ShieldAlert size={18} /></span>
          <p className="flex-1 min-w-[220px]">Only identity-verified providers can publish services.</p>
          <Link to="/dashboard/kyc" className="btn-ink">Verify your identity</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 mt-5 items-start">
        <form onSubmit={submit} noValidate className="card p-6">
          <label htmlFor="svc-title" className="label">Title</label>
          <input id="svc-title" className={`input ${errors.title ? 'input-error' : ''}`} maxLength={200} placeholder="e.g. Airport pickup and first-night setup" value={form.title} onChange={set('title')} aria-invalid={!!errors.title} />
          <div className="flex justify-between mt-1"><span>{errors.title && <span className="field-error">{errors.title}</span>}</span><span className="text-[13px] text-muted">{form.title.length} / 200</span></div>

          <fieldset className="mt-3">
            <legend className="label">Category</legend>
            <div className="flex flex-wrap gap-2">
              {SERVICE_CATEGORIES.map(c => (
                <button key={c.value} type="button" aria-pressed={form.category === c.value} onClick={() => { setForm(f => ({ ...f, category: c.value })); setErrors(er => ({ ...er, category: undefined })); }}
                  className={form.category === c.value ? 'chip-active' : 'chip'}>{c.label}</button>
              ))}
            </div>
            {errors.category && <p className="field-error">{errors.category}</p>}
          </fieldset>

          <label htmlFor="svc-desc" className="label mt-5">Description</label>
          <textarea id="svc-desc" className={`input h-40 resize-y ${errors.description ? 'input-error' : ''}`} maxLength={2000} placeholder="What's included, how long it takes, languages you speak" value={form.description} onChange={set('description')} aria-invalid={!!errors.description} />
          <div className="flex justify-between mt-1"><span>{errors.description && <span className="field-error">{errors.description}</span>}</span><span className="text-[13px] text-muted">{form.description.length} / 2000</span></div>

          <div className="grid sm:grid-cols-2 gap-4 mt-3">
            <div>
              <label htmlFor="svc-price" className="label">Price</label>
              <div className="relative"><input id="svc-price" type="number" min="0" step="0.01" inputMode="decimal" className={`input pr-14 ${errors.price ? 'input-error' : ''}`} value={form.price} onChange={set('price')} aria-invalid={!!errors.price} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-muted">USD</span></div>
              <p className="hint">Shown in USD to everyone.</p>{errors.price && <p className="field-error">{errors.price}</p>}
            </div>
            <div>
              <label htmlFor="svc-country" className="label">Destination country</label>
              <select id="svc-country" className={`input ${errors.destinationCountry ? 'input-error' : ''}`} value={form.destinationCountry} onChange={set('destinationCountry')}>
                <option value="">Choose a country</option>{countries.map(c => <option key={c}>{c}</option>)}
              </select>
              <p className="hint">Where you deliver this service.</p>{errors.destinationCountry && <p className="field-error">{errors.destinationCountry}</p>}
            </div>
          </div>

          {isEdit && (
            <div className="mt-5 rounded-[16px] bg-[#F5F8FC] px-4 py-3 flex items-center justify-between gap-4">
              <span><span className="block font-semibold">Listing is active</span><span className="block text-[14px] text-muted">Inactive listings disappear from Explore.</span></span>
              <button type="button" role="switch" aria-checked={form.isActive} aria-label="Listing is active" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                className={`w-[50px] h-[30px] rounded-full p-[3px] inline-flex shrink-0 ${form.isActive ? 'bg-electric justify-end' : 'bg-[#C9D0DA] justify-start'}`}><span className="w-6 h-6 rounded-full bg-white" /></button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-5 mt-5 border-t border-line">
            <Link to="/dashboard/my-services" className="btn-ghost">Cancel</Link>
            <button type="submit" disabled={saving || blocked} className="btn-ink">{saving && <span className="spinner w-4 h-4" />}{isEdit ? 'Save changes' : 'Publish service'}</button>
          </div>
        </form>

        <aside className="space-y-3 lg:sticky lg:top-24">
          <p className="text-[14.5px] font-medium text-muted">Live preview</p>
          <div className="pointer-events-none" inert><ServiceCard service={preview} to="#" /></div>
          <p className="note border border-dashed border-[#BBD3EE]">Listings don&apos;t have photos yet; the cover shows a photo of the destination country.</p>
        </aside>
      </div>
      {confirmOff && <ConfirmDialog title={`Hide “${form.title}”?`} body="Inactive listings disappear from Explore and can't be found again from LandEase yet (backend gap G03)." confirmLabel="Save and hide" busy={saving} onConfirm={() => save()} onCancel={() => setConfirmOff(false)} />}
    </div>
  );
}
