import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { AdminNav } from './components/admin-nav';

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700'],
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Admin Console - Sentinel STR',
  description: 'County staff console for STR license management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <a href="#main-content" className="admin-skip-link">
          Skip to main content
        </a>
        <div className="min-h-screen">
          <div className="border-b border-transparent bg-[var(--admin-brand)] text-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div>
                <div className="font-display text-xl font-semibold tracking-tight">Sentinel STR Admin Console</div>
                <div className="text-xs uppercase tracking-[0.12em] text-white/80">
                  Gwinnett County Demonstration Environment
                </div>
              </div>
              <div className="text-right text-sm text-white/90">
                <div>Presented by Spinks Technologies, Inc.</div>
                <div className="mt-1 text-xs text-white/80">Internal Operations Workspace</div>
              </div>
            </div>
          </div>
          <AdminNav />
          <main id="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
