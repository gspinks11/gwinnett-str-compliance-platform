'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import maplibregl from 'maplibre-gl';

type ComplianceStatus = 'licensed' | 'matched_unlicensed' | 'unmatched';

interface MonitoringListing {
  id: string;
  source: string;
  title: string;
  sourceUrl: string | null;
  matchStatus: string;
  matchConfidence: number;
  lat: number;
  lng: number;
  firstSeenAt: string;
  matchedPropertyId: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
  licenseNumber: string | null;
  licenseStatus: string | null;
  complianceStatus: ComplianceStatus;
}

interface MonitoringPayload {
  listings: MonitoringListing[];
  summary: {
    total: number;
    licensed: number;
    matchedUnlicensed: number;
    unmatched: number;
  };
}

const EMPTY_SUMMARY: MonitoringPayload['summary'] = {
  total: 0,
  licensed: 0,
  matchedUnlicensed: 0,
  unmatched: 0,
};

const STATUS_META: Record<ComplianceStatus, { label: string; color: string; dot: string }> = {
  licensed: {
    label: 'Licensed',
    color: 'bg-green-100 text-green-700',
    dot: '#15803d',
  },
  matched_unlicensed: {
    label: 'Matched, No Active License',
    color: 'bg-amber-100 text-amber-700',
    dot: '#b45309',
  },
  unmatched: {
    label: 'Unmatched Listing',
    color: 'bg-rose-100 text-rose-700',
    dot: '#be123c',
  },
};

