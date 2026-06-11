import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

const SEED = {
  summary: { total_orders: 22, gross_revenue: 3732, total_units: 14, aov: 170 },
  products: [
    { title: 'TRACK JACKET', units: 6, revenue: 1225 },
    { title: 'LONG SLEEVE T', units: 6, revenue: 630 },
    { title: 'SAUNA HAT', units: 7, revenue: 480 },
    { title: 'The LOS YORK Global Nomads 25 Tote', units: 4, revenue: 418 },
    { title: 'LOS YORK Global Nomads hat', units: 4, revenue: 266 },
    { title: 'LOS YORK Pixels Socks', units: 4, revenue: 70 },
    { title: 'Los York Global Nomads T-shirt', units: 1, revenue: 55 },
    { title: 'LOS YORK Camera Club Tee', units: 1, revenue: 50 },
  ],
  referrers: [
    { source: 'Direct', orders: 14, revenue: 60, platform: 'direct' },
    { source: 'Google', orders: 4, revenue: 55, platform: 'google' },
    { source: 'Instagram', orders: 2, revenue: 120, platform: 'instagram' },
    { source: 'Pinterest', orders: 1, revenue: 55, platform: 'pinterest' },
    { source: 'TikTok', orders: 1, revenue: 25, platform: 'tiktok' },
  ],
  inventory: {
    low_stock: [
      { title: 'LY hat', variant: '', units: 3 },
      { title: 'LOS YORK CITIZEN HEAVYWEIGHT HOODIE', variant: 'S', units: 2 },
      { title: 'Ball Park Stickers', variant: '', units: 4 },
      { title: 'LOS YORK Pixels Hoodie', variant: 'S', units: 1 },
    ],
    out_of_stock: [
      { title: 'Citizens Circle: Radu Pose', variant: 'S', units: 0 },
      { title: 'LOS YORK GN T-shirt', variant: 'XS', units: 0 },
    ],
    most_moved: [
      { title: 'SAUNA HAT', variant: '', units_sold: 8, remaining: 133 },
      { title: 'LOS YORK Global Nomads hat', variant: '', units_sold: 6, remaining: 24 },
      { title: 'The LOS YORK Global Nomads 25 Tote', variant: '', units_sold: 5, remaining: 45 },
      { title: 'LOS YORK Pixels Socks', variant: '', units_sold: 4, remaining: 293 },
      { title: 'TRACK JACKET', variant: 'M', units_sold: 2, remaining: 33 },
    ],
  },
  updated_at: new Date().toISOString(),
};

const PLATFORM_STYLES = {
  instagram: { bg: '#fce4ec', color: '#e1306c', icon: '📷' },
  pinterest: { bg: '#fce8e8', color: '#e60023', icon: '📌' },
  tiktok:    { bg: '#f0faf0', color: '#010101', icon: '♪' },
  facebook:  { bg: '#e8f0fe', color: '#1877f2', icon: 'f' },
  twitter:   { bg: '#e8f5fd', color: '#1da1f2', icon: '𝕏' },
  google:    { bg: '#e8f0fe', color: '#4285f4', icon: 'G' },
  search:    { bg: '#e8f0fe', color: '#4285f4', icon: '🔍' },
  direct:    { bg: '#f0f0ec', color: '#888', icon: '→' },
  referral:  { bg: '#f5f0fe', color: '#7c3aed', icon: '↗' },
};

