import Link from 'next/link';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

interface Stats {
  applications: { total: number; submitted: number; under_review: number; approved: number; denied: number };
  licenses: { active: number; expired: number; suspended: number };
  violations: { open: number; escalated: number };
  revenueYtdCents: number;
}

async function getStats(): Promise<Stats | null> {
  try {
    const hdrs = headers();
    const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
    const protocol = hdrs.get('x-forwarded-proto') ?? 'https';
    const baseUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? (host ? `${protocol}://${host}` : null);

    if (!baseUrl) {
      return null;
    }

    const res = await fetch(`${baseUrl}/api/stats`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AdminHome() {
  const stats = await getStats();

  const queue = stats ? stats.applications.submitted + stats.applications.under_review : null;
  const revenueStr = stats
    ? `$${(stats.revenueYtdCents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
    : '—';

  const metricCards = [
    {
      label: 'Applications in queue',
      value: queue != null ? String(queue) : '—',
      meta: 'Submitted + under review',
      href: '/applications',
    },
    {
      label: 'Active licenses',
      value: stats ? String(stats.licenses.active) : '—',
      meta: 'Current period',
      href: '/licenses',
    },
    {
      label: 'Open violations',
      value: stats ? String(stats.violations.open) : '—',
      meta: 'Requires follow-up',
      href: null,
    },
    {
      label: 'Revenue YTD',
      value: revenueStr,
      meta: 'Collected fees',
      href: null,
    },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* KPI cards */}
        <section className="admin-panel p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Command Center
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900">
                Live Overview Metrics
              </h1>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metricCards.map((card) => {
              const inner = (
                <article className="rounded-xl border border-[var(--admin-line)] bg-[linear-gradient(180deg,#fbfcff,#f2f6fc)] p-4 transition hover:shadow-sm">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {card.label}
                  </div>
                  <div className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</div>
                  <div className="mt-1 text-xs text-slate-500">{card.meta}</div>
                </article>
              );
              return card.href ? (
                <Link key={card.label} href={card.href}>
                  {inner}
                </Link>
              ) : (
                <div key={card.label}>{inner}</div>
              );
            })}
          </div>
        </section>

        {/* Application status breakdown */}
        {stats && (
          <section className="admin-panel mt-4 p-6">
            <h2 className="font-display text-xl font-semibold tracking-tight text-slate-900">
              Application Pipeline
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                { label: 'Submitted', value: stats.applications.submitted, color: 'bg-blue-100 text-blue-700' },
                { label: 'Under Review', value: stats.applications.under_review, color: 'bg-amber-100 text-amber-700' },
                { label: 'Approved', value: stats.applications.approved, color: 'bg-green-100 text-green-700' },
                { label: 'Denied', value: stats.applications.denied, color: 'bg-red-100 text-red-700' },
                { label: 'Total', value: stats.applications.total, color: 'bg-slate-100 text-slate-700' },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${s.color}`}
                >
                  <span>{s.label}</span>
                  <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-xs">{s.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/applications"
                className="inline-flex items-center rounded-lg border border-[var(--admin-brand)] px-4 py-2 text-sm font-semibold text-[var(--admin-brand)] transition hover:bg-[var(--admin-brand)] hover:text-white"
              >
                Open Review Queue →
              </Link>
            </div>
          </section>
        )}

        {/* Quick links */}
        <section className="mt-4 grid gap-4 md:grid-cols-3">
          <Link href="/applications" className="admin-panel p-5 transition-transform duration-200 hover:-translate-y-0.5">
            <h3 className="text-lg font-semibold text-slate-900">Application Queue</h3>
            <p className="mt-2 text-sm text-slate-500">Review and disposition pending submissions.</p>
          </Link>
          <Link href="/licenses" className="admin-panel p-5 transition-transform duration-200 hover:-translate-y-0.5">
            <h3 className="text-lg font-semibold text-slate-900">License Management</h3>
            <p className="mt-2 text-sm text-slate-500">Track active, expiring, and suspended licenses.</p>
          </Link>
          <Link href="/monitoring" className="admin-panel p-5 transition-transform duration-200 hover:-translate-y-0.5">
            <h3 className="text-lg font-semibold text-slate-900">Monitoring Dashboard</h3>
            <p className="mt-2 text-sm text-slate-500">Map view of licensed vs. unlicensed STR listings.</p>
          </Link>
        </section>
    </main>
  );
}
