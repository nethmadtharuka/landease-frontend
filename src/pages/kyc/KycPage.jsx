import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { IdCard, ScanFace, Home, CheckCircle2, Clock, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { kycApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { KYC_STATUS } from '../../lib/enums';
import { IMG } from '../../lib/media';
import { shortDate } from '../../lib/format';
import { PageSpinner } from '../../components/ui';

const MAX_BYTES = 5 * 1024 * 1024; // KycSubmissionValidator
// Field names must match backend KycSubmissionDto: IdDocument (required), Selfie (required), AddressProof (optional).
const FIELDS = [
  { key: 'idDocument', api: 'IdDocument', icon: IdCard, title: 'Government ID', required: true, hint: 'Passport, national ID or driver licence. JPG, PNG or PDF, up to 5 MB.', accept: '.jpg,.jpeg,.png,.pdf' },
  { key: 'selfie', api: 'Selfie', icon: ScanFace, title: 'Selfie holding your ID', required: true, hint: 'Your face and the ID must both be clear. JPG or PNG, up to 5 MB.', accept: '.jpg,.jpeg,.png' },
  { key: 'addressProof', api: 'AddressProof', icon: Home, title: 'Proof of address', required: false, hint: 'A recent bill or lease. JPG, PNG or PDF, up to 5 MB.', accept: '.jpg,.jpeg,.png,.pdf' },
];

function FileRow({ field, file, error, onPick, onClear }) {
  const input = useRef(null);
  const I = field.icon;
  const preview = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  return (
    <div className={`rounded-[18px] border border-dashed p-4 flex flex-wrap items-center gap-4 ${error ? 'border-sos bg-[#FDF6F5]' : file ? 'border-electric bg-[#F8F9FF]' : 'border-[#B8C2D0] bg-[#F5F8FC]'}`}>
      <span className="w-14 h-14 rounded-[14px] bg-white border border-line inline-flex items-center justify-center text-electric overflow-hidden shrink-0">
        {preview ? <img src={preview} alt="" className="w-full h-full object-cover" /> : file ? <FileText size={20} /> : <I size={20} />}
      </span>
      <div className="flex-1 min-w-[180px]">
        <p className="font-semibold text-[16.5px]" id={`${field.key}-label`}>{field.title} <span className="font-normal text-muted text-[14px]">({field.required ? 'required' : 'optional'})</span></p>
        <p className="text-[14px] text-muted break-all">{file ? file.name : field.hint}</p>
        {error && <p className="field-error mt-1">{error}</p>}
      </div>
      <input ref={input} type="file" accept={field.accept} className="sr-only" aria-labelledby={`${field.key}-label`}
        onChange={e => { onPick(e.target.files[0]); e.target.value = ''; }} />
      <div className="flex gap-2">
        {file && <button type="button" onClick={onClear} aria-label={`Remove ${field.title}`} className="w-10 h-10 rounded-full bg-white border border-line inline-flex items-center justify-center"><X size={15} /></button>}
        <button type="button" onClick={() => input.current?.click()} className="btn-ghost bg-white">{file ? 'Replace' : 'Choose file'}</button>
      </div>
    </div>
  );
}

export default function KycPage() {
  const { user, refreshUser } = useAuth();
  const isHelper = user?.role === 'Helper';
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState({ idDocument: null, selfie: null, addressProof: null });
  const [errors, setErrors] = useState({});
  const [consent, setConsent] = useState(false);
  const [resubmit, setResubmit] = useState(false);

  useEffect(() => {
    kycApi.getStatus()
      .then(res => {
        setStatus(res.data.data);
        // Approval is reflected on the profile flag; refresh so gates elsewhere update.
        if (res.data.data?.status === KYC_STATUS.Approved && !user?.isKycVerified) refreshUser().catch(() => {});
      })
      .catch(err => { if (err.response?.status !== 404) toast.error(apiErrorMessage(err, 'Could not load your verification status.')); setStatus(null); })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (key, file) => {
    if (!file) return;
    const field = FIELDS.find(f => f.key === key);
    const ext = `.${file.name.split('.').pop().toLowerCase()}`;
    if (!field.accept.split(',').includes(ext)) { setErrors(e => ({ ...e, [key]: `Use ${field.accept.replace(/\./g, '').toUpperCase().replace(/,/g, ', ')}.` })); return; }
    if (file.size > MAX_BYTES) { setErrors(e => ({ ...e, [key]: `${file.name} is larger than 5 MB.` })); return; }
    setErrors(e => ({ ...e, [key]: undefined })); setFiles(f => ({ ...f, [key]: file }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!files.idDocument) er.idDocument = 'Add your government ID.';
    if (!files.selfie) er.selfie = 'Add a selfie holding your ID.';
    if (!consent) er.consent = 'Please confirm your consent.';
    setErrors(er);
    if (Object.keys(er).length) return;
    const fd = new FormData();
    FIELDS.forEach(f => files[f.key] && fd.append(f.api, files[f.key]));
    setSubmitting(true);
    try {
      const res = await kycApi.submit(fd);
      setStatus(res.data.data); setResubmit(false);
      toast.success('Documents submitted for review.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Submission failed.'));
    } finally { setSubmitting(false); }
  };

  if (loading) return <PageSpinner />;

  const verified = user?.isKycVerified || status?.status === KYC_STATUS.Approved;
  const pending = status && [KYC_STATUS.Pending, KYC_STATUS.UnderReview].includes(status.status);
  const rejected = status?.status === KYC_STATUS.Rejected;
  const showForm = !verified && !pending && (!rejected || resubmit);

  return (
    <div>
      <h1 className="page-title">Identity verification</h1>
      <p className="page-sub text-[17px]">{isHelper ? 'Required before you can publish services.' : 'Optional for migrants. Adds a verified badge to your profile and community posts.'}</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 mt-6 items-start">
        <div className="card p-6">
          {verified ? (
            <div className="text-center py-10">
              <span className="w-16 h-16 rounded-full bg-[#E7F6EF] text-[#0F7B4F] inline-flex items-center justify-center"><CheckCircle2 size={30} /></span>
              <h2 className="text-[26px] mt-4">Identity verified</h2>
              <p className="text-muted mt-1">{status?.reviewedAt ? `Approved on ${shortDate(status.reviewedAt)}.` : 'Your identity is verified.'}</p>
              {isHelper && <Link to="/dashboard/services/new" className="btn-ink mt-6">List your first service</Link>}
            </div>
          ) : pending ? (
            <div className="text-center py-10">
              <span className="w-16 h-16 rounded-full bg-[#FFF4E0] text-[#9A5B00] inline-flex items-center justify-center"><Clock size={30} /></span>
              <h2 className="text-[26px] mt-4">Under review</h2>
              <p className="text-muted mt-1">Submitted {shortDate(status.submittedAt)}. This usually takes 1–2 business days — we&apos;ll email you the decision.</p>
            </div>
          ) : rejected && !resubmit ? (
            <div className="py-6">
              <h2 className="text-[26px]">Verification declined</h2>
              <p className="mt-3 rounded-[14px] bg-[#FDECEC] text-[#7A1A12] px-4 py-3"><b>Reason:</b> {status.rejectionReason}</p>
              <p className="text-muted mt-3">Upload new, clearer documents to try again.</p>
              <button type="button" onClick={() => setResubmit(true)} className="btn-ink mt-5">Resubmit documents</button>
            </div>
          ) : null}

          {showForm && (
            <form onSubmit={submit} noValidate>
              <h2 className="text-[22px] mb-4">Upload your documents</h2>
              <div className="space-y-3">
                {FIELDS.map(f => <FileRow key={f.key} field={f} file={files[f.key]} error={errors[f.key]} onPick={file => pick(f.key, file)} onClear={() => setFiles(x => ({ ...x, [f.key]: null }))} />)}
              </div>
              <label className="flex items-start gap-3 mt-5 text-[15.5px]">
                <input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); setErrors(er => ({ ...er, consent: undefined })); }} className="w-5 h-5 mt-0.5 accent-electric" />
                I consent to LandEase staff reviewing these documents to verify my identity.
              </label>
              {errors.consent && <p className="field-error">{errors.consent}</p>}
              <button type="submit" disabled={submitting} className="btn-ink mt-5">{submitting && <span className="spinner w-4 h-4" />}{submitting ? 'Uploading…' : 'Submit for review'}</button>
            </form>
          )}
        </div>
        <aside className="space-y-4">
          <div className="rounded-card bg-[#B0D236] h-[220px] flex items-center justify-center"><img src={IMG.padlock} alt="" className="h-[200px]" /></div>
          <div className="card p-5">
            <h2 className="font-sans font-semibold text-[17px] tracking-normal">How we protect your documents</h2>
            <ul className="list-disc pl-5 mt-2.5 space-y-1.5 text-muted text-[15px]">
              <li>Stored in private storage, never public</li><li>Only reviewing staff can open them</li><li>Review links expire after 15 minutes</li><li>Used only to verify your identity</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
