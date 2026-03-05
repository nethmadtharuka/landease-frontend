import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { servicesApi } from '../../api/endpoints';
import toast from 'react-hot-toast';
import { ArrowLeft, Briefcase } from 'lucide-react';

const CATEGORIES = ['Housing', 'Legal', 'Healthcare', 'Language', 'Employment', 'Financial', 'Community', 'Transport', 'Education'];

export default function CreateServicePage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '', description: '', category: 'Housing',
        price: '', location: '', tags: ''
    });
    const [loading, setLoading] = useState(false);

    const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await servicesApi.create({
                ...form,
                price: parseFloat(form.price),
                tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
            });
            toast.success('Service listed successfully!');
            navigate('/services');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create service');
        } finally { setLoading(false); }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <button onClick={() => navigate('/services')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                <ArrowLeft size={16} /> Back to Services
            </button>

            <div>
                <h1 className="section-title">List a Service</h1>
                <p className="section-subtitle">Offer your expertise to migrants in need</p>
            </div>

            <form onSubmit={handleSubmit} className="card space-y-5">
                <div>
                    <label className="label">Service Title</label>
                    <input className="input" placeholder="e.g. Legal Consultation for Visa" value={form.title} onChange={set('title')} required />
                </div>

                <div>
                    <label className="label">Description</label>
                    <textarea className="input resize-none h-32" placeholder="Describe what you offer in detail..."
                        value={form.description} onChange={set('description')} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Category</label>
                        <select className="input" value={form.category} onChange={set('category')}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Price (USD)</label>
                        <input type="number" className="input" placeholder="50" min="0" step="0.01"
                            value={form.price} onChange={set('price')} required />
                    </div>
                </div>

                <div>
                    <label className="label">Location</label>
                    <input className="input" placeholder="e.g. Sydney, Australia or Remote"
                        value={form.location} onChange={set('location')} />
                </div>

                <div>
                    <label className="label">Tags <span className="text-gray-500 font-normal">(comma-separated)</span></label>
                    <input className="input" placeholder="visa, housing, legal"
                        value={form.tags} onChange={set('tags')} />
                </div>

                <button type="submit" disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2">
                    {loading
                        ? <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                        : <><Briefcase size={16} /> Publish Service</>}
                </button>
            </form>
        </div>
    );
}
