import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ShieldAlert, Scale, MapPin, CircleHelp, Plus, Minus, Siren } from 'lucide-react';
import { sosApi } from '../../api/endpoints';
import { apiErrorMessage } from '../../lib/apiError';
import { dateTime } from '../../lib/format';
import { EmptyState, ErrorState, StatusBadge } from '../../components/ui';

const TYPE_ICON = { Medical: HeartPulse, Safety: ShieldAlert, Legal: Scale, Lost: MapPin, Other: CircleHelp };

export default function SosHistoryPage() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    sosApi.getHistory().then(r => { const l = r.data.data || []; setEvents(l); setOpen(l[0]?.id ?? null); })
      .catch(err => setError(apiErrorMessage(err, 'Could not load your SOS history.')));
  }, []);

  return (
    <div className="max-w-[900px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="page-title">SOS history</h1><p className="page-sub text-[17px]">Alerts you&apos;ve sent, newest first.</p></div>
        <Link to="/dashboard/sos" className="btn-danger">New SOS alert</Link>
      </div>
      <div className="mt-6 space-y-3">
        {error ? <ErrorState message={error} /> : events === null ? [1, 2].map(i => <div key={i} className="card h-20 skeleton" />)
          : events.length === 0 ? <EmptyState icon={Siren} title="You haven't sent any SOS alerts" /> : events.map(e => {
            const I = TYPE_ICON[e.eventType] || CircleHelp;
            const isOpen = open === e.id;
            return (
              <div key={e.id} className="card">
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : e.id)} className="w-full p-5 flex items-center gap-4 text-left">
                  <span className="w-11 h-11 rounded-full bg-[#FDECEC] text-sos inline-flex items-center justify-center shrink-0"><I size={18} /></span>
                  <span className="flex-1"><span className="block font-semibold text-[17px]">{e.eventType}</span><span className="block text-[14.5px] text-muted">{dateTime(e.createdAt)}</span></span>
                  <StatusBadge status={e.status} />{isOpen ? <Minus size={16} /> : <Plus size={16} />}
                </button>
                {isOpen && (
                  <dl className="grid sm:grid-cols-3 gap-4 px-5 pb-5 sm:pl-[76px]">
                    <div><dt className="text-[14px] text-muted font-medium">Description</dt><dd className="break-words">{e.description}</dd></div>
                    <div><dt className="text-[14px] text-muted font-medium">Responders alerted</dt><dd>{e.alertCount}</dd></div>
                    <div><dt className="text-[14px] text-muted font-medium">{e.status === 'Active' ? 'Status' : 'Ended'}</dt>
                      <dd>{e.status === 'Active' ? <Link to="/dashboard/sos" className="link">Open active alert</Link> : e.resolvedAt ? dateTime(e.resolvedAt) : 'Replaced by a newer alert'}</dd></div>
                  </dl>
                )}
              </div>
            );
          })}
        {events?.length > 0 && <p className="note border border-dashed border-[#BBD3EE]">Who responded to past alerts isn&apos;t stored per alert yet, so only counts are shown.</p>}
      </div>
    </div>
  );
}
