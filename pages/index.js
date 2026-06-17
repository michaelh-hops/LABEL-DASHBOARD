import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

// ---- Seed data (shown on load / if API fails) ----
const SEED = {
  ok: true, days: 7,
  summary: { total_orders: 22, gross_revenue: 3732, total_units: 14, aov: 170, units_gifted: 12, revenue_by_day: [240, 330, 300, 470, 520, 410, 600], orders_by_day: [3, 5, 4, 6, 7, 5, 8] },
  products: [
    { title: 'Track Jacket', units: 6, revenue: 1225 },
    { title: 'Long Sleeve T', units: 6, revenue: 630 },
    { title: 'Sauna Hat', units: 7, revenue: 480 },
    { title: "GN '25 Tote", units: 4, revenue: 418 },
    { title: 'Global Nomads Hat', units: 4, revenue: 266 },
    { title: 'Pixels Socks', units: 4, revenue: 70 },
    { title: 'GN T-Shirt', units: 1, revenue: 55 },
    { title: 'Camera Club Tee', units: 1, revenue: 50 },
  ],
  referrers: [
    { source: 'Direct', orders: 14, revenue: 2600, platform: 'direct' },
    { source: 'Search', orders: 5, revenue: 680, platform: 'search' },
    { source: 'Social', orders: 3, revenue: 452, platform: 'social' },
  ],
  inventory: {
    low_stock: [
      { title: 'Global Nomads Hat', variant: 'One size', units: 3 },
      { title: 'Citizen Hoodie', variant: 'S', units: 2 },
      { title: 'Ball Park Stickers', variant: 'One size', units: 4 },
      { title: 'Pixels Hoodie', variant: 'S', units: 1 },
      { title: "GN '25 Tee", variant: 'M', units: 3 },
    ],
    out_of_stock: [
      { title: 'Citizens Circle: Radu Pose', variant: 'S' },
      { title: 'GN T-Shirt', variant: 'XS' },
      { title: 'Sauna Hat', variant: 'One size' },
    ],
    most_moved: [
      { title: 'Sauna Hat', units_sold: 7, remaining: 0 },
      { title: 'Long Sleeve T', units_sold: 6, remaining: 64 },
      { title: 'Track Jacket', units_sold: 6, remaining: 33 },
      { title: "GN '25 Tote", units_sold: 4, remaining: 45 },
      { title: 'Global Nomads Hat', units_sold: 4, remaining: 24 },
    ],
  },
  gifting: {
    total_cost: 562,
    total_units: 12,
    client: {
      total_cost: 420,
      products: [
        { title: 'Global Nomads Hat', units: 6, cost: 120 },
        { title: "GN '25 Tote", units: 4, cost: 84 },
        { title: 'Pixels Socks', units: 3, cost: 45 },
        { title: 'Sauna Hat', units: 2, cost: 60 },
      ],
      orders: [
        { name: 'Justin Medley', date: 'Jun 10', items: "Pixels Socks ×2, GN Hat ×2, GN '25 Tote ×2" },
        { name: 'Nikki Peddie', date: 'Jun 9', items: 'GN Hat, Long Sleeve T, Sauna Hat' },
        { name: 'Shawn Kelley', date: 'Jun 8', items: 'Pixels Socks, GN Hat, Camera Club Tee' },
      ],
    },
    freelance: {
      total_cost: 142,
      products: [
        { title: 'Global Nomads Hat', units: 2, cost: 40 },
        { title: 'Long Sleeve T', units: 2, cost: 54 },
        { title: 'Pixels Tote', units: 1, cost: 28 },
        { title: 'Sauna Hat', units: 1, cost: 20 },
      ],
      orders: [
        { name: 'Afonso Calixto', date: 'Apr 16', items: 'GN Hat, Pixels Socks' },
        { name: 'Sally Kallet', date: 'Apr 17', items: 'Long Sleeve T, Camera Club Tee' },
      ],
    },
  },
  updated_at: new Date().toISOString(),
};

// ---- Helpers ----
function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}

function timeAgo(iso) {
  if (!iso) return '—';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function spark(vals, w = 96, h = 28) {
  if (!vals || vals.length < 2) return '';
  const mn = Math.min(...vals), mx = Math.max(...vals), n = vals.length;
  return vals.map((v, i) => {
    const x = (i / (n - 1)) * w;
    const y = mx === mn ? h / 2 : h - ((v - mn) / (mx - mn)) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function areaChart(vals) {
  const w = 660, h = 210, pad = 14;
  const n = vals.length;
  const mn = Math.min(...vals) * 0.88;
  const mx = Math.max(...vals) * 1.04;
  const X = i => (i / (n - 1)) * w;
  const Y = v => h - ((v - mn) / (mx - mn)) * (h - pad * 2) - pad;
  let line = `M${X(0).toFixed(1)},${Y(vals[0]).toFixed(1)}`;
  for (let i = 1; i < n; i++) line += ` L${X(i).toFixed(1)},${Y(vals[i]).toFixed(1)}`;
  const area = `${line} L${w},${h} L0,${h} Z`;
  return { line, area, lastX: X(n - 1).toFixed(1), lastY: Y(vals[n - 1]).toFixed(1) };
}

function buildDonut(segs) {
  const r = 54, C = 2 * Math.PI * r;
  const total = segs.reduce((s, x) => s + x.value, 0) || 1;
  let off = 0;
  return segs.map(s => {
    const len = (s.value / total) * C;
    const o = { color: s.color, dash: `${len.toFixed(2)} ${(C - len).toFixed(2)}`, offset: (-off).toFixed(2) };
    off += len;
    return o;
  });
}

const RAMP = ['var(--g1)', 'var(--g2)', 'var(--g3)', 'var(--g4)', 'var(--g5)'];
const rankColor = i => i === 0 ? 'var(--accent)' : RAMP[Math.min(i, RAMP.length - 1)];

// Fallback spark series used only when API hasn't loaded yet
const SPARK_FALLBACK = [60, 80, 70, 110, 120, 95, 140, 130, 165, 155, 125, 195, 175, 210];

// ---- TOPBAR ----
function Topbar({ theme, onToggleTheme, updatedAt }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 34px', height: 50, borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <span style={{ font: '700 14px/1 "Lausanne",sans-serif', letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'var(--ink)' }}>
          Los York<span style={{ fontSize: 8, verticalAlign: 'super', fontWeight: 600 }}>®</span>
        </span>
        <span style={{ font: '600 13px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>X</span>
        <span style={{ font: '600 14px/1 "Lausanne",sans-serif', letterSpacing: '0.02em', textTransform: 'uppercase', color: 'var(--muted)' }}>Label</span>
        <span style={{ font: 'italic 400 14px/1 "PP Editorial New",serif', letterSpacing: '-0.01em', color: 'var(--muted)', borderBottom: '1px solid var(--line)', paddingBottom: 1 }}>operations</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ position: 'relative', width: 7, height: 7, display: 'inline-flex' }}>
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--neg)' }} />
            <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--neg)', animation: 'lyPulse 2s ease-out infinite' }} />
          </span>
          <span style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink)' }}>live</span>
        </div>
        <span style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '0.02em', color: 'var(--faint)' }}>
          updated {timeAgo(updatedAt)}
        </span>
        <button
          onClick={onToggleTheme}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 13px', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink)', font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase', transition: 'border-color .2s' }}
        >
          <span style={{ fontSize: 12 }}>{theme === 'light' ? '☾' : '☀'}</span>
          {theme === 'light' ? 'dark' : 'light'}
        </button>
      </div>
    </div>
  );
}

