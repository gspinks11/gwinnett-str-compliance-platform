'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@repo/ui';
import { ArrowRight, BadgeCheck, Building2, FileCheck2, ShieldCheck } from 'lucide-react';

const checklist = [
  'Primary owner contact information',
  'Property address and parcel details',
  'Local agent designation',
  'Inspection report and supporting documents',
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3004';

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get('firstName') || '').trim();
    const lastName = String(formData.get('lastName') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const password = String(formData.get('password') || '');

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/public/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          password,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(errorBody?.error?.message || 'Unable to create your account.');
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create your account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto mb-6 flex max-w-6xl items-center justify-between rounded-2xl border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(247,251,255,0.92))] px-4 py-3 shadow-[0_20px_36px_-32px_var(--glow)] backdrop-blur-sm md:px-6">
        <div>
          <div className="font-display text-xl font-bold tracking-tight text-slate-900">Sentinel STR</div>
          <div className="portal-kicker mt-0.5">New Application Setup</div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" className="text-slate-700 hover:bg-slate-100">Home</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="border-[var(--line)] bg-white text-slate-800 hover:bg-slate-50">Sign in</Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="portal-panel reveal-up rounded-[2rem] p-8 md:p-10">
          <div className="portal-pill">
            <BadgeCheck className="h-3.5 w-3.5" />
            Account setup
          </div>

          <h1 className="font-display mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">
            Start your STR application in under ten minutes.
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
            Set up your account once and continue the application at your own pace. Drafts save automatically
            as you move through required ordinance steps.
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_40px_-34px_rgba(24,34,52,0.45)]">
            <div className="relative h-40 w-full">
              <Image
                src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1400&q=80"
                alt="Residential property exterior representing a short-term rental home"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 580px"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0e243d]/60 via-[#12385b]/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/80">Who this is for</div>
                <div className="mt-1 text-base font-semibold">Owners licensing a house or room for short-term rental use</div>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-[0_8px_14px_-14px_rgba(24,34,52,0.75)]">
              01 Account
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              02 Property
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              03 Local Agent
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              04 Documents
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              05 Payment
            </span>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="surface-muted rounded-2xl border border-black/10 p-4">
              <Building2 className="h-5 w-5 text-slate-800" />
              <div className="mt-3 text-sm font-medium text-slate-900">Property profile</div>
            </div>
            <div className="surface-muted rounded-2xl border border-black/10 p-4">
              <FileCheck2 className="h-5 w-5 text-slate-800" />
              <div className="mt-3 text-sm font-medium text-slate-900">Document intake</div>
            </div>
            <div className="surface-muted rounded-2xl border border-black/10 p-4">
              <ShieldCheck className="h-5 w-5 text-slate-800" />
              <div className="mt-3 text-sm font-medium text-slate-900">Compliance checks</div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
              Before you begin
            </div>
            <ul className="mt-4 space-y-3">
              {checklist.map((item, index) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="portal-panel reveal-up rounded-[2rem] p-8 md:p-10" style={{ animationDelay: '80ms' }}>
          <div className="portal-pill">
            <BadgeCheck className="h-3.5 w-3.5" />
            Owner onboarding
          </div>
          <h2 className="font-display mt-4 text-3xl leading-tight text-slate-950 md:text-4xl">
            Create your account
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-soft)]">
            Use a valid email and mobile number. You will use this account for submissions and renewals.
          </p>

          <form className="mt-8 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800">First name</span>
              <input name="firstName" className="portal-input" required autoComplete="given-name" />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800">Last name</span>
              <input name="lastName" className="portal-input" required autoComplete="family-name" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-800">Email address</span>
              <input type="email" name="email" className="portal-input" required autoComplete="email" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-800">Mobile phone</span>
              <input type="tel" name="phone" className="portal-input" autoComplete="tel" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-800">Create password</span>
              <input
                type="password"
                name="password"
                className="portal-input"
                minLength={12}
                required
                autoComplete="new-password"
              />
            </label>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[var(--accent)] py-3 text-base text-white hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span className="mr-2">Continue to property setup</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              {errorMessage && <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</div>}
            </div>
          </form>

          <div className="mt-6 text-sm text-[var(--ink-soft)]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[var(--accent-strong)]">
              Sign in here
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
