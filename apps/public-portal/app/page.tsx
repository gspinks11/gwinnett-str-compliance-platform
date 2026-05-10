import Link from 'next/link';
import { Button } from '@repo/ui';
import { ArrowRight, LockKeyhole, Search } from 'lucide-react';

const quickStats = [
  { label: 'Median first response', value: '3 business days' },
  { label: 'Online completion rate', value: '94%' },
  { label: 'License processing visibility', value: 'Real-time' },
];

const modules = [
  {
    title: 'Case Intelligence Style Intake',
    copy: 'Structured forms reduce submission errors and speed up county review workflows.',
  },
  {
    title: 'Document and Attestation Tracking',
    copy: 'Owners upload required documents once and track status changes from one dashboard.',
  },
  {
    title: 'Operational Compliance Timeline',
    copy: 'Status transitions and deadlines are visible from draft through issuance and renewal.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-[var(--line)] bg-[var(--accent)] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-sm sm:px-6 lg:px-8">
          <div className="font-semibold tracking-tight">Sentinel STR Public Portal</div>
          <div className="text-white/80">Gwinnett County Demonstration Environment</div>
        </div>
      </div>

      <div className="portal-shell pb-14 pt-6 lg:pb-20">
        <nav className="portal-panel mb-6 px-4 py-3 md:px-6 reveal-up">
          <div className="flex items-center justify-between gap-4 text-sm">
            <div>
              <div className="font-display text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                Sentinel STR
              </div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
                Gwinnett County Licensing Portal
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/about-licensing" className="hidden items-center px-2 text-sm text-slate-600 md:flex">
                Program details
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="text-slate-700 hover:bg-slate-100">
                  Log in
                </Button>
              </Link>
              <Link href="/application">
                <Button className="bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)] shadow-[0_8px_18px_-12px_rgba(29,74,120,0.7)]">
                  Open wizard
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        <main>
          <section className="portal-panel reveal-up">
            <div className="border-b border-[var(--line)] p-6 md:p-8">
              <div className="portal-pill">
                Public application experience
              </div>

              <h1 className="font-display mt-4 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">
                Apply for STR licensing with a clear, modern workflow.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--ink-soft)]">
                This portal is built for high-trust public interactions: concise forms, clear status updates,
                and ordinance-aligned submissions from first draft to issued license.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                <label className="portal-input flex items-center gap-2 border-slate-300 px-4 py-3 text-sm text-slate-500">
                  <Search className="h-4 w-4" />
                  Search by property address or parcel
                </label>
                <Link href="/application">
                  <Button className="h-full w-full bg-[var(--accent)] px-8 text-white hover:bg-[var(--accent-strong)]">
                    Open wizard
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="h-full w-full border-[var(--line)] bg-white px-6 hover:bg-slate-50">
                    Create account
                  </Button>
                </Link>
              </div>

              <div className="mt-5 inline-flex items-center gap-1.5 text-xs text-slate-600">
                <LockKeyhole className="h-4 w-4" />
                Secure owner account flow and audit-ready state tracking
              </div>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
              {quickStats.map((stat) => (
                <div key={stat.label} className="surface-muted rounded-xl border border-[var(--line)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {stat.label}
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 grid gap-5 md:grid-cols-3 reveal-up">
            {modules.map((module, idx) => (
              <article
                key={module.title}
                className="portal-panel p-6 transition-transform duration-200 hover:-translate-y-1"
                style={{ animationDelay: `${70 * (idx + 1)}ms` }}
              >
                <h2 className="text-xl font-semibold leading-tight text-slate-900">{module.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{module.copy}</p>
                <button className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-strong)]">
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </button>
              </article>
            ))}
          </section>

          <section className="portal-panel mt-8 p-6 md:p-8 reveal-up">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              How it works
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-[var(--line)] bg-[linear-gradient(180deg,#fafcff,#f4f8fd)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Step 1</div>
                <div className="mt-1 text-base font-semibold text-slate-900">Create account</div>
                <p className="mt-1 text-sm text-slate-600">Secure owner profile with saved contact details.</p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[linear-gradient(180deg,#fafcff,#f4f8fd)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Step 2</div>
                <div className="mt-1 text-base font-semibold text-slate-900">Add property</div>
                <p className="mt-1 text-sm text-slate-600">Submit parcel and location details once.</p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[linear-gradient(180deg,#fafcff,#f4f8fd)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Step 3</div>
                <div className="mt-1 text-base font-semibold text-slate-900">Upload docs</div>
                <p className="mt-1 text-sm text-slate-600">Attach inspection and ordinance-required files.</p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[linear-gradient(180deg,#fafcff,#f4f8fd)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Step 4</div>
                <div className="mt-1 text-base font-semibold text-slate-900">Track status</div>
                <p className="mt-1 text-sm text-slate-600">View review updates and issuance progress.</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
