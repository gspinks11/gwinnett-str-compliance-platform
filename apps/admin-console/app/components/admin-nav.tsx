'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { label: 'Overview', href: '/' },
  { label: 'Applications', href: '/applications' },
  { label: 'Licenses', href: '/licenses' },
  { label: 'Monitoring', href: '/monitoring' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-40 border-b border-[var(--admin-line)] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <nav
          className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto whitespace-nowrap pb-1"
          aria-label="Primary"
        >
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)] focus-visible:ring-offset-2 ${
                  active
                    ? 'border-[var(--admin-brand)] bg-[var(--admin-brand)] text-white shadow-[0_8px_16px_-10px_rgba(125,29,42,0.6)]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 sm:block">
          County Operations Workspace
        </div>
      </div>
    </div>
  );
}