// ---- KPI CARD ----
function KpiCard({ label, value, sub, sparkVals, lineColor }) {
  const pts = spark(sparkVals);
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '20px 22px 16px', display: 'flex', flexDirection: 'column', gap: 14, animation: 'lyFade .4s ease both' }}>
      <span style={{ font: '600 11px/1.2 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9 }}>
        <span style={{ font: '800 42px/0.9 "Lausanne",sans-serif', letterSpacing: '-0.03em', color: 'var(--ink)' }}>{value}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
        <span style={{ font: '400 11px/1.3 "Lausanne",sans-serif', color: 'var(--faint)', maxWidth: '55%' }}>{sub}</span>
        {pts && (
          <svg viewBox="0 0 96 28" width="96" height="28" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <polyline fill="none" stroke={lineColor || 'var(--g1)'} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={pts} />
          </svg>
        )}
      </div>
    </div>
  );
}

// ---- NAV ROW ----
function NavRow({ view, setView, days, setDays }) {
  const TABS = ['sales', 'inventory', 'traffic', 'gifting', 'compare', 'ads'];
  const PILLS = [7, 14, 30, 90];
  return (
    <div style={{ maxWidth: 1480, margin: '0 auto', padding: '26px 34px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid var(--line)' }}>
      <div style={{ display: 'flex', gap: 26 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setView(t)} style={{ font: '600 14px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', padding: '0 0 12px', background: 'none', border: 'none', borderBottom: `2px solid ${view === t ? 'var(--accent)' : 'transparent'}`, cursor: 'pointer', color: view === t ? 'var(--ink)' : 'var(--muted)', transition: 'color .15s', marginBottom: -1 }}>{t}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 5, paddingBottom: 9 }}>
        {PILLS.map(d => (
          <button key={d} onClick={() => setDays(d)} style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '0.02em', textTransform: 'uppercase', padding: '7px 12px', borderRadius: 6, cursor: 'pointer', transition: 'all .15s', background: days === d ? 'var(--ink)' : 'transparent', color: days === d ? 'var(--paper)' : 'var(--muted)', border: `1px solid ${days === d ? 'var(--ink)' : 'var(--line)'}` }}>{d}D</button>
        ))}
      </div>
    </div>
  );
}

