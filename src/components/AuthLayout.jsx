import { Link } from 'react-router-dom';
import { Logo } from './ui';

/** Split auth screen: rounded photo panel on the left (hidden on mobile), form on the right. */
export default function AuthLayout({ image, caption, topRight, children, wide = false }) {
  return (
    <div className="min-h-screen bg-white lg:p-3 flex">
      <div className={`hidden lg:flex relative rounded-[28px] overflow-hidden ${wide ? 'w-[57%]' : 'w-[60%]'} shrink-0`}>
        <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-royal/30 via-transparent to-navy/80" />
        <div className="relative p-8 flex flex-col justify-between w-full">
          <Logo light />
          <p className="font-display text-white text-[36px] leading-[1.1] tracking-display max-w-[480px]">{caption}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-4 px-6 lg:px-8 pt-5">
          <span className="lg:hidden"><Logo /></span>
          <span className="hidden lg:block">{topRight?.left}</span>
          {topRight?.right}
        </div>
        <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-10">
          <div className="w-full max-w-[460px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function BackHome({ label = 'Back to home' }) {
  return <Link to="/" className="text-[15px] text-muted hover:text-ink">← {label}</Link>;
}
