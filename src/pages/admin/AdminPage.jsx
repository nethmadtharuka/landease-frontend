import { useEffect, useState } from 'react';
import { adminApi, kycApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, FileText } from 'lucide-react';

export default function AdminPage() {
    const [tab, setTab] = useState('kyc');
    const [kycList, setKycList] = useState([]);
    const [fraudFlags, setFraudFlags] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const [kyc, fraud] = await Promise.all([
                adminApi.getPendingKyc(),
                adminApi.getFraudFlags(),
            ]);
            setKycList(kyc.data.data || []);
            setFraudFlags(fraud.data.data || []);
        } catch { }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const reviewKyc = async (id, isApproved) => {
        try {
            // Backend KycReviewDto expects { isApproved: bool, rejectionReason?: string }
            await adminApi.reviewKyc(id, { isApproved });
            toast.success(isApproved ? 'KYC Approved' : 'KYC Rejected');
            load();
        } catch { toast.error('Action failed'); }
    };

    const resolveFlag = async (id) => {
        try {
            await adminApi.resolveFlag(id);
            toast.success('Flag resolved');
            load();
        } catch { toast.error('Action failed'); }
    };

    const TABS = [
        { id: 'kyc', label: `KYC Reviews (${kycList.length})`, icon: Shield },
        { id: 'fraud', label: `Fraud Flags (${fraudFlags.length})`, icon: AlertTriangle },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="section-title">Admin Panel</h1>
                <p className="section-subtitle">Manage users and platform safety</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Pending KYC', value: kycList.length, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
                    { label: 'Fraud Flags', value: fraudFlags.filter(f => !f.isResolved).length, color: 'text-red-400', bg: 'bg-red-900/20' },
                    { label: 'Total Reviews', value: kycList.length + fraudFlags.length, color: 'text-blue-400', bg: 'bg-blue-900/20' },
                    { label: 'Actions Today', value: 0, color: 'text-green-400', bg: 'bg-green-900/20' },
                ].map(s => (
                    <div key={s.label} className="card text-center">
                        <div className={`text-2xl font-display font-bold ${s.color} mb-1`}>{s.value}</div>
                        <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-navy-900 p-1 rounded-lg w-fit border border-navy-700">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setTab(id)}
                        className={`px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2
              ${tab === id ? 'bg-gold-500 text-navy-950' : 'text-gray-400 hover:text-white'}`}>
                        <Icon size={14} /> {label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="card space-y-2">
                            <div className="skeleton h-5 w-1/3 rounded" />
                            <div className="skeleton h-4 w-2/3 rounded" />
                        </div>
                    ))}
                </div>
            ) : tab === 'kyc' ? (
                kycList.length === 0 ? (
                    <div className="card text-center py-12">
                        <Shield size={40} className="text-navy-600 mx-auto mb-3" />
                        <p className="text-gray-400">No pending KYC reviews</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {kycList.map(k => (
                            <div key={k.id} className="card flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 bg-navy-700 rounded-full flex items-center justify-center text-gold-400 font-bold flex-shrink-0">
                                        {k.userName?.charAt(0) || k.userFullName?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white">{k.userName || k.userFullName}</p>
                                        <p className="text-sm text-gray-500">Submitted {new Date(k.submittedAt || k.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="badge-warning text-xs"><FileText size={10} className="mr-1" /> Pending</span>
                                    <button onClick={() => reviewKyc(k.id, true)}
                                        className="flex items-center gap-1 bg-green-900/30 hover:bg-green-900/50 text-green-400 px-3 py-1.5 rounded-lg text-sm transition-colors">
                                        <CheckCircle size={14} /> Approve
                                    </button>
                                    <button onClick={() => reviewKyc(k.id, false)}
                                        className="flex items-center gap-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-1.5 rounded-lg text-sm transition-colors">
                                        <XCircle size={14} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                fraudFlags.length === 0 ? (
                    <div className="card text-center py-12">
                        <AlertTriangle size={40} className="text-navy-600 mx-auto mb-3" />
                        <p className="text-gray-400">No fraud flags to review</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {fraudFlags.map(f => (
                            <div key={f.id} className="card">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={f.isResolved ? 'badge-success' : 'badge-danger'}>
                                                {f.isResolved ? 'Resolved' : 'Active'}
                                            </span>
                                            <span className="text-sm font-medium text-white">{f.flagType || f.type}</span>
                                        </div>
                                        <p className="text-sm text-gray-400">{f.description || f.reason}</p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            Flagged {new Date(f.createdAt).toLocaleDateString()}
                                            {f.entityId && ` · Entity: ${f.entityId}`}
                                        </p>
                                    </div>
                                    {!f.isResolved && (
                                        <button onClick={() => resolveFlag(f.id)}
                                            className="flex items-center gap-1 bg-green-900/30 hover:bg-green-900/50 text-green-400 px-3 py-1.5 rounded-lg text-sm transition-colors flex-shrink-0">
                                            <CheckCircle size={14} /> Resolve
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
