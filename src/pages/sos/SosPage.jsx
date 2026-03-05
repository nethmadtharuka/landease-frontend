import { useState, useEffect, useRef, useCallback } from 'react';
import { sosApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
    AlertTriangle, AlertOctagon, MapPin,
    CheckCircle, XCircle, RefreshCw, Navigation, Radio,
} from 'lucide-react';

// SosEventType enum (must match backend)
const EMERGENCY_TYPES = [
    { label: 'Medical Emergency', icon: '🏥', value: 0 },
    { label: 'Safety Threat', icon: '🛡️', value: 1 },
    { label: 'Legal Emergency', icon: '⚖️', value: 2 },
    { label: 'Lost / Missing', icon: '🗺️', value: 3 },
    { label: 'Other', icon: '🆘', value: 4 },
];

/* ── Dynamically load Leaflet CSS + JS from CDN ─────────────── */
function loadLeaflet() {
    return new Promise((resolve) => {
        if (window.L) { resolve(window.L); return; }

        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        if (!document.getElementById('leaflet-js')) {
            const script = document.createElement('script');
            script.id = 'leaflet-js';
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => resolve(window.L);
            script.onerror = () => resolve(null);
            document.head.appendChild(script);
        } else {
            // Script tag exists but might still be loading
            const existing = document.getElementById('leaflet-js');
            if (existing.dataset.loaded) { resolve(window.L); return; }
            existing.addEventListener('load', () => resolve(window.L));
        }
    });
}

