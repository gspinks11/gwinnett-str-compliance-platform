'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@repo/ui';
import { ArrowRight, LockKeyhole, Sparkles } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3004';

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/public/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(errorBody?.error?.message || 'Unable to sign in.');
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto mb-6 flex max-w-6xl items-center justify-between rounded-2xl border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(247,251,255,0.92))] px-4 py-3 shadow-[0_20px_36px_-32px_var(--glow)] backdrop-blur-sm md:px-6">
        <div>
          <div className="font-display text-xl font-bold tracking-tight text-slate-900">Sentinel STR</div>
          <div className="portal-kicker mt-0.5">Owner Portal Access</div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" className="text-slate-700 hover:bg-slate-100">Home</Button>
          </Link>
          <Link href="/register">
            <Button className="bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]">Create account</Button>
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="portal-panel reveal-up rounded-[2rem] p-8 md:p-10">
          <div className="portal-pill">
            <Sparkles className="h-3.5 w-3.5" />
            Owner access
          </div>

          <h1 className="font-display mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-950 md:text-5xl">
            Return to your application dashboard
          </h1>

          <p className="mt-4 max-w-md text-base leading-7 text-slate-700">
            Review status changes, upload requested documents, and keep renewal deadlines in view from a
            single owner account.
          </p>

          <div className="surface-muted mt-7 rounded-2xl border border-slate-200 p-5">
            <div className="text-sm font-semibold text-slate-900">Demo owner account</div>
            <div className="mt-2 text-sm text-slate-600">owner.demo@example.com</div>
            <div className="text-sm text-slate-600">Password: DemoOwner123!</div>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-700">
            <LockKeyhole className="h-4 w-4" />
            MFA-ready architecture for production deployment
          </div>
        </section>

        <section className="portal-panel reveal-up rounded-[2rem] p-8 md:p-10" style={{ animationDelay: '80ms' }}>
          <div className="portal-pill">
            Secure sign-in
          </div>
          <div className="mt-4 text-sm uppercase tracking-[0.2em] text-[var(--accent-strong)]">Sign in</div>
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800">Email address</span>
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                className="portal-input"
                required
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-800">Password</span>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                className="portal-input"
                required
                autoComplete="current-password"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--ink-soft)]">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-[var(--line)]" />
                Keep me signed in
              </label>
              <Link href="/forgot-password" className="text-[var(--accent-strong)]">
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--accent)] py-3 text-base text-white hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="mr-2">Sign in to portal</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            {errorMessage && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</div>}
          </form>

          <div className="mt-6 text-sm text-[var(--ink-soft)]">
            Need an account?{' '}
            <Link href="/register" className="font-semibold text-[var(--accent-strong)]">
              Start a new application
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