function getPlatformStyle(platform) {
  return PLATFORM_STYLES[platform?.toLowerCase()] || PLATFORM_STYLES.direct;
}

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function timeAgo(iso) {
  if (!iso) return '—';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

const S = {
  wrap: { fontFamily: "'Inter', 'Helvetica Neue', sans-serif", background: '#f0f0f0', minHeight: '100vh', color: '#1a1a1a' },
  header: { background: '#1a1a1a', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10, borderBottom: '2px solid #000' },
  logoText: { fontWeight: 600, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#fff' },
  logoSub: { fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5070', marginLeft: '10px' },
  livePill: { fontSize: '10px', background: 'rgba(30,132,73,0.1)', color: '#1e8449', border: '1.5px solid rgba(30,132,73,0.25)', padding: '4px 10px', borderRadius: '3px', letterSpacing: '.08em', fontWeight: '700' },
  refreshBtn: { fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 14px', cursor: 'pointer', background: 'none', border: '1.5px solid #555', borderRadius: '3px', color: '#aaa', fontFamily: 'inherit', fontWeight: '600' },
  timebar: { background: '#fff', padding: '12px 28px', borderBottom: '2px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' },
  timeLabel: { fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999', marginRight: '4px', fontWeight: '600' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0', background: '#fff', borderBottom: '2px solid #e0e0e0' },
  kpiCard: { padding: '26px 28px 22px' },
  kpiLabel: { fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: '6px' },
  kpiVal: { fontSize: '26px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: '#1c1f2e' },
  kpiSub: { fontSize: '10px', color: '#ccc', marginTop: '4px' },
  tabs: { background: '#fff', display: 'flex', gap: '0', padding: '0 28px', borderBottom: '2px solid #e0e0e0' },
  content: { padding: '28px 28px 48px' },
  secLabel: { fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#999', marginBottom: '12px', fontWeight: '600' },
  tbl: { background: '#fff', border: '0.5px solid #e8e8e4', borderRadius: '8px', overflow: 'hidden' },
  thead: { display: 'grid', padding: '10px 18px', borderBottom: '1.5px solid #e8e8e8', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#bbb', fontWeight: '600', background: '#fafafa' },
  trow: { display: 'grid', padding: '14px 18px', borderBottom: '1px solid #f0f0f0', alignItems: 'center' },
  ttotal: { display: 'grid', padding: '13px 18px', borderTop: '2px solid #e0e0e0', background: '#fafafa', fontWeight: 800, fontSize: '13px', color: '#1a1a1a' },
};

export default function Dashboard() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(SEED);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [tab, setTab] = useState('sales');
  const [reaktion, setReaktion] = useState(null);
  const [editingR, setEditingR] = useState(false);
  const [rDraft, setRDraft] = useState({});
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isCustomActive, setIsCustomActive] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async (d) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shopify?days=${d}`);
      const json = await res.json();
      if (json.ok) { setData(json); setIsLive(true); }
    } catch (e) { console.warn('Using seed data'); }
    setLoading(false);
  }, []);

  const fetchCustom = useCallback(async (from, to) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shopify?from=${from}&to=${to}`);
      const json = await res.json();
      if (json.ok) { setData(json); setIsLive(true); }
    } catch (e) { console.warn('Using seed data'); }
    setLoading(false);
  }, []);

  function applyCustom() {
    if (!customFrom || !customTo) return;
    setIsCustomActive(true);
    setShowCustom(false);
    fetchCustom(customFrom, customTo);
  }

  function handleSetDays(d) {
    setDays(d);
    setIsCustomActive(false);
    setShowCustom(false);
    fetchData(d);
  }

  useEffect(() => {
    fetchData(days);
    const iv = setInterval(() => { if (!isCustomActive) fetchData(days); }, 10 * 60 * 1000);
    return () => clearInterval(iv);
  }, [days, fetchData, isCustomActive]);

  const s = data?.summary || {};
  const products = data?.products || [];
  const referrers = data?.referrers || [];
  const lowStock = data?.inventory?.low_stock || [];
  const outOfStock = data?.inventory?.out_of_stock || [];
  const mostMoved = data?.inventory?.most_moved || [];

  const tabBtn = (t, label) => (
    <button key={t} onClick={() => setTab(t)} style={{ background: 'none', border: 'none', borderBottom: tab === t ? '3px solid #1a1a1a' : '3px solid transparent', color: tab === t ? '#1a1a1a' : '#aaa', padding: '13px 20px', fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', transition: 'all .15s', marginBottom: '-2px' }}>
      {label}
    </button>
  );

  const pillBtn = (d) => (
    <button key={d} onClick={() => handleSetDays(d)} style={{ background: !isCustomActive && days === d ? '#1a1a1a' : 'none', color: !isCustomActive && days === d ? '#fff' : '#888', border: !isCustomActive && days === d ? '1.5px solid #1a1a1a' : '1.5px solid #d0d0d0', padding: '4px 12px', fontSize: '11px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
      {d === 7 ? 'Last 7 days' : d === 14 ? 'Last 14 days' : d === 30 ? 'Last 30 days' : 'Last 90 days'}
    </button>
  );

  const InventoryRow = ({ item, badge }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', borderBottom: '0.5px solid #f5f5f2' }}>
      <div>
        <div style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '500' }}>{item.title}</div>
        {item.variant && <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>{item.variant}</div>}
      </div>
      {badge}
    </div>
  );

  return (
    <>
      <Head>
        <title>Los York Label — Operations</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <div style={S.wrap}>

        {/* Header */}
        <div style={S.header}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={S.logoText}>Los York</span>
            <span style={{ color: '#2a2d40', margin: '0 6px' }}>®</span>
            <span style={S.logoSub}>Label / Operations</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isLive && <span style={S.livePill}>● live</span>}
            <button onClick={() => fetchData(days)} disabled={loading} style={S.refreshBtn}>{loading ? '...' : '↻ Refresh'}</button>
          </div>
        </div>

        {/* Time bar */}
        <div style={{ ...S.timebar, flexWrap: 'wrap', gap: '7px' }}>
          <span style={S.timeLabel}>Showing:</span>
          {[7, 14, 30, 90].map(pillBtn)}
          <button onClick={() => { setShowCustom(!showCustom); }} style={{ background: isCustomActive ? '#1c1f2e' : 'none', color: isCustomActive ? '#fff' : '#999', border: isCustomActive ? '0.5px solid #1c1f2e' : '0.5px solid #ddd', padding: '4px 12px', fontSize: '11px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
            {isCustomActive ? `${customFrom} → ${customTo}` : 'Custom'}
          </button>
          {showCustom && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '4px' }}>
              <input type="date" value={customFrom} max={today} onChange={e => setCustomFrom(e.target.value)}
                style={{ fontSize: '12px', padding: '3px 8px', border: '0.5px solid #ddd', borderRadius: '4px', fontFamily: 'inherit', color: '#1a1a1a', background: '#fff', outline: 'none' }} />
              <span style={{ fontSize: '11px', color: '#bbb' }}>to</span>
              <input type="date" value={customTo} min={customFrom} max={today} onChange={e => setCustomTo(e.target.value)}
                style={{ fontSize: '12px', padding: '3px 8px', border: '0.5px solid #ddd', borderRadius: '4px', fontFamily: 'inherit', color: '#1a1a1a', background: '#fff', outline: 'none' }} />
              <button onClick={applyCustom} disabled={!customFrom || !customTo} style={{ background: '#1a1a1a', border: 'none', color: '#fff', padding: '4px 12px', fontSize: '11px', borderRadius: '20px', cursor: customFrom && customTo ? 'pointer' : 'default', fontFamily: 'inherit', opacity: customFrom && customTo ? 1 : 0.4 }}>
                Apply
              </button>
            </div>
          )}
        </div>

        {/* KPIs */}
        <div style={S.kpiGrid}>
          {[
            { label: 'Gross Revenue', value: s.gross_revenue != null ? fmt(s.gross_revenue) : '—', sub: '' },
            { label: 'Total Orders', value: s.total_orders ?? '—', sub: '' },
            { label: 'Avg Order Value', value: s.aov != null ? fmt(s.aov) : '—', sub: '' },
            { label: 'Units Sold', value: s.total_units ?? '—', sub: '' },
          ].map((k, i) => (
            <div key={i} style={{ ...S.kpiCard, borderRight: i < 3 ? '1.5px solid #e8e8e8' : 'none' }}>
              <div style={S.kpiLabel}>{k.label}</div>
              <div style={{ ...S.kpiVal, color: loading ? '#ccc' : '#1c1f2e' }}>{k.value}</div>
              {k.sub && <div style={S.kpiSub}>{k.sub}</div>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          {[['sales','Sales'],['inventory','Inventory'],['traffic','Traffic'],['ads','Ads']].map(([t,l]) => tabBtn(t,l))}
        </div>

        {/* Content */}
        <div style={S.content}>

          {/* SALES */}
          {tab === 'sales' && (
            <div>
              <div style={S.secLabel}>Product sales — last {days} days</div>
              <div style={{ ...S.tbl, border: '1.5px solid #e0e0e0', borderRadius: '0' }}>
                <div style={{ ...S.thead, gridTemplateColumns: '1fr 70px 90px' }}>
                  <span>Product</span><span style={{ textAlign: 'right' }}>Units</span><span style={{ textAlign: 'right' }}>Revenue</span>
                </div>
                {products.map((p, i) => (
                  <div key={i} style={{ ...S.trow, gridTemplateColumns: '1fr 70px 90px', borderBottom: i < products.length - 1 ? '0.5px solid #f5f5f2' : 'none' }}>
                    <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '500' }}>{p.title}</span>
                    <span style={{ textAlign: 'right', fontSize: '13px', color: '#aaa', fontWeight: '500' }}>{p.units}</span>
                    <span style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{fmt(p.revenue)}</span>
                  </div>
                ))}
                <div style={{ ...S.ttotal, gridTemplateColumns: '1fr 70px 90px' }}>
                  <span>Total</span>
                  <span style={{ textAlign: 'right' }}>{products.reduce((s, p) => s + p.units, 0)}</span>
                  <span style={{ textAlign: 'right' }}>{fmt(products.reduce((s, p) => s + p.revenue, 0))}</span>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#ccc', marginTop: '8px' }}>All discount codes excluded · WELCOME code orders included at discounted price</div>
            </div>
          )}

          {/* INVENTORY */}
          {tab === 'inventory' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Left column — low stock + out of stock */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Low stock */}
                <div>
                  <div style={{ ...S.secLabel, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
                    Low stock — 1 to 4 units
                    {lowStock.length > 0 && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 600, background: '#fef3c7', color: '#92400e', padding: '1px 7px', borderRadius: '10px' }}>{lowStock.length}</span>}
                  </div>
                  <div style={{ ...S.tbl, border: '1.5px solid #e0e0e0', borderRadius: '0' }}>
                    {lowStock.length === 0 ? (
                      <div style={{ padding: '20px 16px', fontSize: '13px', color: '#ccc', textAlign: 'center' }}>All good — nothing low</div>
                    ) : (
                      lowStock.map((item, i) => (
                        <InventoryRow key={i} item={item} badge={
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', whiteSpace: 'nowrap' }}>
                            {item.units} left
                          </span>
                        } />
                      ))
                    )}
                  </div>
                </div>

                {/* Out of stock */}
                <div>
                  <div style={{ ...S.secLabel, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d94f4f', display: 'inline-block' }} />
                    Out of stock
                    {outOfStock.length > 0 && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 600, background: '#fef0f0', color: '#991b1b', padding: '1px 7px', borderRadius: '10px' }}>{outOfStock.length}</span>}
                  </div>
                  <div style={{ ...S.tbl, border: '1.5px solid #e0e0e0', borderRadius: '0' }}>
                    {outOfStock.length === 0 ? (
                      <div style={{ padding: '20px 16px', fontSize: '13px', color: '#ccc', textAlign: 'center' }}>Nothing out of stock</div>
                    ) : (
                      outOfStock.map((item, i) => (
                        <InventoryRow key={i} item={item} badge={
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: '#fef0f0', color: '#d94f4f', whiteSpace: 'nowrap' }}>
                            Out of stock
                          </span>
                        } />
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right column — most moved */}
              <div>
                <div style={{ ...S.secLabel, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34c759', display: 'inline-block' }} />
                  Most moved — last {days} days
                </div>
                <div style={{ ...S.tbl, border: '1.5px solid #e0e0e0', borderRadius: '0' }}>
                  {mostMoved.length === 0 ? (
                    <div style={{ padding: '20px 16px', fontSize: '13px', color: '#ccc', textAlign: 'center' }}>No sales data for this period</div>
                  ) : mostMoved.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px', borderBottom: i < mostMoved.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '500' }}>{item.title}</div>
                        {item.variant && <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px' }}>{item.variant}</div>}
                        <div style={{ fontSize: '10px', color: '#ccc', marginTop: '2px' }}>{item.remaining} remaining</div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '3px', background: '#e8f5ee', color: '#1e8449', whiteSpace: 'nowrap' }}>
                        {item.units_sold} sold
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TRAFFIC */}
          {tab === 'traffic' && (
            <div style={{ maxWidth: '480px' }}>
              <div style={S.secLabel}>Order sources — last {days} days</div>
              <div style={{ ...S.tbl, border: '1.5px solid #e0e0e0', borderRadius: '0' }}>
                {referrers.map((r, i) => {
                  const ps = getPlatformStyle(r.platform || r.source);
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < referrers.length - 1 ? '0.5px solid #f5f5f2' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: ps.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: ps.color, fontWeight: 600, flexShrink: 0 }}>
                          {ps.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '500', fontWeight: 500 }}>{r.source}</div>
                          <div style={{ fontSize: '11px', color: '#bbb', marginTop: '1px' }}>{fmt(r.revenue)} revenue</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1c1f2e' }}>{r.orders}</div>
                        <div style={{ fontSize: '10px', color: '#bbb' }}>orders</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ADS */}
          {tab === 'ads' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={S.secLabel}>Reaktion — Ad Metrics</div>
                  {reaktion?.updated_at && <div style={{ fontSize: '11px', color: '#bbb', marginTop: '-6px' }}>Updated {timeAgo(reaktion.updated_at)}{reaktion.name ? ` by ${reaktion.name}` : ''}</div>}
                </div>
                <button onClick={() => { setRDraft(reaktion || {}); setEditingR(!editingR); }} style={{ background: 'none', border: '0.5px solid #ddd', color: '#888', padding: '5px 12px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {editingR ? 'Cancel' : 'Update'}
                </button>
              </div>

              {editingR ? (
                <div style={{ background: '#fff', border: '0.5px solid #e8e8e4', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', marginBottom: '16px' }}>Enter this week's Reaktion numbers</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '14px' }}>
                    {[['spend','Ad Spend ($)'],['roas','ROAS'],['impressions','Impressions'],['clicks','Clicks'],['ctr','CTR (%)'],['cpa','CPA ($)']].map(([key, label]) => (
                      <div key={key}>
                        <label style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', display: 'block', marginBottom: '5px' }}>{label}</label>
                        <input type="number" value={rDraft[key] || ''} onChange={e => setRDraft(d => ({ ...d, [key]: e.target.value }))}
                          style={{ width: '100%', fontSize: '13px', fontFamily: 'inherit', border: '0.5px solid #ddd', borderRadius: '4px', padding: '7px 10px', background: '#fafaf8', color: '#1a1a1a', outline: 'none' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#aaa', display: 'block', marginBottom: '5px' }}>Your Name</label>
                    <input type="text" placeholder="e.g. Mike" value={rDraft.name || ''} onChange={e => setRDraft(d => ({ ...d, name: e.target.value }))}
                      style={{ fontSize: '13px', fontFamily: 'inherit', border: '0.5px solid #ddd', borderRadius: '4px', padding: '7px 10px', width: '200px', background: '#fafaf8', color: '#1a1a1a', outline: 'none' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { setReaktion({ ...rDraft, updated_at: new Date().toISOString() }); setEditingR(false); }}
                      style={{ background: '#1a1a1a', border: 'none', color: '#fff', padding: '7px 18px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', borderRadius: '4px', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Save</button>
                    <button onClick={() => setEditingR(false)}
                      style={{ background: 'none', border: '0.5px solid #ddd', color: '#888', padding: '7px 18px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cancel</button>
                  </div>
                </div>
              ) : reaktion ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: '#e8e8e4', border: '0.5px solid #e8e8e4', borderRadius: '8px', overflow: 'hidden' }}>
                  {[
                    { label: 'Ad Spend', value: `$${Number(reaktion.spend).toLocaleString()}` },
                    { label: 'ROAS', value: reaktion.roas },
                    { label: 'Impressions', value: Number(reaktion.impressions).toLocaleString() },
                    { label: 'Clicks', value: Number(reaktion.clicks).toLocaleString() },
                    { label: 'CTR', value: `${reaktion.ctr}%` },
                    { label: 'CPA', value: `$${reaktion.cpa}` },
                  ].map((k, i) => (
                    <div key={i} style={{ background: '#fff', padding: '18px 20px' }}>
                      <div style={S.kpiLabel}>{k.label}</div>
                      <div style={{ fontSize: '22px', fontWeight: 600, color: '#1c1f2e' }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#fff', border: '0.5px solid #e8e8e4', borderRadius: '8px', padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#bbb', marginBottom: '6px' }}>No ad data yet</div>
                  <div style={{ fontSize: '11px', color: '#ddd' }}>Hit Update to add this week's Reaktion numbers</div>
                </div>
              )}
              <div style={{ marginTop: '14px', padding: '10px 14px', background: '#fff', border: '0.5px solid #e8e8e4', borderRadius: '6px', fontSize: '11px', color: '#bbb', lineHeight: 1.6 }}>
                Reaktion has no public API — enter manually from <span style={{ color: '#888' }}>advertiser.reaktion.com</span> (~2 min weekly)
              </div>
            </div>
          )}

        </div>

        <div style={{ borderTop: '0.5px solid #ebebeb', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', background: '#fff' }}>
          <span style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#bbb', fontWeight: '600' }}>Los York Label · Internal Use Only</span>
          <span style={{ fontSize: '10px', color: '#ccc' }}>losyorklabel.com</span>
        </div>

      </div>
    </>
  );
}
