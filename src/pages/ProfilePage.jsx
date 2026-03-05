import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/endpoints';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Globe, Shield, Star, MapPin, Edit2, Check, X } from 'lucide-react';

// Backend returns MigrationStatus as integer (no JsonStringEnumConverter)
// 0 = Planning, 1 = NewlyArrived, 2 = Settled
const MIGRATION_STATUS_LABELS = { 0: 'Planning', 1: 'Newly Arrived', 2: 'Settled' };

export default function ProfilePage() {
    const { user, login } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        fullName: user?.fullName || '',
        phoneNumber: user?.phoneNumber || '',
        originCountry: user?.originCountry || '',
        destinationCountry: user?.destinationCountry || '',
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            await authApi.updateProfile(form);
            toast.success('Profile updated successfully!');
            setEditing(false);
            // Refresh user in context by re-fetching profile
            const res = await authApi.getProfile();
            // Update auth context — re-use existing pattern
            // Since AuthContext doesn't expose setUser directly, we trigger a page reload
            // to sync the updated profile from the server
            window.location.reload();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const InfoRow = ({ icon: Icon, label, value }) => (
        <div className="flex items-center gap-4 py-4 border-b border-navy-700 last:border-0">
            <div className="w-10 h-10 bg-navy-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-gold-400" />
            </div>
            <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-white font-medium">{value || '—'}</p>
            </div>
        </div>
    );

    const migrationLabel = MIGRATION_STATUS_LABELS[user?.migrationStatus] ?? user?.migrationStatus ?? 'Unknown';

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="section-title">My Profile</h1>
                    <p className="section-subtitle">Manage your personal information</p>
                </div>
                {!editing ? (
                    <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2 text-sm">
                        <Edit2 size={15} /> Edit Profile
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={handleSave} disabled={saving}
                            className="btn-primary flex items-center gap-2 text-sm py-2 px-4">
                            {saving
                                ? <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                                : <><Check size={15} /> Save</>}
                        </button>
                        <button onClick={() => setEditing(false)} disabled={saving}
                            className="btn-secondary flex items-center gap-2 text-sm py-2 px-4">
                            <X size={15} /> Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Avatar Card */}
            <div className="card flex items-center gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-navy-600 to-navy-800 rounded-2xl flex items-center justify-center text-3xl font-bold text-gold-400 flex-shrink-0">
                    {user?.fullName?.charAt(0)}
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-display font-bold text-white">{user?.fullName}</h2>
                    <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="badge-info">{user?.role}</span>
                        {user?.isKycVerified && (
                            <span className="badge-success">
                                <Shield size={10} className="mr-1" /> KYC Verified
                            </span>
                        )}
                        {user?.averageRating > 0 && (
                            <span className="badge bg-gold-500/10 text-gold-400 border border-gold-500/20">
                                <Star size={10} className="mr-1" /> {user.averageRating} Rating
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Info / Edit Card */}
            <div className="card">
                <h3 className="text-lg font-display font-bold text-white mb-4">Personal Information</h3>
                {!editing ? (
                    <>
                        <InfoRow icon={User} label="Full Name" value={user?.fullName} />
                        <InfoRow icon={Mail} label="Email" value={user?.email} />
                        <InfoRow icon={Phone} label="Phone" value={user?.phoneNumber} />
                        <InfoRow icon={MapPin} label="Origin Country" value={user?.originCountry} />
                        <InfoRow icon={Globe} label="Destination Country" value={user?.destinationCountry} />
                    </>
                ) : (
                    <div className="space-y-4">
                        {[
                            { label: 'Full Name', field: 'fullName', placeholder: 'John Smith' },
                            { label: 'Phone Number', field: 'phoneNumber', placeholder: '+1234567890' },
                            { label: 'Origin Country', field: 'originCountry', placeholder: 'e.g. Sri Lanka' },
                            { label: 'Destination Country', field: 'destinationCountry', placeholder: 'e.g. Australia' },
                        ].map(({ label, field, placeholder }) => (
                            <div key={field}>
                                <label className="label">{label}</label>
                                <input
                                    className="input"
                                    placeholder={placeholder}
                                    value={form[field]}
                                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Migration Status', value: migrationLabel, color: 'text-blue-400' },
                    { label: 'Total Reviews', value: user?.totalReviews ?? 0, color: 'text-gold-400' },
                    { label: 'Average Rating', value: user?.averageRating > 0 ? `${user.averageRating} ★` : 'N/A', color: 'text-green-400' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="card text-center">
                        <p className={`text-2xl font-display font-bold ${color} mb-1`}>{value}</p>
                        <p className="text-xs text-gray-500">{label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
