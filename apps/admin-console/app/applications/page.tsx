'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';

export const dynamic = 'force-dynamic';

type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'info_requested'
  | 'approved'
  | 'denied'
  | 'withdrawn';

interface ApplicationRow {
  id: string;
  applicationNumber: string;
  type: string;
  status: ApplicationStatus;
  submittedAt: string | null;
  decidedAt: string | null;
  decisionNotes: string | null;
  createdAt: string;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyZip: string | null;
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerEmail: string | null;
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  submitted: 'bg-blue-100 text-blue-700',
  under_review: 'bg-amber-100 text-amber-700',
  info_requested: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
  denied: 'bg-red-100 text-red-700',
  withdrawn: 'bg-slate-100 text-slate-500',
};

const FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Info Requested', value: 'info_requested' },
  { label: 'Approved', value: 'approved' },
  { label: 'Denied', value: 'denied' },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [acting, setActing] = useState<string | null>(null);
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications?status=${statusFilter}`);
      const data = await res.json();
      setApplications(data.applications ?? []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  async function handleDecision(id: string, action: 'approve' | 'deny') {
    setActing(id);
    try {
      await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: notesMap[id] ?? '' }),
      });
      await fetchApplications();
      setExpandedId(null);
    } finally {
      setActing(null);
    }
  }

  const queueCount = applications.filter(
    (a) => a.status === 'submitted' || a.status === 'under_review'
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="font-medium text-slate-600 hover:text-[var(--admin-brand)]">
          Overview
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-700">Applications</span>
      </nav>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Application Review Queue</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? 'Loading live queue metrics...'
              : `${queueCount} application${queueCount !== 1 ? 's' : ''} awaiting review`}
          </p>
        </div>
        <button
          onClick={fetchApplications}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
              statusFilter === f.value
                ? 'border-[var(--admin-brand)] bg-[var(--admin-brand)] text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400">Loading applications…</div>
      ) : applications.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
          No applications match this filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Application #</th>
                <th className="px-4 py-3 text-left">Owner</th>
                <th className="px-4 py-3 text-left">Property</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Submitted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <>
                  <tr
                    key={app.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                      {app.applicationNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-800">
                      {app.ownerFirstName} {app.ownerLastName}
                      <div className="text-xs text-slate-400">{app.ownerEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {app.propertyAddress}
                      <div className="text-xs text-slate-400">
                        {app.propertyCity}, GA {app.propertyZip}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600">{app.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[app.status]}`}
                      >
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(app.status === 'submitted' || app.status === 'under_review') && (
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={acting === app.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDecision(app.id, 'approve');
                            }}
                            className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            disabled={acting === app.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedId(app.id);
                            }}
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  {expandedId === app.id && (
                    <tr key={`${app.id}-expand`} className="bg-slate-50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="max-w-xl space-y-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Decision Notes
                          </div>
                          <textarea
                            rows={3}
                            value={notesMap[app.id] ?? ''}
                            onChange={(e) =>
                              setNotesMap((prev) => ({ ...prev, [app.id]: e.target.value }))
                            }
                            placeholder="Optional notes for applicant…"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-brand)]"
                          />
                          {app.status !== 'approved' && app.status !== 'denied' && (
                            <div className="flex gap-2">
                              <button
                                disabled={acting === app.id}
                                onClick={() => handleDecision(app.id, 'approve')}
                                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {acting === app.id ? 'Saving…' : 'Approve'}
                              </button>
                              <button
                                disabled={acting === app.id}
                                onClick={() => handleDecision(app.id, 'deny')}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {acting === app.id ? 'Saving…' : 'Deny'}
                              </button>
                              <button
                                onClick={() => setExpandedId(null)}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                          {app.decisionNotes && (
                            <p className="text-xs text-slate-500">
                              <span className="font-semibold">Previous notes:</span> {app.decisionNotes}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
