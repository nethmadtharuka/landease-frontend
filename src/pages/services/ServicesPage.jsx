import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { servicesApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Star, ArrowRight, Briefcase, Filter } from 'lucide-react';

const CATEGORIES = ['All', 'Housing', 'Legal', 'Healthcare', 'Language', 'Employment', 'Financial', 'Community', 'Transport', 'Education'];

export default function ServicesPage() {
    const { user } = useAuth();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const params = { page, pageSize: 9 };
                if (search) params.search = search;
                if (category !== 'All') params.category = category;
                const res = await servicesApi.getAll(params);
                setServices(res.data.data?.items || []);
                setTotalPages(res.data.data?.totalPages || 1);
            } catch { setServices([]); }
            finally { setLoading(false); }
        };
        fetch();
    }, [search, category, page]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="section-title">Services</h1>
                    <p className="section-subtitle">Find settlement support from verified helpers</p>
                </div>
                {(user?.role === 'Helper' || user?.role === 'Agency') && (
                    <Link to="/services/new" className="btn-primary flex items-center gap-2 text-sm">
                        <Plus size={16} /> List a Service
                    </Link>
                )}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        className="input pl-11"
                        placeholder="Search services..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </div>

            {/* Category Chips */}
            <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => { setCategory(cat); setPage(1); }}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
              ${category === cat
                                ? 'bg-gold-500 text-navy-950'
                                : 'bg-navy-800 text-gray-400 border border-navy-700 hover:border-navy-500 hover:text-white'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="card space-y-3">
                            <div className="skeleton h-4 w-1/3 rounded" />
                            <div className="skeleton h-6 w-3/4 rounded" />
                            <div className="skeleton h-4 w-full rounded" />
                            <div className="skeleton h-4 w-2/3 rounded" />
                        </div>
                    ))}
                </div>
            ) : services.length === 0 ? (
                <div className="card text-center py-16">
                    <Briefcase size={48} className="text-navy-600 mx-auto mb-4" />
                    <p className="text-gray-400">No services found</p>
                    <p className="text-gray-600 text-sm mt-1">Try a different search or category</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map(service => (
                        <Link key={service.id} to={`/services/${service.id}`} className="card-hover group flex flex-col">
                            <div className="flex items-start justify-between mb-3">
                                <span className="badge-info text-xs">{service.category}</span>
                                <span className="text-gold-400 font-bold text-lg">${service.price}</span>
                            </div>
                            <h3 className="font-display font-bold text-white mb-2 line-clamp-2 flex-1">{service.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">{service.description}</p>
                            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-navy-700">
                                <div className="w-7 h-7 bg-navy-700 rounded-full flex items-center justify-center text-xs text-gold-400 font-bold flex-shrink-0">
                                    {service.providerName?.charAt(0)}
                                </div>
                                <span className="text-xs text-gray-400 truncate flex-1">{service.providerName}</span>
                                {service.providerRating > 0 && (
                                    <span className="text-xs text-gold-400 flex items-center gap-1">
                                        <Star size={11} fill="currentColor" /> {service.providerRating}
                                    </span>
                                )}
                                <ArrowRight size={14} className="text-gray-600 group-hover:text-gold-400 transition-colors ml-1" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                        className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">← Prev</button>
                    <span className="text-gray-400 text-sm">Page {page} of {totalPages}</span>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                        className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Next →</button>
                </div>
            )}
        </div>
    );
}