// ---- SALES VIEW ----
function SalesView({ data, days }) {
  const s = data?.summary || {};
  const products = (data?.products || []).slice().sort((a, b) => b.revenue - a.revenue);
  const referrers = data?.referrers || [];
  const totalSrcOrders = referrers.reduce((sum, r) => sum + r.orders, 0) || 1;
  const maxSrcOrders = Math.max(...referrers.map(r => r.orders), 1);

  const sourcesTop = referrers.slice(0, 5).map((r, i) => ({
    ...r,
    pct: `${Math.round((r.orders / totalSrcOrders) * 100)}%`,
    width: `${Math.max(4, (r.orders / maxSrcOrders) * 100).toFixed(1)}%`,
    color: rankColor(i),
  }));

  const maxRev = Math.max(...products.map(p => p.revenue), 1);
  const totalProdUnits = products.reduce((s, p) => s + p.units, 0);
  const totalProdRev = products.reduce((s, p) => s + p.revenue, 0);

  const trend = (data?.summary?.revenue_by_day?.length >= 2) ? data.summary.revenue_by_day : SPARK_FALLBACK;
  const chart = areaChart(trend);
  const today = new Date();
  const step = (trend.length - 1) / 4;
  const axis = [0, 1, 2, 3, 4].map(n => {
    const offset = trend.length - 1 - Math.round(n * step);
    const d = new Date(today); d.setDate(d.getDate() - offset);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'lyFade .35s ease both' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 14 }}>

        {/* Revenue card */}
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '26px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)' }}>revenue · last {days} days</span>
            <span style={{ font: 'italic 400 14px/1 "PP Editorial New",serif', color: 'var(--faint)' }}>rolling 14-day trend</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
            <span style={{ font: '800 56px/0.9 "Lausanne",sans-serif', letterSpacing: '-0.04em', color: 'var(--ink)' }}>{fmt(s.gross_revenue)}</span>
          </div>
          <svg viewBox="0 0 660 210" width="100%" height="200" preserveAspectRatio="none" style={{ display: 'block', marginTop: 10, overflow: 'visible' }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--accent)" stopOpacity="0.16" />
                <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={chart.area} fill="url(#revGrad)" />
            <path d={chart.line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={chart.lastX} cy={chart.lastY} r="5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2.5" />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            {axis.map((a, i) => <span key={i} style={{ font: '600 10px/1 "Lausanne",sans-serif', letterSpacing: '0.02em', color: 'var(--faint)' }}>{a}</span>)}
          </div>
        </div>

        {/* Top order sources */}
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '24px 26px' }}>
          <div style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)', marginBottom: 20 }}>top order sources</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 17 }}>
            {sourcesTop.length === 0
              ? <span style={{ font: '400 12px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>no source data</span>
              : sourcesTop.map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                    <span style={{ font: '600 14px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', color: 'var(--ink)' }}>{s.source}</span>
                    <span style={{ font: '600 12px/1 "Lausanne",sans-serif', color: 'var(--muted)' }}>{s.orders} · {s.pct}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'var(--track)' }}>
                    <div style={{ height: 6, borderRadius: 3, width: s.width, background: s.color }} />
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* Product sales */}
      <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '26px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22 }}>
          <span style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)' }}>product sales · last {days} days</span>
          <span style={{ font: '600 12px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>{totalProdUnits} units · {fmt(totalProdRev)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          {products.length === 0
            ? <span style={{ font: '400 12px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>no product data</span>
            : products.map((p, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '185px 1fr 86px 56px', gap: 18, alignItems: 'center' }}>
                <span style={{ font: '600 14px/1.2 "Lausanne",sans-serif', letterSpacing: '-0.01em', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                <div style={{ height: 14, borderRadius: 3, background: 'var(--track)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${Math.max(7, (p.revenue / maxRev) * 100).toFixed(1)}%`, background: rankColor(i) }} />
                </div>
                <span style={{ textAlign: 'right', font: '700 14px/1 "Lausanne",sans-serif', letterSpacing: '-0.02em', color: 'var(--ink)' }}>{fmt(p.revenue)}</span>
                <span style={{ textAlign: 'right', font: '400 12px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>{p.units} u</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ---- INVENTORY VIEW ----
function InventoryView({ data, days }) {
  const inv = data?.inventory || {};
  const lowStock = inv.low_stock || [];
  const outOfStock = inv.out_of_stock || [];
  const mostMoved = inv.most_moved || [];
  const totalSkus = inv.total_skus || (lowStock.length + outOfStock.length + Math.max(0, 40 - lowStock.length - outOfStock.length));

  const healthy = Math.max(0, totalSkus - lowStock.length - outOfStock.length);
  const segments = buildDonut([
    { value: healthy, color: 'var(--g4)' },
    { value: lowStock.length, color: 'var(--g2)' },
    { value: outOfStock.length, color: 'var(--neg)' },
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'lyFade .35s ease both' }}>
      {/* Health summary */}
      <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '26px 28px', display: 'grid', gridTemplateColumns: '160px 1fr', gap: 34, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 150, height: 150 }}>
          <svg viewBox="0 0 140 140" width="150" height="150">
            <g transform="rotate(-90 70 70)">
              <circle cx="70" cy="70" r="54" fill="none" stroke="var(--track)" strokeWidth="16" />
              {segments.map((seg, i) => (
                <circle key={i} cx="70" cy="70" r="54" fill="none" stroke={seg.color} strokeWidth="16" strokeDasharray={seg.dash} strokeDashoffset={seg.offset} />
              ))}
            </g>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ font: '800 34px/0.9 "Lausanne",sans-serif', letterSpacing: '-0.03em', color: 'var(--ink)' }}>{totalSkus}</span>
            <span style={{ font: '600 9px/1 "Lausanne",sans-serif', letterSpacing: '0.04em', textTransform: 'lowercase', color: 'var(--muted)' }}>skus</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { label: 'healthy', value: healthy, color: 'var(--g1)' },
            { label: 'low', value: lowStock.length, color: 'var(--g3)' },
            { label: 'out', value: outOfStock.length, color: 'var(--neg)' },
          ].map(c => (
            <div key={c.label} style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                <span style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)' }}>{c.label}</span>
              </div>
              <span style={{ font: '800 32px/0.9 "Lausanne",sans-serif', letterSpacing: '-0.03em', color: 'var(--ink)' }}>{c.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Three columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.15fr', gap: 14 }}>
        {/* Low stock */}
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--g3)', flexShrink: 0 }} />
            <span style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)' }}>low stock</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {lowStock.length === 0
              ? <span style={{ font: '400 12px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>all good</span>
              : lowStock.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ font: '600 13px/1.2 "Lausanne",sans-serif', letterSpacing: '-0.01em', color: 'var(--ink)' }}>{item.title}</div>
                    {item.variant && <div style={{ font: '400 11px/1 "Lausanne",sans-serif', color: 'var(--faint)', marginTop: 3 }}>{item.variant}</div>}
                  </div>
                  <span style={{ font: '700 12px/1 "Lausanne",sans-serif', padding: '5px 9px', borderRadius: 4, whiteSpace: 'nowrap', color: 'var(--ink)', background: 'var(--surface-2)', flexShrink: 0 }}>{item.units} left</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Out of stock */}
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neg)', flexShrink: 0 }} />
            <span style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)' }}>out of stock</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {outOfStock.length === 0
              ? <span style={{ font: '400 12px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>all stocked</span>
              : outOfStock.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ font: '600 13px/1.2 "Lausanne",sans-serif', letterSpacing: '-0.01em', color: 'var(--ink)' }}>{item.title}</div>
                    {item.variant && <div style={{ font: '400 11px/1 "Lausanne",sans-serif', color: 'var(--faint)', marginTop: 3 }}>{item.variant}</div>}
                  </div>
                  <span style={{ font: '700 10px/1 "Lausanne",sans-serif', letterSpacing: '0.03em', textTransform: 'uppercase', padding: '5px 9px', borderRadius: 4, whiteSpace: 'nowrap', color: '#fff', background: 'var(--neg)', flexShrink: 0 }}>sold out</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Most moved */}
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--g1)', flexShrink: 0 }} />
            <span style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)' }}>most moved · {days} days</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mostMoved.length === 0
              ? <span style={{ font: '400 12px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>no sales data</span>
              : mostMoved.map((item, i) => {
                const soldOut = item.remaining === 0 || item.remaining === '0';
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ font: '600 13px/1.2 "Lausanne",sans-serif', letterSpacing: '-0.01em', color: 'var(--ink)' }}>{item.title}</div>
                      <div style={{ font: '400 11px/1 "Lausanne",sans-serif', color: soldOut ? 'var(--neg)' : 'var(--faint)', marginTop: 3 }}>
                        {soldOut ? 'sold out' : `${item.remaining} remaining`}
                      </div>
                    </div>
                    <span style={{ font: '700 12px/1 "Lausanne",sans-serif', padding: '5px 9px', borderRadius: 4, whiteSpace: 'nowrap', color: 'var(--ink)', background: 'var(--surface-2)', flexShrink: 0 }}>{item.units_sold} sold</span>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- TRAFFIC VIEW ----
function TrafficView({ data }) {
  const referrers = data?.referrers || [];
  const totalOrders = referrers.reduce((s, r) => s + r.orders, 0) || 1;
  const maxOrders = Math.max(...referrers.map(r => r.orders), 1);

  const sources = referrers.map((r, i) => ({
    ...r,
    pct: `${Math.round((r.orders / totalOrders) * 100)}%`,
    perOrder: r.orders > 0 ? fmt(r.revenue / r.orders) : '—',
    revText: fmt(r.revenue),
    width: `${((r.orders / maxOrders) * 100).toFixed(1)}%`,
    color: rankColor(i),
  }));

  const donutSegs = buildDonut(referrers.map((r, i) => ({ value: r.orders, color: rankColor(i) })));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.5fr)', gap: 14, animation: 'lyFade .35s ease both' }}>
      {/* Donut + legend */}
      <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '26px 28px' }}>
        <div style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)', marginBottom: 18 }}>orders by source</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ position: 'relative', width: 200, height: 200 }}>
            <svg viewBox="0 0 140 140" width="200" height="200">
              <g transform="rotate(-90 70 70)">
                <circle cx="70" cy="70" r="54" fill="none" stroke="var(--track)" strokeWidth="19" />
                {donutSegs.map((seg, i) => (
                  <circle key={i} cx="70" cy="70" r="54" fill="none" stroke={seg.color} strokeWidth="19" strokeDasharray={seg.dash} strokeDashoffset={seg.offset} />
                ))}
              </g>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ font: '800 38px/0.9 "Lausanne",sans-serif', letterSpacing: '-0.03em', color: 'var(--ink)' }}>{referrers.reduce((s, r) => s + r.orders, 0)}</span>
              <span style={{ font: '600 9px/1 "Lausanne",sans-serif', letterSpacing: '0.04em', textTransform: 'lowercase', color: 'var(--muted)' }}>orders</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px 18px', width: '100%' }}>
            {sources.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                <span style={{ font: '400 12px/1 "Lausanne",sans-serif', color: 'var(--muted)' }}>{s.source}</span>
                <span style={{ font: '600 12px/1 "Lausanne",sans-serif', color: 'var(--ink)', marginLeft: 'auto' }}>{s.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance table */}
      <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '26px 28px' }}>
        <div style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)', marginBottom: 4 }}>source performance</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 70px 100px 90px', padding: '12px 0 11px', borderBottom: '1px solid var(--line)', font: '600 10px/1 "Lausanne",sans-serif', letterSpacing: '0.02em', textTransform: 'lowercase', color: 'var(--faint)' }}>
          <span>source</span><span style={{ textAlign: 'right' }}>orders</span><span style={{ textAlign: 'right' }}>revenue</span><span style={{ textAlign: 'right' }}>per order</span>
        </div>
        {sources.length === 0
          ? <div style={{ padding: '18px 0', font: '400 12px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>no source data</div>
          : sources.map((s, i) => (
            <div key={i} style={{ padding: '15px 0 13px', borderBottom: '1px solid var(--hair)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 70px 100px 90px', alignItems: 'center', marginBottom: 9 }}>
                <span style={{ font: '600 14px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flexShrink: 0 }} />{s.source}
                </span>
                <span style={{ textAlign: 'right', font: '700 14px/1 "Lausanne",sans-serif', letterSpacing: '-0.02em', color: 'var(--ink)' }}>{s.orders}</span>
                <span style={{ textAlign: 'right', font: '600 14px/1 "Lausanne",sans-serif', letterSpacing: '-0.02em', color: 'var(--ink)' }}>{s.revText}</span>
                <span style={{ textAlign: 'right', font: '400 13px/1 "Lausanne",sans-serif', color: 'var(--muted)' }}>{s.perOrder}</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'var(--track)' }}>
                <div style={{ height: 5, borderRadius: 3, width: s.width, background: s.color }} />
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ---- GIFTING VIEW ----
function GiftingView({ data, days }) {
  const [clientOpen, setClientOpen] = useState(false);
  const [freeOpen, setFreeOpen] = useState(false);

  const g = data?.gifting;
  if (!g) return <div style={{ font: '400 13px/1 "Lausanne",sans-serif', color: 'var(--faint)', padding: 24 }}>no gifting data for this period</div>;

  const clientCost = g.client?.total_cost || 0;
  const freeCost = g.freelance?.total_cost || 0;
  const totalCost = g.total_cost || 0;
  const totalUnits = g.total_units || 0;

  const donutSegs = buildDonut([
    { value: clientCost, color: 'var(--accent)' },
    { value: freeCost, color: 'var(--g2)' },
  ]);

  const clientProds = g.client?.products || [];
  const freeProds = g.freelance?.products || [];
  const maxC = Math.max(...clientProds.map(p => p.units), 1);
  const maxF = Math.max(...freeProds.map(p => p.units), 1);
  const clientOrders = g.client?.orders || [];
  const freeOrders = g.freelance?.orders || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'lyFade .35s ease both' }}>
      {/* Header band */}
      <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '26px 28px', display: 'grid', gridTemplateColumns: '170px 1fr', gap: 38, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 170, height: 170 }}>
          <svg viewBox="0 0 140 140" width="170" height="170">
            <g transform="rotate(-90 70 70)">
              <circle cx="70" cy="70" r="54" fill="none" stroke="var(--track)" strokeWidth="18" />
              {donutSegs.map((seg, i) => (
                <circle key={i} cx="70" cy="70" r="54" fill="none" stroke={seg.color} strokeWidth="18" strokeDasharray={seg.dash} strokeDashoffset={seg.offset} />
              ))}
            </g>
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ font: '800 32px/0.9 "Lausanne",sans-serif', letterSpacing: '-0.03em', color: 'var(--ink)' }}>{fmt(totalCost)}</span>
            <span style={{ font: '600 9px/1 "Lausanne",sans-serif', letterSpacing: '0.04em', textTransform: 'lowercase', color: 'var(--muted)' }}>total cost</span>
          </div>
        </div>
        <div>
          <div style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)', marginBottom: 18 }}>gifting cost to business · {days} days</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            <div>
              <div style={{ font: '800 38px/0.9 "Lausanne",sans-serif', letterSpacing: '-0.03em', color: 'var(--ink)' }}>{totalUnits}</div>
              <div style={{ font: '400 11px/1 "Lausanne",sans-serif', color: 'var(--faint)', marginTop: 7 }}>units gifted</div>
            </div>
            <div>
              <div style={{ font: '800 38px/0.9 "Lausanne",sans-serif', letterSpacing: '-0.03em', color: 'var(--accent)' }}>{fmt(clientCost)}</div>
              <div style={{ font: '400 11px/1 "Lausanne",sans-serif', color: 'var(--faint)', marginTop: 7 }}>client gifting</div>
            </div>
            <div>
              <div style={{ font: '800 38px/0.9 "Lausanne",sans-serif', letterSpacing: '-0.03em', color: 'var(--g2)' }}>{fmt(freeCost)}</div>
              <div style={{ font: '400 11px/1 "Lausanne",sans-serif', color: 'var(--faint)', marginTop: 7 }}>freelance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two detail cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Client */}
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '24px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
            <span style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)' }}>client gifting</span>
            <span style={{ font: '400 12px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>cost <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>{fmt(clientCost)}</strong></span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 18 }}>
            {clientProds.map((p, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 42px', gap: 14, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ height: 8, borderRadius: 2, width: `${Math.round((p.units / maxC) * 70 + 8)}px`, minWidth: 8, background: 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ font: '600 12px/1.1 "Lausanne",sans-serif', letterSpacing: '-0.01em', color: 'var(--ink)' }}>{p.title}</span>
                </div>
                <span style={{ textAlign: 'right', font: '700 13px/1 "Lausanne",sans-serif', color: 'var(--ink)' }}>{p.units}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setClientOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 8, cursor: 'pointer', background: 'var(--surface-2)', border: 'none', font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)' }}>
            <span>{clientOpen ? 'hide orders' : `view orders (${clientOrders.length})`}</span>
            <span style={{ fontSize: 9 }}>▼</span>
          </button>
          {clientOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
              {clientOrders.map((o, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--hair)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ font: '600 13px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', color: 'var(--ink)' }}>{o.name}</span>
                    <span style={{ font: '400 11px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>{o.date}</span>
                  </div>
                  <div style={{ font: '400 11px/1.5 "Lausanne",sans-serif', color: 'var(--muted)', marginTop: 5 }}>{o.items}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Freelance */}
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '24px 26px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
            <span style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)' }}>freelance</span>
            <span style={{ font: '400 12px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>cost <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>{fmt(freeCost)}</strong></span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 18 }}>
            {freeProds.map((p, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 42px', gap: 14, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ height: 8, borderRadius: 2, width: `${Math.round((p.units / maxF) * 70 + 8)}px`, minWidth: 8, background: 'var(--g2)', flexShrink: 0 }} />
                  <span style={{ font: '600 12px/1.1 "Lausanne",sans-serif', letterSpacing: '-0.01em', color: 'var(--ink)' }}>{p.title}</span>
                </div>
                <span style={{ textAlign: 'right', font: '700 13px/1 "Lausanne",sans-serif', color: 'var(--ink)' }}>{p.units}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setFreeOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 8, cursor: 'pointer', background: 'var(--surface-2)', border: 'none', font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)' }}>
            <span>{freeOpen ? 'hide orders' : `view orders (${freeOrders.length})`}</span>
            <span style={{ fontSize: 9 }}>▼</span>
          </button>
          {freeOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
              {freeOrders.map((o, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid var(--hair)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ font: '600 13px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', color: 'var(--ink)' }}>{o.name}</span>
                    <span style={{ font: '400 11px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>{o.date}</span>
                  </div>
                  <div style={{ font: '400 11px/1.5 "Lausanne",sans-serif', color: 'var(--muted)', marginTop: 5 }}>{o.items}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- COMPARE VIEW ----
function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}
function defaultRanges() {
  const today = new Date();
  const endB = new Date(today); endB.setDate(endB.getDate() - 1);
  const startB = new Date(today); startB.setDate(today.getDate() - 7);
  const endA = new Date(startB); endA.setDate(startB.getDate() - 1);
  const startA = new Date(endA); startA.setDate(endA.getDate() - 7);
  return {
    fromA: toDateStr(startA), toA: toDateStr(endA),
    fromB: toDateStr(startB), toB: toDateStr(endB),
  };
}

function CompareView() {
  const init = defaultRanges();
  const [fromA, setFromA] = useState(init.fromA);
  const [toA, setToA]     = useState(init.toA);
  const [fromB, setFromB] = useState(init.fromB);
  const [toB, setToB]     = useState(init.toB);
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchBoth(fa, ta, fb, tb) {
    setLoading(true);
    try {
      const [rA, rB] = await Promise.all([
        fetch(`/api/shopify?from=${fa}&to=${ta}`).then(r => r.json()),
        fetch(`/api/shopify?from=${fb}&to=${tb}`).then(r => r.json()),
      ]);
      if (rA.ok) setDataA(rA);
      if (rB.ok) setDataB(rB);
    } catch (e) { console.warn('Compare fetch failed:', e.message); }
    setLoading(false);
  }

  useEffect(() => { fetchBoth(fromA, toA, fromB, toB); }, []);

  function handleCompare() { fetchBoth(fromA, toA, fromB, toB); }

  const sA = dataA?.summary || {};
  const sB = dataB?.summary || {};
  const prodsA = dataA?.products || [];
  const prodsB = dataB?.products || [];

  function delta(a, b) {
    if (!a || a === 0) return { text: '—', color: 'var(--muted)' };
    const p = Math.round(((b - a) / a) * 100);
    return { text: `${p >= 0 ? '↑' : '↓'} ${Math.abs(p)}%`, color: p >= 0 ? 'var(--muted)' : 'var(--neg)' };
  }

  const kpis = [
    { label: 'gross revenue', a: sA.gross_revenue, b: sB.gross_revenue, money: true },
    { label: 'orders', a: sA.total_orders, b: sB.total_orders, money: false },
    { label: 'avg order value', a: sA.aov, b: sB.aov, money: true },
    { label: 'units sold', a: sA.total_units, b: sB.total_units, money: false },
  ].map(k => {
    const d = delta(k.a, k.b);
    return { ...k, aText: k.money ? fmt(k.a) : (k.a ?? '—'), bText: k.money ? fmt(k.b) : (k.b ?? '—'), ...d };
  });

  const titleSet = new Set([...prodsA.map(p => p.title), ...prodsB.map(p => p.title)]);
  const rows = [...titleSet].map(title => {
    const a = prodsA.find(p => p.title === title)?.revenue || 0;
    const b = prodsB.find(p => p.title === title)?.revenue || 0;
    const d = delta(a, b);
    return { title, a, b, aText: fmt(a), bText: fmt(b), ...d };
  }).sort((x, y) => y.b - x.b);
  const maxVal = Math.max(...rows.flatMap(r => [r.a, r.b]), 1);

  const inputStyle = {
    background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)',
    padding: '6px 10px', borderRadius: 6, font: '600 12px/1 "Lausanne",sans-serif',
    outline: 'none', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'lyFade .35s ease both' }}>
      {/* Period bar with date pickers */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: 'var(--surface)', borderRadius: 10, padding: '16px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ font: '600 10px/1 "Lausanne",sans-serif', letterSpacing: '0.02em', textTransform: 'lowercase', color: 'var(--muted)' }}>period a</span>
          <input type="date" value={fromA} onChange={e => setFromA(e.target.value)} style={inputStyle} />
          <span style={{ font: '400 11px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>–</span>
          <input type="date" value={toA} onChange={e => setToA(e.target.value)} style={inputStyle} />
        </div>
        <span style={{ font: '700 12px/1 "Lausanne",sans-serif', color: 'var(--faint)', letterSpacing: '0.04em' }}>VS</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ font: '600 10px/1 "Lausanne",sans-serif', letterSpacing: '0.02em', textTransform: 'lowercase', color: 'var(--muted)' }}>period b</span>
          <input type="date" value={fromB} onChange={e => setFromB(e.target.value)} style={{ ...inputStyle, background: 'var(--accent)', color: 'var(--accent-on)', borderColor: 'var(--accent)' }} />
          <span style={{ font: '400 11px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>–</span>
          <input type="date" value={toB} onChange={e => setToB(e.target.value)} style={{ ...inputStyle, background: 'var(--accent)', color: 'var(--accent-on)', borderColor: 'var(--accent)' }} />
        </div>
        <button onClick={handleCompare} disabled={loading} style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', background: 'var(--ink)', color: 'var(--paper)', border: 'none', opacity: loading ? 0.5 : 1 }}>
          {loading ? 'loading…' : 'compare'}
        </button>
      </div>

      {/* 4 KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: 'var(--surface)', borderRadius: 10, padding: '22px 24px' }}>
            <div style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)', marginBottom: 16 }}>{k.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 9 }}>
              <span style={{ font: '800 34px/0.9 "Lausanne",sans-serif', letterSpacing: '-0.03em', color: 'var(--ink)' }}>{k.bText}</span>
              <span style={{ font: '600 12px/1 "Lausanne",sans-serif', color: k.color }}>{k.text}</span>
            </div>
            <div style={{ font: '400 12px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>was {k.aText}</div>
          </div>
        ))}
      </div>

      {/* Side-by-side product table */}
      <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '26px 28px' }}>
        <div style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)', marginBottom: 4 }}>product revenue · side by side</div>
        <div style={{ display: 'grid', gridTemplateColumns: '165px 1fr 78px', padding: '12px 0 11px', borderBottom: '1px solid var(--line)', font: '600 10px/1 "Lausanne",sans-serif', letterSpacing: '0.02em', textTransform: 'lowercase', color: 'var(--faint)' }}>
          <span>product</span><span>a vs b</span><span style={{ textAlign: 'right' }}>change</span>
        </div>
        {rows.length === 0
          ? <div style={{ padding: '18px 0', font: '400 12px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>no product data</div>
          : rows.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '165px 1fr 78px', gap: 16, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--hair)' }}>
              <span style={{ font: '600 13px/1.2 "Lausanne",sans-serif', letterSpacing: '-0.01em', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ height: 8, borderRadius: 2, width: `${Math.max(2, (r.a / maxVal) * 100).toFixed(1)}%`, minWidth: 3, background: 'var(--g4)' }} />
                  <span style={{ font: '400 11px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>{r.aText}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ height: 8, borderRadius: 2, width: `${Math.max(2, (r.b / maxVal) * 100).toFixed(1)}%`, minWidth: 3, background: 'var(--g1)' }} />
                  <span style={{ font: '600 11px/1 "Lausanne",sans-serif', color: 'var(--ink)' }}>{r.bText}</span>
                </div>
              </div>
              <span style={{ textAlign: 'right', font: '700 12px/1 "Lausanne",sans-serif', color: r.color }}>{r.text}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

// ---- ADS VIEW ----
function AdsView({ reaktion, setReaktion }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});

  function save() {
    const r = { ...draft, updated_at: new Date().toISOString() };
    setReaktion(r);
    setEditing(false);
  }

  const r = reaktion;
  const imp = Number(r?.impressions || 0);
  const clk = Number(r?.clicks || 0);
  const atc = Number(r?.add_to_cart || 0);
  const ord = Number(r?.orders || 0);
  const funnelSteps = r ? [
    { label: 'impressions', value: imp.toLocaleString(), width: '100%', conv: '', color: 'var(--g1)' },
    { label: 'clicks', value: clk.toLocaleString(), width: imp > 0 ? `${Math.min(100, (clk / imp) * 100).toFixed(1)}%` : '0%', conv: r.ctr ? `  ·  ${r.ctr}% ctr` : '', color: 'var(--g3)' },
    { label: 'add to cart', value: atc.toLocaleString(), width: clk > 0 ? `${Math.min(100, (atc / clk) * 100).toFixed(1)}%` : '0%', conv: clk > 0 ? `  ·  ${((atc / clk) * 100).toFixed(1)}%` : '', color: 'var(--g4)' },
    { label: 'orders', value: ord.toLocaleString(), width: clk > 0 ? `${Math.min(100, (ord / clk) * 100).toFixed(1)}%` : '0%', conv: clk > 0 ? `  ·  ${((ord / clk) * 100).toFixed(1)}%` : '', color: 'var(--accent)' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'lyFade .35s ease both' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)' }}>reaktion · ad metrics</div>
          {r?.updated_at && <div style={{ font: '400 11px/1 "Lausanne",sans-serif', color: 'var(--faint)', marginTop: 7 }}>updated {timeAgo(r.updated_at)}{r.name ? ` by ${r.name}` : ''}</div>}
        </div>
        <button onClick={() => { setDraft(r || {}); setEditing(!editing); }} style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '0.02em', textTransform: 'lowercase', padding: '8px 15px', borderRadius: 8, cursor: 'pointer', background: 'transparent', border: '1px solid var(--line)', color: 'var(--muted)' }}>
          {editing ? 'cancel' : 'update'}
        </button>
      </div>

      {editing ? (
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '26px 28px' }}>
          <div style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)', marginBottom: 20 }}>enter this week's reaktion numbers</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
            {[['spend', 'ad spend ($)'], ['roas', 'roas'], ['impressions', 'impressions'], ['clicks', 'clicks'], ['ctr', 'ctr (%)'], ['cpa', 'cpa ($)'], ['add_to_cart', 'add to cart'], ['orders', 'orders']].map(([key, label]) => (
              <div key={key}>
                <label style={{ font: '600 10px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>{label}</label>
                <input type="number" value={draft[key] || ''} onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '8px 10px', fontSize: 13, width: '100%', borderRadius: 6, outline: 'none', fontFamily: '"Lausanne",sans-serif' }} />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ font: '600 10px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>your name</label>
            <input type="text" placeholder="e.g. mike" value={draft.name || ''} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', padding: '8px 10px', fontSize: 13, width: 200, borderRadius: 6, outline: 'none', fontFamily: '"Lausanne",sans-serif' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={save} style={{ background: 'var(--ink)', border: 'none', color: 'var(--paper)', padding: '8px 20px', font: '600 11px/1 "Lausanne",sans-serif', cursor: 'pointer', borderRadius: 6 }}>save</button>
            <button onClick={() => setEditing(false)} style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--muted)', padding: '8px 20px', font: '600 11px/1 "Lausanne",sans-serif', cursor: 'pointer', borderRadius: 6 }}>cancel</button>
          </div>
        </div>
      ) : r ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              { label: 'ad spend', value: `$${Number(r.spend || 0).toLocaleString()}` },
              { label: 'roas', value: r.roas ? `${r.roas}×` : '—' },
              { label: 'impressions', value: imp ? imp.toLocaleString() : '—' },
              { label: 'clicks', value: clk ? clk.toLocaleString() : '—' },
              { label: 'ctr', value: r.ctr ? `${r.ctr}%` : '—' },
              { label: 'cpa', value: r.cpa ? `$${r.cpa}` : '—' },
            ].map((k, i) => (
              <div key={i} style={{ background: 'var(--surface)', borderRadius: 10, padding: '22px 24px' }}>
                <div style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)', marginBottom: 14 }}>{k.label}</div>
                <span style={{ font: '800 38px/0.9 "Lausanne",sans-serif', letterSpacing: '-0.03em', color: 'var(--ink)' }}>{k.value}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '26px 28px' }}>
            <div style={{ font: '600 11px/1 "Lausanne",sans-serif', letterSpacing: '-0.01em', textTransform: 'lowercase', color: 'var(--muted)', marginBottom: 22 }}>conversion funnel</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {funnelSteps.map((f, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 150px', gap: 16, alignItems: 'center' }}>
                  <span style={{ font: '600 12px/1.1 "Lausanne",sans-serif', letterSpacing: '-0.01em', color: 'var(--ink)' }}>{f.label}</span>
                  <div style={{ height: 30, borderRadius: 5, background: 'var(--track)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 5, width: f.width, background: f.color }} />
                  </div>
                  <span style={{ textAlign: 'right', font: '400 12px/1 "Lausanne",sans-serif', color: 'var(--muted)' }}>
                    <strong style={{ fontWeight: 700, color: 'var(--ink)' }}>{f.value}</strong>{f.conv}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '48px 28px', textAlign: 'center' }}>
          <div style={{ font: '400 13px/1 "Lausanne",sans-serif', color: 'var(--faint)', marginBottom: 6 }}>no ad data yet</div>
          <div style={{ font: '400 11px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>hit update to add this week's reaktion numbers</div>
        </div>
      )}
      <div style={{ font: '400 11px/1.6 "Lausanne",sans-serif', color: 'var(--faint)', padding: '0 4px' }}>
        reaktion has no public api — figures entered manually from advertiser.reaktion.com (~2 min weekly).
      </div>
    </div>
  );
}

// ---- MAIN DASHBOARD ----
export default function Dashboard() {
  const [theme, setTheme] = useState('light');
  const [view, setView] = useState('sales');
  const [days, setDays] = useState(7);
  const [data, setData] = useState(SEED);
  const [reaktion, setReaktion] = useState(null);

  // Init theme + reaktion from localStorage
  useEffect(() => {
    try {
      const t = localStorage.getItem('ly-theme');
      if (t === 'light' || t === 'dark') setTheme(t);
      const r = localStorage.getItem('ly-reaktion');
      if (r) setReaktion(JSON.parse(r));
    } catch {}
  }, []);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try { localStorage.setItem('ly-theme', next); } catch {}
  }

  function persistReaktion(r) {
    setReaktion(r);
    try { localStorage.setItem('ly-reaktion', JSON.stringify(r)); } catch {}
  }

  const fetchCurrent = useCallback(async (d) => {
    try {
      const res = await fetch(`/api/shopify?days=${d}`);
      const json = await res.json();
      if (json.ok) setData(json);
    } catch (e) {
      console.warn('API unavailable, using seed data:', e.message);
    }
  }, []);

  useEffect(() => {
    fetchCurrent(days);
    const interval = setInterval(() => fetchCurrent(days), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [days, fetchCurrent]);

  function handleSetDays(d) {
    setDays(d);
    fetchCurrent(d);
  }

  const s = data?.summary || {};
  const giftTotal = data?.gifting?.total_cost ?? SEED.gifting.total_cost;
  const giftUnits = s.units_gifted ?? SEED.summary.units_gifted;

  const revSeries = s.revenue_by_day?.length >= 2 ? s.revenue_by_day : SPARK_FALLBACK;
  const ordSeries = s.orders_by_day?.length >= 2 ? s.orders_by_day : SPARK_FALLBACK.map(v => Math.round(v / 17));
  // AOV per day: revenue / orders, 0 if no orders that day
  const aovSeries = revSeries.map((r, i) => ordSeries[i] > 0 ? Math.round(r / ordSeries[i]) : 0);

  const kpiCards = [
    { label: 'gross revenue', value: s.gross_revenue != null ? fmt(s.gross_revenue) : '—', sub: `last ${days} days`, sparkVals: revSeries, lineColor: 'var(--accent)' },
    { label: 'orders', value: s.total_orders ?? '—', sub: 'paid orders', sparkVals: ordSeries, lineColor: 'var(--g1)' },
    { label: 'avg order value', value: s.aov != null ? fmt(s.aov) : '—', sub: 'per paid order', sparkVals: aovSeries, lineColor: 'var(--g1)' },
    { label: 'gifting cost', value: fmt(giftTotal), sub: `${giftUnits} units gifted`, sparkVals: revSeries.map(v => Math.round(v * 0.08)), lineColor: 'var(--g2)' },
  ];

  return (
    <>
      <Head>
        <title>Los York Label — Operations</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div data-theme={theme} style={{ fontFamily: '"Lausanne",system-ui,sans-serif', background: 'var(--paper)', color: 'var(--ink)', minHeight: '100vh', transition: 'background .4s ease, color .4s ease' }}>

        <Topbar theme={theme} onToggleTheme={toggleTheme} updatedAt={data?.updated_at} />

        {/* KPI strip */}
        <div style={{ maxWidth: 1480, margin: '0 auto', padding: '24px 34px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {kpiCards.map((k, i) => <KpiCard key={i} {...k} />)}
          </div>
        </div>

        <NavRow view={view} setView={setView} days={days} setDays={handleSetDays} />

        {/* Content */}
        <div style={{ maxWidth: 1480, margin: '0 auto', padding: '22px 34px 40px' }}>
          {view === 'sales'     && <SalesView data={data} days={days} />}
          {view === 'inventory' && <InventoryView data={data} days={days} />}
          {view === 'traffic'   && <TrafficView data={data} />}
          {view === 'gifting'   && <GiftingView data={data} days={days} />}
          {view === 'compare'   && <CompareView />}
          {view === 'ads'       && <AdsView reaktion={reaktion} setReaktion={persistReaktion} />}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--line)', marginTop: 6 }}>
          <div style={{ maxWidth: 1480, margin: '0 auto', padding: '18px 34px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ font: '600 10px/1 "Lausanne",sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--faint)' }}>
              Los York <span style={{ fontSize: 7, verticalAlign: 'super' }}>®</span> — internal use only
            </span>
            <span style={{ font: '400 11px/1 "Lausanne",sans-serif', color: 'var(--faint)' }}>losyorklabel.com</span>
          </div>
        </div>

      </div>
    </>
  );
}
