import Link from 'next/link';
import { Button } from '@repo/ui';

const topics = [
  {
    title: 'Who needs a license?',
    body: 'Any owner operating a short-term rental in the covered jurisdiction must secure a valid STR license before hosting.',
  },
  {
    title: 'What documents are typically required?',
    body: 'Inspection documentation, proof of ownership, insurance, and a local agent designation are standard ordinance inputs.',
  },
  {
    title: 'How long does review take?',
    body: 'The MVP targets a clear first response within three business days, with online status visibility throughout the review cycle.',
  },
];

export default function AboutLicensingPage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-[var(--line)] bg-white/82 p-8 shadow-[0_28px_70px_-50px_var(--glow)] backdrop-blur md:p-10">
        <div className="text-sm uppercase tracking-[0.2em] text-[var(--accent-strong)]">Program overview</div>
        <h1 className="font-display mt-4 text-4xl leading-tight text-slate-950 md:text-5xl">
          Short-term rental licensing, explained in plain language.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--ink-soft)]">
          This page gives owners a fast orientation before they start the application. It is written to reduce
          confusion, shorten intake time, and keep the first submission cleaner.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {topics.map((topic) => (
            <section key={topic.title} className="rounded-2xl bg-[linear-gradient(180deg,#ffffff_0%,#f0f5f1_100%)] p-6">
              <h2 className="text-lg font-semibold text-slate-950">{topic.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">{topic.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/register">
            <Button className="bg-[var(--accent)] hover:bg-[var(--accent-strong)]">Begin application</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="border-[var(--line)] bg-white/80">
              Return to login
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
