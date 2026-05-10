'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export const dynamic = 'force-dynamic';

type LicenseStatus = 'active' | 'expired' | 'suspended' | 'revoked';

interface LicenseRow {
  id: string;
  licenseNumber: string;
  issuedDate: string;
  expirationDate: string;
  status: LicenseStatus;
  suspendedAt: string | null;
  suspendedReason: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyZip: string | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerEmail: string | null;
}

const STATUS_COLORS: Record<LicenseStatus, string> = {
  active: 'bg-green-100 text-green-700',
  expired: 'bg-slate-100 text-slate-500',
  suspended: 'bg-amber-100 text-amber-700',
  revoked: 'bg-red-100 text-red-700',
};

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/licenses')
      .then((r) => r.json())
      .then((d) => setLicenses(d.licenses ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="font-medium text-slate-600 hover:text-[var(--admin-brand)]">
          Overview
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-700">Licenses</span>
      </nav>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">License Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          {loading ? 'Loading licensing records...' : `${licenses.length} licenses on record`}
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">Loading licenses…</div>
      ) : licenses.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          No licenses found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">License #</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-left">Property</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Issued</th>
                <th className="px-4 py-3 text-left">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {licenses.map((lic) => {
                const days = daysUntil(lic.expirationDate);
                const expiringSoon = lic.status === 'active' && days <= 30 && days > 0;
                const expired = lic.status === 'active' && days <= 0;

                return (
                  <tr key={lic.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {lic.licenseNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-800">
                      {lic.ownerFirstName} {lic.ownerLastName}
                      <div className="text-xs text-slate-400">{lic.ownerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {lic.propertyAddress}
                      <div className="text-xs text-slate-400">
                        {lic.propertyCity}, GA {lic.propertyZip}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[lic.status]}`}
                      >
                        {lic.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(lic.issuedDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          expired
                            ? 'font-semibold text-red-600'
                            : expiringSoon
                              ? 'font-semibold text-amber-600'
                              : 'text-slate-500'
                        }
                      >
                        {new Date(lic.expirationDate).toLocaleDateString()}
                        {expiringSoon && (
                          <span className="ml-1 text-xs">({days}d left)</span>
                        )}
                        {expired && <span className="ml-1 text-xs">(expired)</span>}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
