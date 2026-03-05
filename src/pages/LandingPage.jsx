import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Globe, Shield, Users, MessageSquare, Star,
    AlertTriangle, ArrowRight, CheckCircle, Zap,
    MapPin, Heart, Award, ChevronDown, Play
} from 'lucide-react';

/* ── Animated counter ─────────────────────────────────────── */
function Counter({ end, suffix = '', duration = 2000 }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const step = end / (duration / 16);
                let cur = 0;
                const timer = setInterval(() => {
                    cur = Math.min(cur + step, end);
                    setCount(Math.floor(cur));
                    if (cur >= end) clearInterval(timer);
                }, 16);
            }
        }, { threshold: 0.5 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end, duration]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Feature card ─────────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc, color, delay }) {
    return (
        <div
            className="group relative p-6 rounded-2xl border border-white/5 bg-white/3
                 backdrop-blur-sm hover:border-white/15 hover:-translate-y-2
                 transition-all duration-500 cursor-default overflow-hidden"
            style={{ animationDelay: delay }}
        >
            {/* Glowing bg on hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                       bg-gradient-to-br ${color} blur-xl`} />
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4
                         bg-gradient-to-br ${color} p-0.5`}>
                    <div className="w-full h-full bg-navy-900 rounded-[10px] flex items-center justify-center">
                        <Icon size={22} className="text-white" />
                    </div>
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

/* ── Testimonial card ─────────────────────────────────────── */
function TestimonialCard({ name, country, role, text, stars, delay }) {
    return (
        <div
            className="p-6 rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm
                 hover:border-gold-500/30 transition-all duration-300 animate-slide-up"
            style={{ animationDelay: delay }}
        >
            <div className="flex gap-1 mb-3">
                {[...Array(stars)].map((_, i) => (
                    <Star key={i} size={14} className="text-gold-400 fill-gold-400" />
                ))}
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">"{text}"</p>
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-600
                        flex items-center justify-center font-bold text-navy-950 text-sm">
                    {name[0]}
                </div>
                <div>
                    <p className="text-white font-medium text-sm">{name}</p>
                    <p className="text-gray-500 text-xs">{role} · {country}</p>
                </div>
            </div>
        </div>
    );
}

const FEATURES = [
    {
        icon: Globe,
        title: 'Find Your Footing',
        desc: 'Access housing, legal, translation, and settlement services tailored to your destination country.',
        color: 'from-blue-500/20 to-indigo-500/20',
        delay: '0ms',
    },
    {
        icon: Shield,
        title: 'KYC Verified',
        desc: 'Every helper and agency is identity-verified, so you always deal with trusted, accountable people.',
        color: 'from-green-500/20 to-emerald-500/20',
        delay: '80ms',
    },
    {
        icon: MessageSquare,
        title: 'AI Guidance',
        desc: 'Our AI assistant answers visa questions, explains legal terms, and guides you through forms 24/7.',
        color: 'from-purple-500/20 to-violet-500/20',
        delay: '160ms',
    },
    {
        icon: Users,
        title: 'Community',
        desc: 'Join country-specific communities, share experiences, and build your network before you even land.',
        color: 'from-gold-500/20 to-amber-500/20',
        delay: '240ms',
    },
    {
        icon: AlertTriangle,
        title: 'SOS Emergency',
        desc: 'One tap to alert our support network. Real humans respond within minutes in a crisis.',
        color: 'from-red-500/20 to-rose-500/20',
        delay: '320ms',
    },
    {
        icon: MapPin,
        title: 'Location-Aware',
        desc: 'Services automatically filter based on where you are and where you\'re headed.',
        color: 'from-teal-500/20 to-cyan-500/20',
        delay: '400ms',
    },
];

const TESTIMONIALS = [
    {
        name: 'Amina Hassan',
        country: 'Canada',
        role: 'Migrant',
        text: 'LandEase helped me find an affordable apartment and a translator within 48 hours of landing. I felt so supported.',
        stars: 5,
        delay: '0ms',
    },
    {
        name: 'Rafael Souza',
        country: 'Germany',
        role: 'Migrant',
        text: 'The AI assistant explained my work permit requirements better than the government website ever could.',
        stars: 5,
        delay: '100ms',
    },
    {
        name: 'Fatima Al-Rashid',
        country: 'UK',
        role: 'Helper',
        text: 'As a certified translator, LandEase connected me with dozens of clients. The platform is incredibly professional.',
        stars: 5,
        delay: '200ms',
    },
];

export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToFeatures = () => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-navy-950 text-white overflow-x-hidden">

            {/* ── NAV ─────────────────────────────────────────────── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
                       ${scrolled ? 'bg-navy-950/90 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-navy-950/50' : ''}`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="font-display text-xl font-bold text-white tracking-tight">LandEase</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        {['Features', 'About', 'Community'].map(item => (
                            <button key={item}
                                onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })}
                                className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
                                {item}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/login"
                            className="text-gray-300 hover:text-white text-sm font-medium px-4 py-2
                         rounded-lg transition-colors hover:bg-white/5">
                            Sign In
                        </Link>
                        <Link to="/register"
                            className="text-sm font-semibold px-5 py-2.5 rounded-xl
                         bg-gradient-to-r from-gold-400 to-gold-500 text-navy-950
                         hover:from-gold-300 hover:to-gold-400 transition-all duration-200
                         shadow-lg shadow-gold-500/25 hover:shadow-gold-500/40 hover:scale-105 active:scale-95">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO ────────────────────────────────────────────── */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">

                {/* Animated background blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[15%] left-[10%] w-96 h-96 rounded-full
                          bg-gold-500/8 blur-3xl animate-blob" />
                    <div className="absolute top-[40%] right-[5%] w-80 h-80 rounded-full
                          bg-indigo-500/10 blur-3xl animate-blob"
                        style={{ animationDelay: '4s' }} />
                    <div className="absolute bottom-[15%] left-[30%] w-72 h-72 rounded-full
                          bg-blue-500/8 blur-3xl animate-blob"
                        style={{ animationDelay: '8s' }} />
                    {/* Grid overlay */}
                    <div className="absolute inset-0 opacity-[0.03]"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
                            backgroundSize: '60px 60px',
                        }} />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-16 items-center py-20">

                    {/* Left — copy */}
                    <div className="animate-slide-up">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                            bg-gold-500/10 border border-gold-500/25 text-gold-400 text-xs font-semibold mb-8">
                            <Zap size={12} className="fill-gold-400" />
                            Trusted by 8,000+ migrants worldwide
                        </div>

                        <h1 className="font-display text-5xl lg:text-7xl font-bold leading-[1.05] mb-6">
                            Your new home,{' '}
                            <span className="relative inline-block">
                                <span className="bg-gradient-to-r from-gold-300 via-gold-400 to-gold-500
                                 bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_200%]">
                                    simplified.
                                </span>
                                <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" fill="none">
                                    <path d="M0 3 Q50 0 100 3 Q150 6 200 3" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7" />
                                </svg>
                            </span>
                        </h1>

                        <p className="text-gray-400 text-lg leading-relaxed max-w-lg mb-10">
                            LandEase connects migrants with verified helpers, essential services, and an AI-powered guide —
                            every step from visa to settling in.
                        </p>

                        <div className="flex flex-wrap gap-4 mb-12">
                            <Link to="/register"
                                className="group flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-navy-950
                           bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400
                           shadow-xl shadow-gold-500/30 hover:shadow-gold-500/50
                           transition-all duration-300 hover:scale-105 active:scale-95 text-base">
                                Start Your Journey
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <button onClick={scrollToFeatures}
                                className="flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-gray-300
                           border border-white/10 hover:border-white/25 hover:bg-white/5
                           transition-all duration-300 text-base">
                                <Play size={16} className="fill-gray-300" />
                                See How It Works
                            </button>
                        </div>

                        {/* Trust badges */}
                        <div className="flex flex-wrap gap-4">
                            {['Identity Verified', 'End-to-End Encrypted', 'GDPR Compliant'].map(b => (
                                <div key={b} className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <CheckCircle size={13} className="text-green-500" />
                                    {b}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — floating card mockup */}
                    <div className="hidden lg:block animate-slide-in-right">
                        <div className="relative">
                            {/* Main glass card */}
                            <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl
                              p-8 shadow-2xl shadow-navy-950 animate-float">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-navy-700 border border-white/10
                                  flex items-center justify-center">
                                        <span className="font-display font-bold text-gold-400 text-xs">LE</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white text-sm">Welcome back, Amina</p>
                                        <p className="text-green-400 text-xs flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                                            KYC Verified
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {[
                                        { icon: '🏠', label: 'Housing Found', sub: 'Toronto, ON · 2BR Apt', color: 'text-blue-400' },
                                        { icon: '⚖️', label: 'Legal Consultation', sub: 'Tomorrow at 10:00 AM', color: 'text-purple-400' },
                                        { icon: '🌐', label: 'Translation Service', sub: 'Documents ready', color: 'text-green-400' },
                                    ].map(item => (
                                        <div key={item.label}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                                            <span className="text-xl">{item.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-xs font-medium">{item.label}</p>
                                                <p className="text-gray-500 text-xs truncate">{item.sub}</p>
                                            </div>
                                            <CheckCircle size={14} className={item.color} />
                                        </div>
                                    ))}
                                </div>

                                <div className="p-3 rounded-xl bg-gradient-to-r from-gold-500/10 to-amber-500/10
                                border border-gold-500/20 flex items-center gap-2">
                                    <MessageSquare size={16} className="text-gold-400 flex-shrink-0" />
                                    <p className="text-xs text-gray-300">AI: "Your study permit expires in 30 days. Here's how to renew..."</p>
                                </div>
                            </div>

                            {/* Floating mini-card: SOS */}
                            <div className="absolute -bottom-6 -left-8 px-4 py-3 rounded-2xl
                              border border-red-500/25 bg-red-950/40 backdrop-blur-xl
                              shadow-xl animate-float-slow flex items-center gap-2">
                                <AlertTriangle size={16} className="text-red-400" />
                                <div>
                                    <p className="text-white text-xs font-semibold">SOS Team</p>
                                    <p className="text-red-400 text-xs">Responded in 3 min</p>
                                </div>
                            </div>

                            {/* Floating mini-card: rating */}
                            <div className="absolute -top-6 -right-6 px-4 py-3 rounded-2xl
                              border border-gold-500/25 bg-navy-800/80 backdrop-blur-xl
                              shadow-xl animate-float flex items-center gap-2"
                                style={{ animationDelay: '1.5s' }}>
                                <Award size={16} className="text-gold-400" />
                                <div>
                                    <p className="text-white text-xs font-semibold">Top Helper</p>
                                    <div className="flex gap-0.5">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={9} className="text-gold-400 fill-gold-400" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scroll cue */}
                <button onClick={scrollToFeatures}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2
                     text-gray-600 hover:text-gray-400 transition-colors">
                    <span className="text-xs tracking-widest uppercase">Explore</span>
                    <ChevronDown size={20} className="animate-bounce" />
                </button>
            </section>

            {/* ── STATS ───────────────────────────────────────────── */}
            <section className="relative py-20 border-y border-white/5 bg-white/2">
                <div className="max-w-7xl mx-auto px-6 lg:px-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        { value: 8000, suffix: '+', label: 'Migrants Helped', icon: Heart },
                        { value: 500, suffix: '+', label: 'Verified Helpers', icon: Shield },
                        { value: 1200, suffix: '+', label: 'Services Listed', icon: Globe },
                        { value: 40, suffix: '+', label: 'Countries Covered', icon: MapPin },
                    ].map(({ value, suffix, label, icon: Icon }) => (
                        <div key={label} className="text-center group">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl
                              bg-gold-500/10 border border-gold-500/20 mb-3
                              group-hover:bg-gold-500/20 transition-colors">
                                <Icon size={22} className="text-gold-400" />
                            </div>
                            <p className="font-display text-4xl font-bold text-white mb-1">
                                <Counter end={value} suffix={suffix} />
                            </p>
                            <p className="text-gray-500 text-sm">{label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES ────────────────────────────────────────── */}
            <section id="features" className="py-28 max-w-7xl mx-auto px-6 lg:px-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold mb-5">
                        Everything you need
                    </div>
                    <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-5">
                        Built for the real{' '}
                        <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            migration journey
                        </span>
                    </h2>
                    <p className="text-gray-400 max-w-xl mx-auto text-lg">
                        Not just another marketplace — a full support system designed around the challenges migrants actually face.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
                </div>
            </section>

            {/* ── ABOUT (HOW IT WORKS) ─────────────────────────── */}
            <section id="about" className="py-28 bg-white/2 border-y border-white/5">
                <div className="max-w-7xl mx-auto px-6 lg:px-10">
                    <div className="text-center mb-16">
                        <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">How it works</h2>
                        <p className="text-gray-400 max-w-md mx-auto">Three simple steps to get the support you need</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connector line */}
                        <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px
                            bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
                        {[
                            {
                                step: '01',
                                title: 'Create Your Profile',
                                desc: 'Sign up as a migrant, helper, or agency. Complete your KYC to unlock all features.',
                                icon: '👤',
                            },
                            {
                                step: '02',
                                title: 'Find & Book Services',
                                desc: 'Browse verified helpers offering housing, legal aid, translation, and more. Book instantly.',
                                icon: '🔍',
                            },
                            {
                                step: '03',
                                title: 'Settle with Confidence',
                                desc: 'Use the AI assistant, join communities, and access SOS support whenever you need.',
                                icon: '🏡',
                            },
                        ].map((item, i) => (
                            <div key={item.step}
                                className="text-center p-8 rounded-2xl border border-white/5
                           hover:border-white/15 hover:bg-white/3 transition-all duration-300
                           animate-slide-up"
                                style={{ animationDelay: `${i * 150}ms` }}>
                                <div className="text-5xl mb-4">{item.icon}</div>
                                <div className="inline-block font-mono text-xs text-gold-400 bg-gold-500/10
                                border border-gold-500/20 px-2 py-0.5 rounded mb-3">
                                    {item.step}
                                </div>
                                <h3 className="font-display text-xl font-bold text-white mb-3">{item.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ────────────────────────────────────── */}
            <section id="community" className="py-28 max-w-7xl mx-auto px-6 lg:px-10">
                <div className="text-center mb-16">
                    <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-4">
                        Real stories, real{' '}
                        <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
                            impact
                        </span>
                    </h2>
                    <p className="text-gray-400">From people who've been through it</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {TESTIMONIALS.map(t => <TestimonialCard key={t.name} {...t} />)}
                </div>
            </section>

            {/* ── CTA ─────────────────────────────────────────────── */}
            <section className="py-28 px-6 lg:px-10">
                <div className="max-w-3xl mx-auto text-center relative">
                    {/* Glow */}
                    <div className="absolute inset-0 -z-10 blur-3xl opacity-20
                          bg-gradient-to-r from-gold-400 via-amber-500 to-gold-400 rounded-full" />
                    <div className="p-12 rounded-3xl border border-gold-500/20 bg-gold-500/5 backdrop-blur-sm">
                        <div className="text-5xl mb-6">🌍</div>
                        <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-5">
                            Your journey starts today.
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                            Join thousands of migrants who found their footing faster with LandEase.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link to="/register"
                                className="group flex items-center gap-2 px-8 py-4 rounded-xl font-bold
                           bg-gradient-to-r from-gold-400 to-gold-500 text-navy-950
                           hover:from-gold-300 hover:to-gold-400 shadow-xl shadow-gold-500/30
                           transition-all duration-300 hover:scale-105 active:scale-95 text-base">
                                Create Free Account
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link to="/login"
                                className="px-8 py-4 rounded-xl font-semibold border border-white/15
                           text-gray-300 hover:border-white/30 hover:bg-white/5
                           transition-all duration-300 text-base">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────── */}
            <footer className="border-t border-white/5 py-10 px-6 lg:px-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <span className="font-display font-bold text-white tracking-tight">LandEase</span>
                    <p className="text-gray-600 text-xs">© 2026 LandEase. Built for migrants, by migrants.</p>
                    <div className="flex gap-6">
                        {['Privacy', 'Terms', 'Contact'].map(l => (
                            <a key={l} href="#" className="text-gray-600 hover:text-gray-400 text-xs transition-colors">{l}</a>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
}
