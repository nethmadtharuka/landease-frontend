import { useEffect, useState } from 'react';
import { kycApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Shield, Upload, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

// Must match backend KycStatus enum (no JsonStringEnumConverter in Program.cs)
// integers are returned: Pending=0, UnderReview=1, Approved=2, Rejected=3
const KYC_STATUS = { Pending: 0, UnderReview: 1, Approved: 2, Rejected: 3 };

export default function KycPage() {
    const { user } = useAuth();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    // Backend KycSubmissionDto fields: IdDocument (required), Selfie (required), AddressProof (optional)
    const [files, setFiles] = useState({ idDocument: null, selfie: null, addressProof: null });

    useEffect(() => {
        kycApi.getStatus()
            .then(res => setStatus(res.data.data))
            .catch((err) => {
                // 404 = user has never submitted KYC — that's fine, show form
                // Any other error we still silently show the form but could log it
                if (err.response?.status !== 404) {
                    console.error('KYC status check failed:', err);
                }
                setStatus(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!files.idDocument) return toast.error('ID document is required');
        if (!files.selfie) return toast.error('Selfie photo is required');

        const fd = new FormData();
        // Field names must match backend KycSubmissionDto property names exactly
        fd.append('IdDocument', files.idDocument);
        fd.append('Selfie', files.selfie);
        if (files.addressProof) fd.append('AddressProof', files.addressProof);

        setSubmitting(true);
        try {
            await kycApi.submit(fd);
            toast.success('KYC documents submitted for review!');
            setStatus({ status: KYC_STATUS.Pending });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally { setSubmitting(false); }
    };

    const FileUpload = ({ label, field, accept = '.jpg,.jpeg,.png,.pdf', required = false }) => (
        <div>
            <label className="label">
                {label} {required && <span className="text-red-400">*</span>}
            </label>
            <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-200
        ${files[field] ? 'border-gold-500 bg-gold-500/5' : 'border-navy-600 bg-navy-900 hover:border-navy-500'}`}>
                <Upload size={24} className={files[field] ? 'text-gold-400' : 'text-gray-500'} />
                <p className="mt-2 text-sm text-gray-400">
                    {files[field] ? files[field].name : 'Click to upload or drag & drop'}
                </p>
                <p className="text-xs text-gray-600 mt-1">{accept.toUpperCase().replace(/\./g, '').replace(/,/g, ', ')}</p>
                <input type="file" accept={accept} className="hidden"
                    onChange={e => setFiles({ ...files, [field]: e.target.files[0] })} />
            </label>
        </div>
    );

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    // Already KYC verified (flag comes from user profile, most reliable source)
    if (user?.isKycVerified) return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <h1 className="section-title">KYC Verification</h1>
            <div className="card text-center py-16">
                <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={40} className="text-green-400" />
                </div>
                <h2 className="text-xl font-display font-bold text-white mb-2">Identity Verified!</h2>
                <p className="text-gray-400">Your KYC verification is complete. You have full access to all platform features.</p>
                <span className="badge-success mt-4 inline-flex"><Shield size={12} className="mr-1" /> KYC Verified</span>
            </div>
        </div>
    );

    // Pending or Under Review
    if (status !== null && (status.status === KYC_STATUS.Pending || status.status === KYC_STATUS.UnderReview)) return (
        <div className="max-w-2xl mx-auto animate-fade-in">
            <h1 className="section-title">KYC Verification</h1>
            <div className="card text-center py-16">
                <div className="w-20 h-20 bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock size={40} className="text-yellow-400" />
                </div>
                <h2 className="text-xl font-display font-bold text-white mb-2">Under Review</h2>
                <p className="text-gray-400">Your documents have been submitted and are being reviewed. This usually takes 1-2 business days.</p>
                <span className="badge-warning mt-4 inline-flex"><Clock size={12} className="mr-1" /> Pending Review</span>
            </div>
        </div>
    );

    // Rejected — allow re-submission
    if (status !== null && status.status === KYC_STATUS.Rejected) return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <h1 className="section-title">KYC Verification</h1>
            <div className="card bg-red-950/20 border-red-900/50 text-center py-10">
                <div className="w-20 h-20 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle size={40} className="text-red-400" />
                </div>
                <h2 className="text-xl font-display font-bold text-white mb-2">Verification Rejected</h2>
                {status.rejectionReason && (
                    <p className="text-red-300 text-sm bg-red-950/40 rounded-lg px-4 py-2 mt-2 inline-block">
                        Reason: {status.rejectionReason}
                    </p>
                )}
                <p className="text-gray-400 mt-3">Please upload new, clearer documents to resubmit.</p>
            </div>

            {/* Re-submission form */}
            <form onSubmit={handleSubmit} className="card space-y-6">
                <h2 className="text-lg font-display font-bold text-white">Resubmit Documents</h2>
                <FileUpload field="idDocument" label="Government-Issued ID" required />
                <FileUpload field="selfie" label="Selfie Photo (holding your ID)" accept=".jpg,.jpeg,.png" required />
                <FileUpload field="addressProof" label="Proof of Address (optional)" />
                <button type="submit" disabled={submitting}
                    className="btn-primary w-full flex items-center justify-center gap-2">
                    {submitting
                        ? <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                        : <><Shield size={16} /> Resubmit for Verification</>}
                </button>
            </form>
        </div>
    );

    // No KYC submitted yet — show the upload form
    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div>
                <h1 className="section-title">KYC Verification</h1>
                <p className="section-subtitle">Verify your identity to access all platform features</p>
            </div>

            {/* Info */}
            <div className="card bg-gold-500/5 border-gold-500/20">
                <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-gold-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-white">Why KYC verification?</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Verification builds trust in our community. Verified users can access more services,
                            post reviews, and are prioritized in search results.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-6">
                <h2 className="text-lg font-display font-bold text-white">Upload Documents</h2>
                <FileUpload field="idDocument" label="Government-Issued ID" required />
                <FileUpload field="selfie" label="Selfie Photo (holding your ID)" accept=".jpg,.jpeg,.png" required />
                <FileUpload field="addressProof" label="Proof of Address (optional)" />
                <button type="submit" disabled={submitting}
                    className="btn-primary w-full flex items-center justify-center gap-2">
                    {submitting
                        ? <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                        : <><Shield size={16} /> Submit for Verification</>}
                </button>
            </form>
        </div>
    );
}