export default function MonitoringPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [payload, setPayload] = useState<MonitoringPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ComplianceStatus | 'all'>('all');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/monitoring', { cache: 'no-store' });
        const raw = (await res.json()) as
          | MonitoringPayload
          | { error?: string; listings?: MonitoringListing[]; summary?: Partial<MonitoringPayload['summary']> };

        const safePayload: MonitoringPayload = {
          listings: Array.isArray((raw as MonitoringPayload).listings)
            ? (raw as MonitoringPayload).listings
            : [],
          summary: {
            total:
              (raw as MonitoringPayload).summary?.total ??
              (Array.isArray((raw as MonitoringPayload).listings)
                ? (raw as MonitoringPayload).listings.length
                : 0),
            licensed: (raw as MonitoringPayload).summary?.licensed ?? 0,
            matchedUnlicensed: (raw as MonitoringPayload).summary?.matchedUnlicensed ?? 0,
            unmatched: (raw as MonitoringPayload).summary?.unmatched ?? 0,
          },
        };

        if (!cancelled) {
          setPayload(safePayload);
          setLoadError(res.ok ? null : (raw as { error?: string }).error ?? 'Monitoring data unavailable');
        }
      } catch {
        if (!cancelled) {
          setPayload({ listings: [], summary: EMPTY_SUMMARY });
          setLoadError('Monitoring data unavailable');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const listings = useMemo(() => payload?.listings ?? [], [payload]);
  const summary = payload?.summary ?? EMPTY_SUMMARY;
  const topCities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const listing of listings) {
      const city = listing.propertyCity?.trim();
      if (!city) continue;
      counts.set(city, (counts.get(city) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [listings]);

  const filteredListings = useMemo(() => {
    if (activeFilter === 'all') return listings;
    return listings.filter((x) => x.complianceStatus === activeFilter);
  }, [activeFilter, listings]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-84.0, 33.95],
      zoom: 9,
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (filteredListings.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();

    for (const listing of filteredListings) {
      const el = document.createElement('div');
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '9999px';
      el.style.backgroundColor = STATUS_META[listing.complianceStatus].dot;
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 1px 10px rgba(0,0,0,0.25)';

      const popupHtml = `
        <div style="font-family: ui-sans-serif, system-ui; min-width: 220px;">
          <div style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: .06em;">${STATUS_META[listing.complianceStatus].label}</div>
          <div style="font-weight: 700; margin-top: 4px; color: #0f172a;">${listing.title}</div>
          <div style="margin-top: 6px; font-size: 12px; color: #334155;">${listing.propertyAddress ?? 'No matched property'}</div>
          <div style="margin-top: 6px; font-size: 12px; color: #475569;">Source: ${listing.source.toUpperCase()}</div>
          <div style="margin-top: 2px; font-size: 12px; color: #475569;">Confidence: ${(listing.matchConfidence * 100).toFixed(0)}%</div>
          <div style="margin-top: 2px; font-size: 12px; color: #475569;">License: ${listing.licenseNumber ?? 'None'}</div>
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([listing.lng, listing.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(popupHtml))
        .addTo(mapRef.current);

      markersRef.current.push(marker);
      bounds.extend([listing.lng, listing.lat]);
    }

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 500 });
    }
  }, [filteredListings]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="font-medium text-slate-600 hover:text-[var(--admin-brand)]">
          Overview
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-700">Monitoring</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Monitoring Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Live map of external listings versus known licensed properties.
          </p>
        </div>
      </div>

      {!loading && (
        <section className="mb-4 grid gap-3 md:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Total Listings</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{summary.total}</div>
          </article>
          <article className="rounded-xl border border-slate-200 bg-green-50 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-green-700">Licensed</div>
            <div className="mt-1 text-2xl font-semibold text-green-900">{summary.licensed}</div>
          </article>
          <article className="rounded-xl border border-slate-200 bg-amber-50 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700">Matched, No Active License</div>
            <div className="mt-1 text-2xl font-semibold text-amber-900">{summary.matchedUnlicensed}</div>
          </article>
          <article className="rounded-xl border border-slate-200 bg-rose-50 p-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-700">Unmatched</div>
            <div className="mt-1 text-2xl font-semibold text-rose-900">{summary.unmatched}</div>
          </article>
        </section>
      )}

      {!loading && topCities.length > 0 && (
        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Top Cities In Current Dataset
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {topCities.map(([city, count]) => (
              <span
                key={city}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {city}, GA ({count})
              </span>
            ))}
          </div>
        </section>
      )}

      {loadError && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white py-20 text-center text-sm text-slate-400">
          Loading monitoring map...
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
          <section className="admin-panel overflow-hidden p-3">
            <div className="mb-3 flex flex-wrap gap-2 px-1 pt-1">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  activeFilter === 'all'
                    ? 'border-[var(--admin-brand)] bg-[var(--admin-brand)] text-white'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                All ({summary.total})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('licensed')}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  activeFilter === 'licensed'
                    ? 'border-[var(--admin-brand)] bg-[var(--admin-brand)] text-white'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Licensed ({summary.licensed})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('matched_unlicensed')}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  activeFilter === 'matched_unlicensed'
                    ? 'border-[var(--admin-brand)] bg-[var(--admin-brand)] text-white'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Matched, No Active License ({summary.matchedUnlicensed})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('unmatched')}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  activeFilter === 'unmatched'
                    ? 'border-[var(--admin-brand)] bg-[var(--admin-brand)] text-white'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Unmatched ({summary.unmatched})
              </button>
            </div>

            <div ref={mapContainerRef} className="h-[520px] w-full rounded-xl border border-slate-200" />
          </section>

          <aside className="admin-panel p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Legend</h2>
            <div className="mt-3 space-y-2">
              {(Object.keys(STATUS_META) as ComplianceStatus[]).map((status) => (
                <div key={status} className="flex items-center gap-2 text-sm text-slate-700">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: STATUS_META[status].dot }}
                  />
                  <span>{STATUS_META[status].label}</span>
                </div>
              ))}
            </div>

            <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
              Listings ({filteredListings.length})
            </h3>
            <div className="mt-3 max-h-[380px] space-y-2 overflow-auto pr-1">
              {filteredListings.slice(0, 20).map((listing) => (
                <article key={listing.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    {listing.source}
                  </div>
                  <div className="mt-1 line-clamp-2 text-sm font-semibold text-slate-900">{listing.title}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {listing.propertyAddress ?? 'No matched property'}
                  </div>
                  <div
                    className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_META[listing.complianceStatus].color}`}
                  >
                    {STATUS_META[listing.complianceStatus].label}
                  </div>
                </article>
              ))}
              {filteredListings.length === 0 && (
                <div className="rounded-lg border border-slate-200 py-6 text-center text-sm text-slate-400">
                  No listings for this filter.
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