/* ── Gold pulsing "You are here" icon ─────────────────────────── */
function goldIcon(L) {
    return L.divIcon({
        className: '',
        html: `
      <div style="
        width:18px;height:18px;
        background:#F59E0B;
        border-radius:50%;
        border:3px solid #FCD34D;
        box-shadow:0 0 0 0 rgba(245,158,11,.7);
        animation:gpulse 2s infinite;
      "></div>
      <style>
        @keyframes gpulse{
          0%{box-shadow:0 0 0 0 rgba(245,158,11,.7)}
          70%{box-shadow:0 0 0 14px rgba(245,158,11,0)}
          100%{box-shadow:0 0 0 0 rgba(245,158,11,0)}
        }
      </style>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
    });
}

/* ── Red pulsing SOS emoji icon ───────────────────────────────── */
function sosIcon(L, size = 28) {
    return L.divIcon({
        className: '',
        html: `
      <div style="
        font-size:${size}px;
        line-height:1;
        filter:drop-shadow(0 0 8px rgba(239,68,68,.9));
        animation:spulse 1.5s infinite;
      ">🆘</div>
      <style>
        @keyframes spulse{
          0%,100%{transform:scale(1);filter:drop-shadow(0 0 8px rgba(239,68,68,.9))}
          50%{transform:scale(1.25);filter:drop-shadow(0 0 16px rgba(239,68,68,1))}
        }
      </style>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
}

/* ═══════════════════════════════════════════════════════════════ */
export default function SosPage() {
    const { user } = useAuth();

    // ── State ──────────────────────────────────────────────────────
    const [mapReady, setMapReady] = useState(false);
    const [location, setLocation] = useState(null);   // { lat, lng, accuracy }
    const [locError, setLocError] = useState(null);
    const [form, setForm] = useState({ eventType: null, eventTypeLabel: '' });
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [sentEvent, setSentEvent] = useState(null);
    const [resolving, setResolving] = useState(false);
    const [activeEvents, setActiveEvents] = useState([]);

    // ── Refs ───────────────────────────────────────────────────────
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const userMarkerRef = useRef(null);
    const mySosMarkerRef = useRef(null);
    const activeMarkersRef = useRef({});   // id → L.marker
    const watchIdRef = useRef(null);
    const pollRef = useRef(null);
    const L = useRef(null);

    const isMigrant = user?.role === 'Migrant';
    const isHelper = ['Helper', 'Agency'].includes(user?.role);

    // ── 1. Load Leaflet ────────────────────────────────────────────
    useEffect(() => {
        let alive = true;
        loadLeaflet().then((leaflet) => {
            if (alive && leaflet) { L.current = leaflet; setMapReady(true); }
        });
        return () => { alive = false; };
    }, []);

    // ── 2. Init map after Leaflet ready ───────────────────────────
    useEffect(() => {
        if (!mapReady || !mapContainerRef.current || mapRef.current) return;

        const map = L.current.map(mapContainerRef.current, {
            zoomControl: true,
            attributionControl: true,
        });

        // CartoDB Voyager — full-color modern tiles
        L.current.tileLayer(
            'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
            { attribution: '© OpenStreetMap, © CartoDB', subdomains: 'abcd', maxZoom: 19 }
        ).addTo(map);

        map.setView([20, 0], 2);
        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
            userMarkerRef.current = null;
            mySosMarkerRef.current = null;
            activeMarkersRef.current = {};
        };
    }, [mapReady]);

    // ── 3. Live GPS watchPosition ─────────────────────────────────
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocError('Geolocation is not supported by your browser.');
            return;
        }
        watchIdRef.current = navigator.geolocation.watchPosition(
            ({ coords: { latitude: lat, longitude: lng, accuracy } }) => {
                setLocation({ lat, lng, accuracy });
                setLocError(null);
            },
            (err) => {
                setLocError(
                    err.code === 1
                        ? 'Location access denied. Enable it in your browser to use the map.'
                        : 'Unable to retrieve your location.'
                );
            },
            { enableHighAccuracy: true, maximumAge: 4000, timeout: 15000 }
        );
        return () => {
            if (watchIdRef.current != null)
                navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, []);

    // ── 4. Update gold dot on map as user moves ───────────────────
    useEffect(() => {
        if (!mapRef.current || !L.current || !location) return;
        const { lat, lng } = location;

        if (!userMarkerRef.current) {
            mapRef.current.setView([lat, lng], 15);
            userMarkerRef.current = L.current
                .marker([lat, lng], { icon: goldIcon(L.current), zIndexOffset: 1000 })
                .addTo(mapRef.current)
                .bindPopup('<b style="color:#111">📍 Your Location</b>');
        } else {
            userMarkerRef.current.setLatLng([lat, lng]);
        }
    }, [location]);

    // ── 5. Poll active events for Helper / Agency ─────────────────
    const fetchActive = useCallback(async () => {
        if (!isHelper) return;
        try {
            const res = await sosApi.getActive();
            const events = res.data?.data ?? [];
            setActiveEvents(events);

            if (!mapRef.current || !L.current) return;
            const currentIds = new Set(events.map(e => String(e.id)));

            // Remove stale markers
            Object.entries(activeMarkersRef.current).forEach(([id, marker]) => {
                if (!currentIds.has(id)) { marker.remove(); delete activeMarkersRef.current[id]; }
            });

            // Add / update markers
            events.forEach(evt => {
                if (!evt.latitude && !evt.longitude) return;
                const key = String(evt.id);
                const popup = `
          <div style="font-size:13px;color:#111;min-width:160px">
            <b>🆘 ${evt.initiatedByUserName || 'Unknown'}</b><br/>
            ${evt.description ? `<span style="color:#555">${evt.description}</span><br/>` : ''}
            <span style="color:#ef4444;font-weight:600">${evt.status}</span>
            ${evt.initiatedByUserPhone ? `<br/>📞 ${evt.initiatedByUserPhone}` : ''}
            <br/><span style="color:#888;font-size:11px">${new Date(evt.createdAt).toLocaleTimeString()}</span>
          </div>`;

                if (activeMarkersRef.current[key]) {
                    activeMarkersRef.current[key].setLatLng([evt.latitude, evt.longitude]).bindPopup(popup);
                } else {
                    activeMarkersRef.current[key] = L.current
                        .marker([evt.latitude, evt.longitude], { icon: sosIcon(L.current, 26) })
                        .addTo(mapRef.current)
                        .bindPopup(popup);
                }
            });
        } catch (_) { /* silent */ }
    }, [isHelper]);

    useEffect(() => {
        if (!isHelper) return;
        fetchActive();
        pollRef.current = setInterval(fetchActive, 10000);
        return () => clearInterval(pollRef.current);
    }, [fetchActive, isHelper]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.eventType === null) return toast.error('Please select an emergency type.');

        setLoading(true);
        try {
            const payload = {
                EventType: form.eventType,
                Description: `Emergency: ${form.eventTypeLabel}`, // Send default since backend requires it
                Latitude: location?.lat ?? 0,
                Longitude: location?.lng ?? 0,
            };
            const res = await sosApi.trigger(payload);
            const data = res.data?.data ?? null;
            setSentEvent(data);
            setSent(true);
            toast.success('🆘 SOS alert sent! Help is on the way.', { duration: 5000 });

            // Drop persistent SOS marker at the exact spot
            if (mapRef.current && L.current && location) {
                if (mySosMarkerRef.current) mySosMarkerRef.current.remove();
                mySosMarkerRef.current = L.current
                    .marker([location.lat, location.lng], { icon: sosIcon(L.current, 36), zIndexOffset: 2000 })
                    .addTo(mapRef.current)
                    .bindPopup('<b style="color:#ef4444">🆘 Your SOS sent here</b>')
                    .openPopup();
                mapRef.current.setView([location.lat, location.lng], 15);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send SOS.');
        } finally {
            setLoading(false);
        }
    };

    // ── 7. Resolve SOS ────────────────────────────────────────────
    const handleResolve = async () => {
        if (!sentEvent?.id) return;
        setResolving(true);
        try {
            await sosApi.resolve(sentEvent.id);
            toast.success('SOS resolved successfully.');
            if (mySosMarkerRef.current) { mySosMarkerRef.current.remove(); mySosMarkerRef.current = null; }
            setSent(false);
            setSentEvent(null);
            setForm({ eventType: null, eventTypeLabel: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resolve SOS.');
        } finally {
            setResolving(false);
        }
    };

    /* ── Render ──────────────────────────────────────────────────── */
    return (
        <div className="space-y-5 max-w-6xl mx-auto animate-fade-in">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-display font-bold text-red-400 mb-1 flex items-center gap-3">
                    <AlertTriangle size={26} />
                    SOS Emergency
                    {isHelper && (
                        <span className="ml-2 text-sm font-body font-normal text-gray-400">
                            — Monitoring Mode
                        </span>
                    )}
                </h1>
                <p className="text-gray-400 text-sm">
                    {isMigrant
                        ? 'Use this only in genuine emergencies. Our team will respond immediately.'
                        : 'Real-time view of active SOS events in your area. Map refreshes every 10 seconds.'}
                </p>
            </div>

            {/* Location denied warning */}
            {locError && (
                <div className="card bg-yellow-950/30 border border-yellow-800/50 py-4">
                    <div className="flex items-start gap-3">
                        <XCircle size={18} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-yellow-300 text-sm font-semibold">Location Access Required</p>
                            <p className="text-yellow-400/80 text-xs mt-1">{locError}</p>
                            <p className="text-yellow-500/60 text-xs mt-1">
                                To enable: click the 🔒 lock icon in your browser address bar → <b>Site Settings</b> → set Location to <b>Allow</b>.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Warning banner */}
            {isMigrant && !locError && (
                <div className="card bg-red-950/30 border border-red-900/40 py-3">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-300">
                            This immediately alerts our support team. For life-threatening emergencies, also call <b>911 / 999 / 112</b>.
                        </p>
                    </div>
                </div>
            )}

            {/* Main two-column layout */}
            <div className="grid lg:grid-cols-5 gap-5">

                {/* ── MAP (3/5 width) ─────────────────────────────────── */}
                <div className="lg:col-span-3 rounded-2xl overflow-hidden border border-navy-700 bg-navy-900 flex flex-col">

                    {/* Map header bar */}
                    <div className="px-4 py-2.5 border-b border-navy-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gold-400" />
                            <span className="text-sm font-semibold text-white">Live Map</span>
                            {isHelper && (
                                <span className="text-xs text-gray-500 ml-2">
                                    <Radio size={10} className="inline mr-1 text-red-400 animate-pulse" />
                                    {activeEvents.length} active alert{activeEvents.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            {location ? (
                                <span className="text-xs font-mono text-gray-500">
                                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                                    <span className="ml-1.5 text-gray-600">±{Math.round(location.accuracy)}m</span>
                                </span>
                            ) : (
                                <span className="text-xs text-gray-600">Acquiring GPS…</span>
                            )}
                        </div>
                    </div>

                    {/* The actual Leaflet map */}
                    <div
                        ref={mapContainerRef}
                        style={{ height: '440px', width: '100%', background: '#060B1F', flexShrink: 0 }}
                    />

                    {/* GPS status bar */}
                    <div className="px-4 py-2 border-t border-navy-700 flex items-center gap-2">
                        {location ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                                <span className="text-xs text-gray-400">
                                    Live GPS · Accuracy ±{Math.round(location.accuracy)}m
                                </span>
                                <span className="ml-auto">
                                    <span className="w-3 h-3 rounded-full bg-gold-500/30 border-2 border-gold-400 inline-block" />
                                    <span className="text-xs text-gray-500 ml-1.5">You</span>
                                    {(isMigrant && sent) || isHelper ? (
                                        <>
                                            <span className="ml-3 text-base leading-none">🆘</span>
                                            <span className="text-xs text-gray-500 ml-1">SOS</span>
                                        </>
                                    ) : null}
                                </span>
                            </>
                        ) : locError ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                <span className="text-xs text-yellow-500">Location unavailable — map limited</span>
                            </>
                        ) : (
                            <>
                                <span className="w-2 h-2 rounded-full bg-gray-600 animate-pulse" />
                                <span className="text-xs text-gray-500">Waiting for GPS signal…</span>
                            </>
                        )}
                    </div>
                </div>

                {/* ── RIGHT PANEL (2/5 width) ─────────────────────────── */}
                <div className="lg:col-span-2 space-y-4">

                    {/* ── MIGRANT: Form (pre-send) ─── */}
                    {isMigrant && !sent && (
                        <form onSubmit={handleSubmit} className="card space-y-4">
                            <h2 className="font-display font-bold text-white text-base">Send Emergency Alert</h2>

                            {/* Emergency type picker */}
                            <div>
                                <label className="label text-xs">Type of Emergency *</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {EMERGENCY_TYPES.map(({ label, icon, value }) => (
                                        <button key={value} type="button"
                                            onClick={() => setForm({ ...form, eventType: value, eventTypeLabel: label })}
                                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left
                                  transition-all duration-150 text-sm
                                  ${form.eventType === value
                                                    ? 'border-red-500 bg-red-900/20 text-white'
                                                    : 'border-navy-700 bg-navy-900 text-gray-400 hover:border-navy-600'}`}>
                                            <span>{icon}</span>
                                            <span className="font-medium">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>



                            {/* Coords preview */}
                            {location && (
                                <div className="flex items-center gap-2 bg-navy-900 rounded-lg px-3 py-2">
                                    <Navigation size={11} className="text-gold-400 flex-shrink-0" />
                                    <span className="text-xs text-gray-400 font-mono">
                                        {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                                    </span>
                                    <CheckCircle size={11} className="text-green-500 ml-auto flex-shrink-0" />
                                </div>
                            )}

                            <button type="submit"
                                disabled={loading || form.eventType === null}
                                className="w-full py-3.5 bg-red-600 hover:bg-red-500 disabled:opacity-50
                           text-white font-bold rounded-xl transition-all duration-200
                           flex items-center justify-center gap-2 text-base
                           hover:shadow-lg hover:shadow-red-900/50 active:scale-95">
                                {loading
                                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : <><AlertOctagon size={18} /> SEND SOS ALERT</>}
                            </button>
                        </form>
                    )}

                    {/* ── MIGRANT: Post-send status card ─── */}
                    {isMigrant && sent && (
                        <div className="card border-red-900/50 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-red-900/30 rounded-full flex items-center justify-center animate-pulse flex-shrink-0">
                                    <AlertOctagon size={22} className="text-red-400" />
                                </div>
                                <div>
                                    <h2 className="font-display font-bold text-white">SOS Alert Sent!</h2>
                                    <p className="text-gray-400 text-xs">Help is on the way. Stay calm & stay safe.</p>
                                </div>
                            </div>

                            <div className="bg-navy-900 rounded-xl p-3 space-y-1.5 text-sm">
                                <p className="text-gray-300">
                                    <span className="text-gold-400 font-medium">Type: </span>{form.eventTypeLabel}
                                </p>

                                {sentEvent?.id && (
                                    <p className="text-gray-300">
                                        <span className="text-gold-400 font-medium">Alert ID: </span>#{sentEvent.id}
                                    </p>
                                )}
                                {location && (
                                    <p className="text-gray-400 text-xs font-mono">
                                        <span className="text-gold-400 font-body font-medium">GPS: </span>
                                        {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button onClick={handleResolve} disabled={resolving}
                                    className="flex-1 py-2.5 bg-green-700 hover:bg-green-600 disabled:opacity-50
                             text-white font-bold rounded-xl transition-all
                             flex items-center justify-center gap-2 text-sm">
                                    {resolving
                                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        : <><CheckCircle size={15} /> Resolve SOS</>}
                                </button>
                                <button
                                    onClick={() => {
                                        if (mySosMarkerRef.current) { mySosMarkerRef.current.remove(); mySosMarkerRef.current = null; }
                                        setSent(false); setSentEvent(null);
                                        setForm({ eventType: null, eventTypeLabel: '' });
                                    }}
                                    className="btn-secondary text-xs px-3">
                                    New
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── HELPER / AGENCY: Active events list ─── */}
                    {isHelper && (
                        <div className="card space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="font-display font-bold text-white text-base flex items-center gap-2">
                                    <Radio size={14} className="text-red-400 animate-pulse" />
                                    Active SOS Events
                                </h2>
                                <button onClick={fetchActive} title="Refresh"
                                    className="text-gold-400 hover:text-gold-300 transition-colors p-1">
                                    <RefreshCw size={14} />
                                </button>
                            </div>

                            {activeEvents.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <CheckCircle size={28} className="mx-auto mb-2 text-green-700" />
                                    <p className="text-sm">No active SOS events right now.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                    {activeEvents.map(evt => (
                                        <div key={evt.id}
                                            className="p-3 rounded-xl bg-red-950/20 border border-red-900/40
                                 hover:border-red-700/50 transition-colors cursor-pointer"
                                            onClick={() => {
                                                if (mapRef.current && evt.latitude && evt.longitude)
                                                    mapRef.current.setView([evt.latitude, evt.longitude], 15);
                                            }}>
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-white font-semibold text-sm">{evt.initiatedByUserName}</p>
                                                <span className="text-xs text-red-400 font-mono">#{evt.id}</span>
                                            </div>
                                            {evt.description && (
                                                <p className="text-gray-400 text-xs mb-1 line-clamp-2">{evt.description}</p>
                                            )}
                                            {evt.initiatedByUserPhone && (
                                                <p className="text-gray-500 text-xs">📞 {evt.initiatedByUserPhone}</p>
                                            )}
                                            <div className="flex items-center justify-between mt-1.5">
                                                {(evt.latitude || evt.longitude) ? (
                                                    <span className="text-gray-600 text-xs font-mono">
                                                        {Number(evt.latitude).toFixed(4)}, {Number(evt.longitude).toFixed(4)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-700 text-xs">No GPS</span>
                                                )}
                                                <span className="text-gray-600 text-xs">
                                                    {new Date(evt.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-gray-700 text-xs text-center">Auto-refreshes every 10 s</p>
                        </div>
                    )}

                    {/* ── Neither Migrant nor Helper/Agency ─── */}
                    {!isMigrant && !isHelper && (
                        <div className="card text-center py-12 border-red-900/50">
                            <AlertOctagon size={36} className="text-red-400 mx-auto mb-3" />
                            <p className="text-white font-semibold">SOS Not Available</p>
                            <p className="text-gray-400 text-sm mt-1">Only Migrant accounts can trigger SOS alerts.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
