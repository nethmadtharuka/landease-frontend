import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TriangleAlert, HeartPulse, ShieldAlert, Scale, MapPin, CircleHelp, CheckCircle2, Phone, Siren } from 'lucide-react';
import toast from 'react-hot-toast';
import { sosApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { apiErrorMessage } from '../../lib/apiError';
import { SOS_EVENT_TYPES } from '../../lib/enums';
import { escapeHtml } from '../../lib/html';
import { emergencyNumber } from '../../lib/media';
import { firstName, timeAgo, dateTime } from '../../lib/format';
import { ConfirmDialog } from '../../components/reviews';

const TYPE_ICON = { Medical: HeartPulse, Safety: ShieldAlert, Legal: Scale, Lost: MapPin, Other: CircleHelp };
const TYPE_LABEL = { Medical: 'Medical', Safety: 'Safety', Legal: 'Legal', Lost: 'Lost', Other: 'Other' };
const POLL_MS = 10000;
const hasLocation = (e) => Number(e.latitude) !== 0 || Number(e.longitude) !== 0;

/* Leaflet is bundled from npm (pinned 1.9.4) and code-split; no third-party CDN script at runtime. */
function loadLeaflet() {
  return Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]).then(([m]) => m.default).catch(() => null);
}
const pin = (L, color, ring) => L.divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:0 0 0 ${ring ? 5 : 0}px rgba(217,45,32,.25),0 6px 14px rgba(6,20,46,.25)"></div>`,
  iconSize: [26, 26], iconAnchor: [13, 26],
});
const youDot = (L) => L.divIcon({ className: '', html: '<div style="width:16px;height:16px;border-radius:50%;background:#2739FF;border:3px solid #fff;box-shadow:0 0 0 6px rgba(39,57,255,.18)"></div>', iconSize: [16, 16], iconAnchor: [8, 8] });

/** Small map wrapper: markers = [{id, lat, lng, popup}], selectedId, you = {lat,lng}. */
function SosMap({ markers, selectedId, you, onSelect, height = 300 }) {
  const box = useRef(null); const map = useRef(null); const L = useRef(null); const layer = useRef(null); const youRef = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    loadLeaflet().then(leaflet => {
      if (!alive || !leaflet || !box.current) return;
      L.current = leaflet;
      map.current = leaflet.map(box.current, { scrollWheelZoom: false }).setView([20, 0], 2);
      // CARTO's keyless basemap URL now returns "API key required" tiles; standard OSM tiles need only attribution.
      leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19 }).addTo(map.current);
      layer.current = leaflet.layerGroup().addTo(map.current);
      setReady(true);
    });
    return () => { alive = false; map.current?.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    if (!ready) return;
    layer.current.clearLayers();
    const pts = markers.map(m => {
      const mk = L.current.marker([m.lat, m.lng], { icon: pin(L.current, '#D92D20', m.id === selectedId) }).addTo(layer.current);
      if (m.popup) mk.bindPopup(m.popup);
      if (onSelect) mk.on('click', () => onSelect(m.id));
      return [m.lat, m.lng];
    });
    const sel = markers.find(m => m.id === selectedId);
    if (sel) map.current.setView([sel.lat, sel.lng], 14);
    else if (pts.length === 1) map.current.setView(pts[0], 14);
    else if (pts.length > 1) map.current.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
  }, [ready, markers, selectedId, onSelect]);
  // The viewer's own position moves often: update the dot without refitting the map.
  useEffect(() => {
    if (!ready || !you) return;
    if (youRef.current) youRef.current.setLatLng([you.lat, you.lng]);
    else youRef.current = L.current.marker([you.lat, you.lng], { icon: youDot(L.current), zIndexOffset: 1000 }).addTo(map.current);
  }, [ready, you]);
  return <div ref={box} style={{ height }} className="w-full bg-[#DCE6F2] relative z-0" role="img" aria-label="Map of SOS locations" />;
}

