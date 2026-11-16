// Small shared UI primitives for the LandEase design system.
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Star, BadgeCheck, MapPin } from 'lucide-react';
import { initials, tintFor, money } from '../lib/format';
import { categoryLabel } from '../lib/enums';
import { coverFor } from '../lib/media';

export function Logo({ light = false, to = '/', className = '' }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 ${className}`} aria-label="LandEase home">
      <span className={`w-[26px] h-[26px] rounded-[7px] flex items-center justify-center ${light ? 'bg-white' : 'bg-ink'}`}>
        <svg viewBox="0 0 32 32" className="w-[18px] h-[18px]" aria-hidden="true">
          <path d="M9 20.5 13.5 12l3 5.5 2-3 4.5 6" fill="none" stroke={light ? '#0B0B10' : '#fff'} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={`font-display font-semibold text-[20px] tracking-[-0.04em] ${light ? 'text-white' : 'text-ink'}`}>LandEase</span>
    </Link>
  );
}

export function ArrowLink({ to, children, className = '', onClick }) {
  const cls = `btn-arrow ${className}`;
  const inner = <>{children}<span className="arrow-disc"><ArrowRight size={16} aria-hidden="true" /></span></>;
  if (onClick) return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
  return <Link to={to} className={cls}>{inner}</Link>;
}

export function Avatar({ name, size = 40, className = '' }) {
  return (
    <span aria-hidden="true" className={`inline-flex items-center justify-center rounded-full font-semibold text-ink shrink-0 ${className}`}
      style={{ width: size, height: size, background: tintFor(name), fontSize: Math.max(11, size * 0.32) }}>
      {initials(name)}
    </span>
  );
}

const STATUS = {
  Requested: ['badge-requested', 'Requested'], Accepted: ['badge-accepted', 'Accepted'],
  InProgress: ['badge-progress', 'In progress'], Completed: ['badge-completed', 'Completed'],
  Cancelled: ['badge-cancelled', 'Cancelled'], Pending: ['badge-requested', 'Pending'],
  UnderReview: ['badge-progress', 'Under review'], Approved: ['badge-completed', 'Approved'],
  Rejected: ['badge-cancelled', 'Rejected'], Active: ['badge-sos', 'Active'], Resolved: ['badge-completed', 'Resolved'],
};
export function StatusBadge({ status }) {
  const [cls, label] = STATUS[status] || ['badge-cancelled', status];
  return <span className={cls}>{label}</span>;
}

export function BackendBadge({ id }) {
  return <span className="badge-backend">Needs backend{id ? ` · ${id}` : ''}</span>;
}

export function Stars({ value = 0, size = 13 }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={size} aria-hidden="true" className={n <= Math.round(value) ? 'text-[#F5A524]' : 'text-line'} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
}

export function Verified({ className = '' }) {
  return <span className={`inline-flex items-center gap-0.5 text-electric font-medium ${className}`}><BadgeCheck size={13} aria-hidden="true" />Verified</span>;
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="card text-center px-6 py-14">
      {Icon && <span className="icon-tile mx-auto mb-4"><Icon size={20} aria-hidden="true" /></span>}
      <p className="font-display text-xl font-medium">{title}</p>
      {children && <p className="text-muted text-[15px] mt-1.5 max-w-md mx-auto">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card text-center px-6 py-10" role="alert">
      <p className="font-medium">Couldn&apos;t load this</p>
      <p className="text-muted text-sm mt-1">{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="btn-ghost btn-sm mt-4">Try again</button>}
    </div>
  );
}

export function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2 || p === 1 || p === totalPages);
  const box = 'w-10 h-10 rounded-[12px] border border-line bg-white text-sm font-semibold inline-flex items-center justify-center disabled:opacity-40';
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      <button type="button" className={box} disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
      {pages.map(p => (
        <button key={p} type="button" onClick={() => onPage(p)} aria-current={p === page ? 'page' : undefined}
          className={`${box} ${p === page ? '!bg-ink-pill !border-ink-pill text-white' : ''}`}>{p}</button>
      ))}
      <button type="button" className={box} disabled={page === totalPages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
      <span className="text-sm text-muted ml-2">Page {page} of {totalPages}</span>
    </nav>
  );
}

export function PageSpinner() {
  return <div className="min-h-[40vh] flex items-center justify-center text-electric" aria-busy="true"><span className="spinner w-7 h-7" /></div>;
}

/** Service card used on Explore, provider profile and recommendations. `service` is a ServiceListingDto. */
export function ServiceCard({ service, to, footer, meta, after, eyebrow }) {
  return (
    <div className="group card-hover overflow-hidden flex flex-col">
    <Link to={to} className="flex flex-col flex-1">
      <div className="relative h-[160px] overflow-hidden">
        <img src={coverFor(service.destinationCountry)} alt="" loading="lazy" className="zoom-img w-full h-full object-cover" />
        <span className="absolute top-3 left-3 badge bg-white text-ink h-7 px-3 text-[13px]">{categoryLabel(service.category)}</span>
        {service.destinationCountry && (
          <span className="absolute top-3 right-3 badge bg-white text-ink h-7 px-3 text-[13px]"><MapPin size={12} aria-hidden="true" />{service.destinationCountry}</span>
        )}
      </div>
      <div className="p-5 flex-1">
        {eyebrow && <p className="text-[13.5px] text-muted mb-1">{eyebrow}</p>}
        <h3 className="font-display text-[19px] leading-snug font-medium tracking-[-0.025em] line-clamp-2">{service.title}</h3>
        {meta}
        {!meta && service.description && <p className="text-muted text-[14.5px] mt-2 line-clamp-2">{service.description}</p>}
      </div>
      {footer ?? (
        <div className="border-t border-line px-5 py-3.5 flex items-center gap-3">
          <Avatar name={service.providerName} size={30} />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-sm font-medium truncate">{service.providerName}</p>
            <p className="text-[12.5px] text-muted flex items-center gap-1.5">
              {service.providerIsKycVerified && <Verified />}
              {service.providerRating > 0 && <span>★ {service.providerRating}</span>}
            </p>
          </div>
          <p className="text-ink"><span className="text-[12px] font-medium mr-1">USD</span><span className="font-display text-[22px] tracking-[-0.04em]">{money(service.price)}</span></p>
        </div>
      )}
    </Link>
    {after}
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-[160px] rounded-none" />
      <div className="p-5 space-y-2"><div className="skeleton h-5 w-3/4" /><div className="skeleton h-4 w-full" /><div className="skeleton h-4 w-2/3" /></div>
    </div>
  );
}

/** Two-tone headline: `first` in ink, `second` in two-tone grey. */
export function TwoTone({ as: Tag = 'h2', first, second, className = '' }) {
  return <Tag className={`h2-two ${className}`}>{first} {second && <span className="two">{second}</span>}</Tag>;
}