function useGeolocation(enabled) {
  const [loc, setLoc] = useState(null);
  const [watchError, setError] = useState(null);
  const supported = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
  useEffect(() => {
    if (!enabled || !supported) return undefined;
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => { setLoc({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }); setError(null); },
      (err) => setError(err.code === 1 ? 'Location permission was denied. You can still send an alert without it.' : 'Your location isn’t available right now.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled, supported]);
  return { loc, error: supported ? watchError : 'Location isn’t supported by this browser.' };
}

function EmergencyBanner({ country }) {
  const n = emergencyNumber(country);
  return (
    <div className="rounded-[20px] bg-navy text-white px-5 py-4 flex flex-wrap items-center gap-4" role="note">
      <TriangleAlert size={22} className="text-[#FF8A80] shrink-0" aria-hidden="true" />
      <p className="flex-1 min-w-[220px] text-[16px]">In immediate danger, call emergency services first. LandEase alerts helpers — it can&apos;t dispatch police or ambulances.</p>
      {n ? <a href={`tel:${n}`} className="flex items-baseline gap-2"><span className="numeral text-[34px] underline underline-offset-4">{n}</span><span className="text-[14px] text-white/75">{country}</span></a>
        : <span className="text-[15px] font-semibold">Call your local emergency number</span>}
    </div>
  );
}

/* ── Migrant ─────────────────────────────────────────────── */
function MigrantSos({ user }) {
  const [type, setType] = useState(null);
  const [description, setDescription] = useState('');
  const [share, setShare] = useState(true);
  const [notifyMigrants, setNotifyMigrants] = useState(false);
  const [active, setActive] = useState(null);
  const [checking, setChecking] = useState(true);
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [confirmResolve, setConfirmResolve] = useState(false);
  const [error, setError] = useState('');
  const { loc, error: locError } = useGeolocation(share);
  const country = user.destinationCountry;
  const activeMarker = useMemo(() => (active ? [{ id: active.id, lat: Number(active.latitude), lng: Number(active.longitude) }] : []), [active]);

  // Restore an active alert after a reload (migrants only ever see their own events).
  const refresh = useCallback(() => sosApi.getActive().then(r => setActive((r.data.data || [])[0] || null)).catch(() => {}), []);
  useEffect(() => { refresh().finally(() => setChecking(false)); }, [refresh]);
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [active, refresh]);

  const send = async (e) => {
    e.preventDefault();
    if (!type) { setError('Choose what’s happening.'); return; }
    setSending(true); setError('');
    try {
      const res = await sosApi.trigger({
        eventType: type,
        description: description.trim() || `Emergency: ${TYPE_LABEL[type]}`,
        latitude: share && loc ? loc.lat : 0,
        longitude: share && loc ? loc.lng : 0,
        notifyMigrants,
      });
      setActive(res.data.data);
      setDescription(''); setType(null);
    } catch (err) {
      setError(`${apiErrorMessage(err, 'The alert could not be sent.')} If you are in danger, call ${emergencyNumber(country) || 'your local emergency number'} now.`);
    } finally { setSending(false); }
  };

  const resolve = async () => {
    setResolving(true);
    try {
      await sosApi.resolve(active.id);
      toast.success('Glad you’re safe. The alert is resolved.');
      setActive(null);
    } catch (err) { toast.error(apiErrorMessage(err, 'Could not resolve the alert.')); } finally { setResolving(false); setConfirmResolve(false); }
  };

  if (checking) return null;
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3"><h1 className="page-title">SOS</h1><Link to="/dashboard/sos/history" className="link">SOS history</Link></div>
      <EmergencyBanner country={country} />

      {active ? (
        <section className="card p-6 border-sos/40" aria-live="assertive">
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-[#FDECEC] text-sos inline-flex items-center justify-center"><Siren size={22} /></span>
            <div className="flex-1"><h2 className="text-[24px]">SOS active · #{active.id}</h2><p className="text-muted">{TYPE_LABEL[active.eventType]} · sent {timeAgo(active.createdAt)}</p></div>
            <span className="badge-sos h-7 px-3">Active</span>
          </div>
          {active.alertCount > 0 ? (
            <p className="mt-5 rounded-[14px] bg-[#F5F8FC] px-4 py-3 text-[16px]"><b>{active.alertCount} responder{active.alertCount > 1 ? 's' : ''}</b> in {active.destinationCountry || country} {active.alertCount > 1 ? 'were' : 'was'} alerted. Responders who can help will contact you on your phone number.</p>
          ) : (
            <p className="mt-5 rounded-[14px] bg-[#FDECEC] text-[#7A1A12] px-4 py-3 text-[16px]"><b>No LandEase responders are registered in {country || 'your destination country'}.</b> Call {emergencyNumber(country) || 'your local emergency number'} now.</p>
          )}
          {!hasLocation(active) && <p className="text-[14.5px] text-muted mt-3">Your location wasn&apos;t shared with this alert.</p>}
          {hasLocation(active) && (
            <div className="rounded-[16px] overflow-hidden mt-4 border border-line"><SosMap markers={activeMarker} selectedId={active.id} height={260} /></div>
          )}
          <div className="flex flex-wrap gap-3 mt-5">
            <button type="button" onClick={() => setConfirmResolve(true)} className="btn-ink">I&apos;m safe now</button>
            <Link to="/dashboard/sos/history" className="btn-ghost">View history</Link>
          </div>
        </section>
      ) : (
        <form onSubmit={send} className="card p-6" noValidate>
          <fieldset>
            <legend className="font-display text-[24px] tracking-[-0.03em] mb-4">What&apos;s happening?</legend>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {SOS_EVENT_TYPES.map(({ value }) => {
                const I = TYPE_ICON[value];
                return (
                  <label key={value} className={`rounded-[18px] border p-4 flex flex-col items-center gap-2.5 cursor-pointer transition-colors ${type === value ? 'border-sos bg-[#FDF6F5] ring-4 ring-sos/10' : 'border-line hover:border-twotone'}`}>
                    <input type="radio" name="sos-type" value={value} checked={type === value} onChange={() => { setType(value); setError(''); }} className="sr-only" />
                    <span className="w-12 h-12 rounded-full bg-[#FDECEC] text-sos inline-flex items-center justify-center"><I size={21} /></span>
                    <span className="font-semibold text-[16px]">{TYPE_LABEL[value]}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label htmlFor="sos-desc" className="label mt-5">Describe what&apos;s happening <span className="block text-muted font-normal text-[14px]">(optional)</span></label>
          <textarea id="sos-desc" className="input h-24 resize-y" maxLength={1000} placeholder="Where you are, who's with you, what you need" value={description} onChange={e => setDescription(e.target.value)} />

          <div className="mt-4 rounded-[16px] bg-[#F5F8FC] px-4 py-3 flex items-center justify-between gap-4">
            <span><span className="block font-semibold">Share my location</span><span className="block text-[14px] text-muted">{share && locError ? locError : 'Responders see where you are. Your browser will ask for permission.'}</span></span>
            <button type="button" role="switch" aria-checked={share} aria-label="Share my location" onClick={() => setShare(s => !s)}
              className={`w-[50px] h-[30px] rounded-full p-[3px] inline-flex shrink-0 transition-colors ${share ? 'bg-electric justify-end' : 'bg-[#C9D0DA] justify-start'}`}><span className="w-6 h-6 rounded-full bg-white" /></button>
          </div>
          <div className="mt-2 rounded-[16px] bg-[#F5F8FC] px-4 py-3 flex items-center justify-between gap-4">
            <span><span className="block font-semibold">Also alert LandEase members nearby</span><span className="block text-[14px] text-muted">Other migrants in your destination country will see your name, phone and location.</span></span>
            <button type="button" role="switch" aria-checked={notifyMigrants} aria-label="Also alert LandEase members nearby" onClick={() => setNotifyMigrants(s => !s)}
              className={`w-[50px] h-[30px] rounded-full p-[3px] inline-flex shrink-0 transition-colors ${notifyMigrants ? 'bg-electric justify-end' : 'bg-[#C9D0DA] justify-start'}`}><span className="w-6 h-6 rounded-full bg-white" /></button>
          </div>

          {country ? (
            <p className="text-muted mt-4">Alerts go to registered helpers and agencies in <b className="text-ink">{country}</b>. They&apos;ll see your name{user.phoneNumber ? ` and phone (${user.phoneNumber})` : ''}.
              {!user.phoneNumber && <> <Link to="/dashboard/profile" className="link">Add a phone number</Link> so they can call you.</>}</p>
          ) : (
            <p className="warn mt-4">Set your destination country in <Link to="/dashboard/profile" className="underline font-semibold">My profile</Link> — without it, SOS can&apos;t reach any responders.</p>
          )}
          {error && <p role="alert" className="mt-4 rounded-[14px] bg-[#FDECEC] text-[#7A1A12] px-4 py-3">{error}</p>}
          <button type="submit" disabled={sending} className="btn-danger w-full h-14 text-[17px] mt-5">{sending ? <><span className="spinner w-5 h-5" />Sending…</> : 'Send SOS alert'}</button>
        </form>
      )}
      {confirmResolve && <ConfirmDialog title="Mark yourself safe?" body="This resolves the alert for every responder." confirmLabel="I'm safe now" danger={false} busy={resolving} onConfirm={resolve} onCancel={() => setConfirmResolve(false)} />}
    </div>
  );
}

/* ── Responder (Helper / Agency) ─────────────────────────── */
function ResponderSos({ user }) {
  const [events, setEvents] = useState(null);
  const [selected, setSelected] = useState(null);
  const [acknowledged, setAcknowledged] = useState([]);
  const [pollError, setPollError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmResolve, setConfirmResolve] = useState(false);
  const { loc } = useGeolocation(true);
  const country = user.destinationCountry;

  const fetchActive = useCallback(async () => {
    try {
      const res = await sosApi.getActive();
      const list = res.data.data || [];
      setEvents(list); setPollError(null);
      setSelected(sel => (list.some(e => e.id === sel) ? sel : list[0]?.id ?? null));
    } catch (err) { setPollError(apiErrorMessage(err, 'Could not refresh SOS alerts.')); setEvents(e => e || []); }
  }, []);
  useEffect(() => {
    fetchActive();
    const t = setInterval(fetchActive, POLL_MS);
    return () => clearInterval(t);
  }, [fetchActive]);

  const acknowledge = async (id) => {
    setBusy(true);
    try {
      await sosApi.acknowledge(id);
      setAcknowledged(a => [...a, id]);
      toast.success('The person has been told you are responding.');
    } catch (err) {
      if (err.response?.status === 409) setAcknowledged(a => [...a, id]);
      toast.error(err.response?.status === 404 ? 'You weren’t on the original alert list, but you can still help — call the person.' : apiErrorMessage(err, 'Could not acknowledge this alert.'));
    } finally { setBusy(false); }
  };
  const resolve = async (id) => {
    setBusy(true);
    try { await sosApi.resolve(id); toast.success('Alert resolved.'); await fetchActive(); }
    catch (err) { toast.error(apiErrorMessage(err, 'Could not resolve this alert.')); } finally { setBusy(false); setConfirmResolve(false); }
  };

  const list = events || [];
  const current = list.find(e => e.id === selected);
  const n = emergencyNumber(country);
  const markers = useMemo(() => (events || []).filter(hasLocation).map(e => ({
    id: e.id, lat: Number(e.latitude), lng: Number(e.longitude),
    popup: `<b>${escapeHtml(TYPE_LABEL[e.eventType])} · ${escapeHtml(e.initiatedByUserName)}</b><br/>${escapeHtml(e.description)}`,
  })), [events]);

  if (!country) return (
    <div><h1 className="page-title">SOS alerts</h1>
      <div className="card p-6 mt-5"><p className="font-semibold text-[18px]">Set your destination country to receive SOS alerts</p>
        <p className="text-muted mt-1">Alerts are routed to responders in the same destination country.</p><Link to="/dashboard/profile" className="btn-ink mt-4">Update profile</Link></div></div>
  );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="page-title">SOS alerts</h1><p className="page-sub text-[17px]">Active alerts from migrants in <b className="text-ink">{country}</b>. Newest first.</p></div>
        <p className="text-[15px] text-muted flex items-center gap-2" aria-live="polite"><span className="w-4 h-4 rounded-full bg-sos ring-4 ring-sos/20" aria-hidden="true" />{list.length} active · updates every {POLL_MS / 1000} s</p>
      </div>
      {pollError && <p role="alert" className="warn mt-4">{pollError}</p>}

      {events === null ? <div className="space-y-3 mt-5">{[1, 2].map(i => <div key={i} className="card h-20 skeleton" />)}</div>
        : list.length === 0 ? (
          <div className="card p-10 text-center mt-5"><CheckCircle2 size={34} className="mx-auto text-[#0F7B4F]" /><p className="font-display text-[22px] mt-3">No active alerts in {country}</p><p className="text-muted">This page refreshes automatically.</p></div>
        ) : (
          <>
            <ul className="space-y-3 mt-5">
              {list.map(e => {
                const I = TYPE_ICON[e.eventType] || CircleHelp;
                return (
                  <li key={e.id}>
                    <button type="button" onClick={() => setSelected(e.id)} aria-pressed={selected === e.id}
                      className={`card w-full text-left p-4 flex gap-4 ${selected === e.id ? 'border-sos ring-1 ring-sos' : 'hover:shadow-hover'}`}>
                      <span className="w-11 h-11 rounded-full bg-[#FDECEC] text-sos inline-flex items-center justify-center shrink-0"><I size={18} /></span>
                      <span className="flex-1 min-w-0">
                        <span className="flex justify-between gap-3"><b className="text-[17px]">{TYPE_LABEL[e.eventType]} · {e.initiatedByUserName}</b><span className="text-[14px] text-muted shrink-0">{timeAgo(e.createdAt)}</span></span>
                        <span className="block text-muted line-clamp-2">{e.description}</span>
                        <span className="flex flex-wrap gap-2 mt-1.5">
                          {acknowledged.includes(e.id) && <span className="badge-completed">You&apos;re responding</span>}
                          {!hasLocation(e) && <span className="badge-cancelled">No location</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {current && (
              <section className="card overflow-hidden mt-5" aria-label="Selected alert">
                <SosMap markers={markers} selectedId={hasLocation(current) ? current.id : null} you={loc} onSelect={setSelected} height={300} />
                <div className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-[26px]">{TYPE_LABEL[current.eventType]} · {current.initiatedByUserName}</h2>
                    <span className="badge-sos h-7 px-3">Active · {timeAgo(current.createdAt)}</span>
                  </div>
                  <p className="text-[17px] mt-2 break-words">“{current.description}”</p>
                  <dl className="grid sm:grid-cols-3 gap-3 mt-4">
                    <div className="rounded-[14px] bg-[#F5F8FC] px-4 py-3"><dt className="text-[13.5px] text-muted font-medium">Phone</dt>
                      <dd className="font-semibold">{current.initiatedByUserPhone ? <a href={`tel:${current.initiatedByUserPhone}`} className="text-electric">{current.initiatedByUserPhone}</a> : 'Not provided'}</dd></div>
                    <div className="rounded-[14px] bg-[#F5F8FC] px-4 py-3"><dt className="text-[13.5px] text-muted font-medium">Location</dt>
                      <dd className="font-semibold">{hasLocation(current)
                        ? <a href={`https://www.google.com/maps?q=${current.latitude},${current.longitude}`} target="_blank" rel="noopener noreferrer" className="text-electric">{Number(current.latitude).toFixed(4)}, {Number(current.longitude).toFixed(4)}</a>
                        : 'Not shared'}</dd></div>
                    <div className="rounded-[14px] bg-[#F5F8FC] px-4 py-3"><dt className="text-[13.5px] text-muted font-medium">Alerted</dt><dd className="font-semibold">{current.alertCount} responder{current.alertCount === 1 ? '' : 's'}</dd></div>
                  </dl>
                  <div className="flex flex-wrap gap-3 mt-5">
                    <button type="button" disabled={busy || acknowledged.includes(current.id)} onClick={() => acknowledge(current.id)} className="btn-danger">
                      {acknowledged.includes(current.id) ? 'You’re responding ✓' : 'I’m responding'}</button>
                    {current.initiatedByUserPhone && <a href={`tel:${current.initiatedByUserPhone}`} className="btn-ghost"><Phone size={15} />Call {firstName(current.initiatedByUserName)}</a>}
                    <button type="button" disabled={busy} onClick={() => setConfirmResolve(true)} className="btn-ghost">Mark resolved</button>
                  </div>
                  <p className="text-[14px] text-muted mt-3">If someone is in danger, call {n || 'the local emergency number'} first. Sent {dateTime(current.createdAt)}.</p>
                </div>
              </section>
            )}
          </>
        )}
      {confirmResolve && current && <ConfirmDialog title={`Resolve ${firstName(current.initiatedByUserName)}'s alert?`} body="Only resolve it when the person is safe. Everyone responding will see it as resolved." confirmLabel="Mark resolved" danger={false} busy={busy} onConfirm={() => resolve(current.id)} onCancel={() => setConfirmResolve(false)} />}
    </div>
  );
}

export default function SosPage() {
  const { user } = useAuth();
  if (user?.role === 'Migrant') return <MigrantSos user={user} />;
  return <ResponderSos user={user} />;
}
