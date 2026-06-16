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
  gifting: {
    client: {
      total_cost: 420,
      products: [
        { title: 'LOS YORK Global Nomads hat', units: 6 },
        { title: 'The LOS YORK Global Nomads 25 Tote', units: 4 },
        { title: 'LOS YORK Pixels Socks', units: 3 },
        { title: 'Sauna Hat', units: 2 },
        { title: 'LOS YORK Camera Club Tee', units: 2 },
        { title: 'Long Sleeve T', units: 1 },
      ],
      orders: [
        { name: 'Justin Medley', date: 'Jun 10', items: 'Pixels Socks ×2, GN Hat ×2, GN 25 Tote ×2, Courage' },
        { name: 'Nikki Peddie', date: 'Jun 9', items: 'GN Hat, Pixels Tote, Long Sleeve T, Sauna Hat' },
        { name: 'shawn kelley', date: 'Jun 8', items: 'Pixels Socks, GN Hat, Camera Club Tee' },
        { name: 'Avni Patel', date: 'Jun 6', items: 'GN 25 Tote' },
        { name: 'Molly Tanen', date: 'Jun 5', items: 'GN Hat, Pixels Socks ×2, Camera Club Tee, Sauna Hat' },
        { name: 'earl mcdaniel', date: 'Jun 5', items: 'Pixels Tote, Long Sleeve T' },
        { name: 'Lin Wilde', date: 'Jun 5', items: 'GN Hat, Pixels Socks' },
        { name: 'Travis Ragsdale', date: 'Jun 5', items: 'Pixels Tote, GN Hat, Sauna Hat' },
      ]
    },
    freelance: {
      total_cost: 142,
      products: [
        { title: 'LOS YORK Global Nomads hat', units: 2 },
        { title: 'Long Sleeve T', units: 2 },
        { title: 'LOS YORK Pixels Tote', units: 1 },
        { title: 'Sauna Hat', units: 1 },
      ],
      orders: [
        { name: 'Afonso Calixto', date: 'Apr 16', items: 'GN Hat, Pixels Socks' },
        { name: 'Sally Kallet', date: 'Apr 17', items: 'Long Sleeve T, Camera Club Tee' },
        { name: 'Tin Tran', date: 'Apr 25', items: 'Pixels Tote, Sauna Hat' },
      ]
    }
  },
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
  timeLabel: { fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#666', marginRight: '4px', fontWeight: '600' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0', background: '#fff', borderBottom: '2px solid #e0e0e0' },
  kpiCard: { padding: '26px 28px 22px' },
  kpiLabel: { fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', marginBottom: '6px' },
  kpiVal: { fontSize: '26px', fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: '#1c1f2e' },
  kpiSub: { fontSize: '10px', color: '#888', marginTop: '4px' },
  tabs: { background: '#fff', display: 'flex', gap: '0', padding: '0 28px', borderBottom: '2px solid #e0e0e0' },
  content: { padding: '28px 28px 48px' },
  secLabel: { fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#555', marginBottom: '12px', fontWeight: '600' },
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
  const [clientOpen, setClientOpen] = useState(false);
  const [freelanceOpen, setFreelanceOpen] = useState(false);
  const [compareA, setCompareA] = useState({ from: '', to: '' });
  const [compareB, setCompareB] = useState({ from: '', to: '' });
  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  async function runCompare() {
    if (!compareA.from || !compareA.to || !compareB.from || !compareB.to) return;
    setCompareLoading(true);
    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/shopify?from=${compareA.from}&to=${compareA.to}`),
        fetch(`/api/shopify?from=${compareB.from}&to=${compareB.to}`)
      ]);
      const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);
      if (dataA.ok && dataB.ok) setCompareData({ a: dataA, b: dataB });
    } catch (e) { console.warn('Compare failed'); }
    setCompareLoading(false);
  }

  function pctChange(a, b) {
    if (!b || b === 0) return a > 0 ? '↑ New' : '—';
    const pct = Math.round(((a - b) / b) * 100);
    if (pct > 0) return `↑ ${pct}%`;
    if (pct < 0) return `↓ ${Math.abs(pct)}%`;
    return '—';
  }

  function changeColor(a, b) {
    if (!b || b === 0) return a > 0 ? '#1e8449' : '#aaa';
    return a >= b ? '#1e8449' : '#c0392b';
  }

  function changeBg(a, b) {
    if (!b || b === 0) return a > 0 ? '#eef7f1' : '#f0f0f0';
    return a >= b ? '#eef7f1' : '#fde8e8';
  }
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
  const giftingClient = data?.gifting?.client || { products: [], orders: [], total_cost: 0 };
  const giftingFreelance = data?.gifting?.freelance || { products: [], orders: [], total_cost: 0 };
  const totalGiftedUnits = [...(giftingClient.products || []), ...(giftingFreelance.products || [])].reduce((s, p) => s + p.units, 0);

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
        {item.variant && <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>{item.variant}</div>}
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
            <span style={{ ...S.logoText, fontSize: '13px', letterSpacing: '0.25em' }}>Los York Label</span>
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
              <span style={{ fontSize: '11px', color: '#777' }}>to</span>
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
            { label: 'Gross Revenue', value: s.gross_revenue != null ? fmt(s.gross_revenue) : '—' },
            { label: 'Total Orders', value: s.total_orders ?? '—' },
            { label: 'Avg Order Value', value: s.aov != null ? fmt(s.aov) : '—' },
            { label: 'Units Sold', value: s.total_units ?? '—' },
            { label: 'Units Gifted', value: s.units_gifted ?? '—', gifted: true },
          ].map((k, i) => (
            <div key={i} style={{ ...S.kpiCard, borderRight: i < 4 ? '1.5px solid #e8e8e8' : 'none', background: k.gifted ? '#fafafa' : '#fff' }}>
              <div style={S.kpiLabel}>{k.label}</div>
              <div style={{ ...S.kpiVal, color: loading ? '#ccc' : '#1a1a1a' }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          {[['sales','Sales'],['inventory','Inventory'],['traffic','Traffic'],['gifting','Gifting'],['compare','Compare'],['ads','Ads']].map(([t,l]) => tabBtn(t,l))}
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
                    <span style={{ textAlign: 'right', fontSize: '13px', color: '#666', fontWeight: '500' }}>{p.units}</span>
                    <span style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{fmt(p.revenue)}</span>
                  </div>
                ))}
                <div style={{ ...S.ttotal, gridTemplateColumns: '1fr 70px 90px' }}>
                  <span>Total</span>
                  <span style={{ textAlign: 'right' }}>{products.reduce((s, p) => s + p.units, 0)}</span>
                  <span style={{ textAlign: 'right' }}>{fmt(products.reduce((s, p) => s + p.revenue, 0))}</span>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>All discount codes excluded · WELCOME code orders included at discounted price</div>
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
                      <div style={{ padding: '20px 16px', fontSize: '13px', color: '#888', textAlign: 'center' }}>All good — nothing low</div>
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
                      <div style={{ padding: '20px 16px', fontSize: '13px', color: '#888', textAlign: 'center' }}>Nothing out of stock</div>
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
                    <div style={{ padding: '20px 16px', fontSize: '13px', color: '#888', textAlign: 'center' }}>No sales data for this period</div>
                  ) : mostMoved.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px', borderBottom: i < mostMoved.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: '500' }}>{item.title}</div>
                        {item.variant && <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>{item.variant}</div>}
                        <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>{item.remaining} remaining</div>
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
            <div>
              <div style={S.secLabel}>Order sources</div>
              <div style={{ background: '#fff', border: '1.5px solid #e0e0e0', overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 100px 100px', padding: '10px 18px', borderBottom: '1.5px solid #e8e8e8', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#777', fontWeight: 600, background: '#fafafa' }}>
                  <span>Source</span>
                  <span style={{ textAlign: 'right' }}>Orders</span>
                  <span style={{ textAlign: 'right' }}>Share</span>
                  <span style={{ textAlign: 'right' }}>Revenue</span>
                  <span style={{ textAlign: 'right' }}>Per order</span>
                </div>
                {(() => {
                  const totalOrders = referrers.reduce((s, r) => s + r.orders, 0);
                  const totalRevenue = referrers.reduce((s, r) => s + r.revenue, 0);
                  const barColors = { instagram: '#e1306c', pinterest: '#e60023', tiktok: '#010101', facebook: '#1877f2', twitter: '#1da1f2', google: '#4285f4', search: '#4285f4', direct: '#1a1a1a', referral: '#7c3aed' };
                  return referrers.map((r, i) => {
                    const ps = getPlatformStyle(r.platform || r.source);
                    const sharePct = totalOrders > 0 ? Math.round((r.orders / totalOrders) * 100) : 0;
                    const perOrder = r.orders > 0 ? Math.round(r.revenue / r.orders * 100) / 100 : 0;
                    const barColor = barColors[r.platform?.toLowerCase()] || barColors[r.source?.toLowerCase()] || '#888';
                    return (
                      <div key={i} style={{ padding: '14px 18px', borderBottom: i < referrers.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 100px 100px', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: ps.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: ps.color, fontWeight: 700, flexShrink: 0 }}>{ps.icon}</div>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{r.source}</span>
                          </div>
                          <span style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{r.orders}</span>
                          <span style={{ textAlign: 'right', fontSize: '13px', color: '#666', fontWeight: 500 }}>{sharePct}%</span>
                          <span style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{fmt(r.revenue)}</span>
                          <span style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{fmt(perOrder)}</span>
                        </div>
                        <div style={{ height: '3px', background: '#f0f0f0', borderRadius: '2px' }}>
                          <div style={{ height: '3px', width: `${sharePct}%`, background: barColor, borderRadius: '2px', transition: 'width 0.4s ease' }} />
                        </div>
                      </div>
                    );
                  });
                })()}
                {/* Total row */}
                {(() => {
                  const totalOrders = referrers.reduce((s, r) => s + r.orders, 0);
                  const totalRevenue = referrers.reduce((s, r) => s + r.revenue, 0);
                  const blendedPerOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders * 100) / 100 : 0;
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 100px 100px', padding: '12px 18px', borderTop: '2px solid #e0e0e0', background: '#fafafa', fontSize: '12px', fontWeight: 800, color: '#1a1a1a' }}>
                      <span>Total</span>
                      <span style={{ textAlign: 'right' }}>{totalOrders}</span>
                      <span style={{ textAlign: 'right' }}></span>
                      <span style={{ textAlign: 'right' }}>{fmt(totalRevenue)}</span>
                      <span style={{ textAlign: 'right' }}>{fmt(blendedPerOrder)}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ADS */}
          {tab === 'ads' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <div style={S.secLabel}>Reaktion — Ad Metrics</div>
                  {reaktion?.updated_at && <div style={{ fontSize: '11px', color: '#777', marginTop: '-6px' }}>Updated {timeAgo(reaktion.updated_at)}{reaktion.name ? ` by ${reaktion.name}` : ''}</div>}
                </div>
                <button onClick={() => { setRDraft(reaktion || {}); setEditingR(!editingR); }} style={{ background: 'none', border: '0.5px solid #ddd', color: '#888', padding: '5px 12px', fontSize: '11px', cursor: 'pointer', borderRadius: '4px', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {editingR ? 'Cancel' : 'Update'}
                </button>
              </div>

              {editingR ? (
                <div style={{ background: '#fff', border: '0.5px solid #e8e8e4', borderRadius: '8px', padding: '20px' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', marginBottom: '16px' }}>Enter this week's Reaktion numbers</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px', marginBottom: '14px' }}>
                    {[['spend','Ad Spend ($)'],['roas','ROAS'],['impressions','Impressions'],['clicks','Clicks'],['ctr','CTR (%)'],['cpa','CPA ($)']].map(([key, label]) => (
                      <div key={key}>
                        <label style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '5px' }}>{label}</label>
                        <input type="number" value={rDraft[key] || ''} onChange={e => setRDraft(d => ({ ...d, [key]: e.target.value }))}
                          style={{ width: '100%', fontSize: '13px', fontFamily: 'inherit', border: '0.5px solid #ddd', borderRadius: '4px', padding: '7px 10px', background: '#fafaf8', color: '#1a1a1a', outline: 'none' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', display: 'block', marginBottom: '5px' }}>Your Name</label>
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
                  <div style={{ fontSize: '13px', color: '#777', marginBottom: '6px' }}>No ad data yet</div>
                  <div style={{ fontSize: '11px', color: '#ddd' }}>Hit Update to add this week's Reaktion numbers</div>
                </div>
              )}
              <div style={{ marginTop: '14px', padding: '10px 14px', background: '#fff', border: '0.5px solid #e8e8e4', borderRadius: '6px', fontSize: '11px', color: '#777', lineHeight: 1.6 }}>
                Reaktion has no public API — enter manually from <span style={{ color: '#888' }}>advertiser.reaktion.com</span> (~2 min weekly)
              </div>
            </div>
          )}

          {/* GIFTING */}
          {tab === 'gifting' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Client Gifting */}
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#555', marginBottom: '12px', fontWeight: 600 }}>Client Gifting</div>
                <div style={{ background: '#fff', border: '1.5px solid #e0e0e0', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', padding: '10px 16px', borderBottom: '1.5px solid #e8e8e8', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#777', fontWeight: 600, background: '#fafafa' }}>
                    <span>Product</span><span style={{ textAlign: 'right' }}>Units</span>
                  </div>
                  {giftingClient.products.map((p, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px', padding: '13px 16px', borderBottom: i < giftingClient.products.length - 1 ? '1px solid #f0f0f0' : 'none', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 500 }}>{p.title}</span>
                      <span style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{p.units}</span>
                    </div>
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', padding: '12px 16px', borderTop: '2px solid #e0e0e0', background: '#fafafa', fontWeight: 800, fontSize: '12px', color: '#1a1a1a' }}>
                    <span>Total</span>
                    <span style={{ textAlign: 'right' }}>{giftingClient.products.reduce((s, p) => s + p.units, 0)}</span>
                  </div>
                </div>
                <button onClick={() => setClientOpen(!clientOpen)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fafafa', border: 'none', borderTop: '1.5px solid #e0e0e0', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', marginTop: '12px' }}>
                  <span>{clientOpen ? 'Hide Orders' : `View Orders (${giftingClient.orders.length})`}</span>
                  <span style={{ fontSize: '10px', transform: clientOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                </button>
                {clientOpen && (
                  <div style={{ background: '#fff', border: '1.5px solid #e0e0e0', borderTop: 'none', overflow: 'hidden' }}>
                    {giftingClient.orders.map((o, i) => (
                      <div key={i} style={{ padding: '12px 16px', borderBottom: i < giftingClient.orders.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{o.name}</div>
                        <div style={{ fontSize: '11px', color: '#777', marginTop: '3px', lineHeight: 1.5 }}>{o.items}</div>
                        <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>{o.date}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Freelance */}
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#555', marginBottom: '12px', fontWeight: 600 }}>Freelance</div>
                <div style={{ background: '#fff', border: '1.5px solid #e0e0e0', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', padding: '10px 16px', borderBottom: '1.5px solid #e8e8e8', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#777', fontWeight: 600, background: '#fafafa' }}>
                    <span>Product</span><span style={{ textAlign: 'right' }}>Units</span>
                  </div>
                  {giftingFreelance.products.map((p, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px', padding: '13px 16px', borderBottom: i < giftingFreelance.products.length - 1 ? '1px solid #f0f0f0' : 'none', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 500 }}>{p.title}</span>
                      <span style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{p.units}</span>
                    </div>
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', padding: '12px 16px', borderTop: '2px solid #e0e0e0', background: '#fafafa', fontWeight: 800, fontSize: '12px', color: '#1a1a1a' }}>
                    <span>Total</span>
                    <span style={{ textAlign: 'right' }}>{giftingFreelance.products.reduce((s, p) => s + p.units, 0)}</span>
                  </div>
                </div>
                <button onClick={() => setFreelanceOpen(!freelanceOpen)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fafafa', border: 'none', borderTop: '1.5px solid #e0e0e0', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', marginTop: '12px' }}>
                  <span>{freelanceOpen ? 'Hide Orders' : `View Orders (${giftingFreelance.orders.length})`}</span>
                  <span style={{ fontSize: '10px', transform: freelanceOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                </button>
                {freelanceOpen && (
                  <div style={{ background: '#fff', border: '1.5px solid #e0e0e0', borderTop: 'none', overflow: 'hidden' }}>
                    {giftingFreelance.orders.map((o, i) => (
                      <div key={i} style={{ padding: '12px 16px', borderBottom: i < giftingFreelance.orders.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{o.name}</div>
                        <div style={{ fontSize: '11px', color: '#777', marginTop: '3px', lineHeight: 1.5 }}>{o.items}</div>
                        <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>{o.date}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* COMPARE */}
          {tab === 'compare' && (
            <div>
              {/* Date range selector */}
              <div style={{ background: '#fff', border: '1.5px solid #e0e0e0', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>Period A</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0f0f0', borderRadius: '3px', padding: '6px 10px' }}>
                    <input type="date" value={compareA.from} onChange={e => setCompareA(p => ({ ...p, from: e.target.value }))}
                      style={{ fontSize: '12px', fontFamily: 'inherit', border: 'none', background: 'transparent', color: '#1a1a1a', outline: 'none', width: '120px' }} />
                    <span style={{ fontSize: '11px', color: '#aaa' }}>→</span>
                    <input type="date" value={compareA.to} onChange={e => setCompareA(p => ({ ...p, to: e.target.value }))}
                      style={{ fontSize: '12px', fontFamily: 'inherit', border: 'none', background: 'transparent', color: '#1a1a1a', outline: 'none', width: '120px' }} />
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#bbb', letterSpacing: '0.1em' }}>VS</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', fontWeight: 600, whiteSpace: 'nowrap' }}>Period B</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0f0f0', borderRadius: '3px', padding: '6px 10px' }}>
                    <input type="date" value={compareB.from} onChange={e => setCompareB(p => ({ ...p, from: e.target.value }))}
                      style={{ fontSize: '12px', fontFamily: 'inherit', border: 'none', background: 'transparent', color: '#1a1a1a', outline: 'none', width: '120px' }} />
                    <span style={{ fontSize: '11px', color: '#aaa' }}>→</span>
                    <input type="date" value={compareB.to} onChange={e => setCompareB(p => ({ ...p, to: e.target.value }))}
                      style={{ fontSize: '12px', fontFamily: 'inherit', border: 'none', background: 'transparent', color: '#1a1a1a', outline: 'none', width: '120px' }} />
                  </div>
                </div>
                <button onClick={runCompare} disabled={compareLoading || !compareA.from || !compareA.to || !compareB.from || !compareB.to}
                  style={{ background: '#1a1a1a', color: '#fff', border: 'none', padding: '7px 20px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '3px', fontFamily: 'inherit', marginLeft: 'auto', opacity: (!compareA.from || !compareA.to || !compareB.from || !compareB.to) ? 0.4 : 1 }}>
                  {compareLoading ? '...' : 'Compare'}
                </button>
              </div>

              {!compareData ? (
                <div style={{ background: '#fff', border: '1.5px solid #e0e0e0', padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#777', marginBottom: '6px' }}>Enter two date ranges and hit Compare</div>
                  <div style={{ fontSize: '11px', color: '#aaa' }}>Results will appear side by side</div>
                </div>
              ) : (
                <div>
                  {/* KPI comparison */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: '#e0e0e0', border: '1.5px solid #e0e0e0', marginBottom: '20px' }}>
                    {[
                      { label: 'Gross Revenue', a: compareData.a.summary.gross_revenue, b: compareData.b.summary.gross_revenue, fmt: true, giftLabel: 'Gifting Cost', ga: compareData.a.gifting?.total_cost || 0, gb: compareData.b.gifting?.total_cost || 0, gfmt: true },
                      { label: 'Total Orders', a: compareData.a.summary.total_orders, b: compareData.b.summary.total_orders, giftLabel: 'Units Gifted', ga: compareData.a.gifting?.total_units || 0, gb: compareData.b.gifting?.total_units || 0 },
                      { label: 'Avg Order Value', a: compareData.a.summary.aov, b: compareData.b.summary.aov, fmt: true },
                      { label: 'Units Sold', a: compareData.a.summary.total_units, b: compareData.b.summary.total_units },
                    ].map((k, i) => (
                      <div key={i} style={{ background: '#fff', padding: '18px 20px' }}>
                        <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', marginBottom: '10px', fontWeight: 600 }}>{k.label}</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1a1a1a' }}>{k.fmt ? fmt(k.a) : k.a}</span>
                          <span style={{ fontSize: '18px', fontWeight: 600, color: '#aaa', marginBottom: '2px' }}>{k.fmt ? fmt(k.b) : k.b}</span>
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', marginBottom: '3px', background: changeBg(k.a, k.b), color: changeColor(k.a, k.b) }}>
                            {pctChange(k.a, k.b)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: k.giftLabel ? '10px' : 0 }}>
                          <span style={{ fontSize: '10px', color: '#555', fontWeight: 700 }}>A</span>
                          <span style={{ fontSize: '10px', color: '#aaa' }}>vs B</span>
                        </div>
                        {k.giftLabel && (
                          <>
                            <div style={{ height: '1px', background: '#f0f0f0', margin: '8px 0' }} />
                            <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#999', marginBottom: '6px', fontWeight: 600 }}>{k.giftLabel}</div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                              <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: '#1a1a1a' }}>{k.gfmt ? fmt(k.ga) : k.ga}</span>
                              <span style={{ fontSize: '15px', fontWeight: 600, color: '#aaa', marginBottom: '1px' }}>{k.gfmt ? fmt(k.gb) : k.gb}</span>
                              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 5px', borderRadius: '3px', marginBottom: '2px', background: changeBg(k.ga, k.gb), color: changeColor(k.ga, k.gb) }}>
                                {pctChange(k.ga, k.gb)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Product comparison table */}
                  <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', marginBottom: '10px', fontWeight: 600 }}>Product Sales — Side by Side</div>
                  <div style={{ background: '#fff', border: '1.5px solid #e0e0e0', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px', padding: '10px 16px', borderBottom: '1.5px solid #e8e8e8', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#777', fontWeight: 600, background: '#fafafa' }}>
                      <span>Product</span>
                      <span style={{ textAlign: 'right' }}>Period A</span>
                      <span style={{ textAlign: 'right' }}>Period B</span>
                      <span style={{ textAlign: 'right' }}>Change</span>
                    </div>
                    {(() => {
                      const allTitles = [...new Set([
                        ...compareData.a.products.map(p => p.title),
                        ...compareData.b.products.map(p => p.title)
                      ])];
                      const rows = allTitles.map(title => {
                        const pa = compareData.a.products.find(p => p.title === title);
                        const pb = compareData.b.products.find(p => p.title === title);
                        return { title, a: pa?.revenue || 0, b: pb?.revenue || 0 };
                      }).sort((x, y) => y.a - x.a);
                      const totalA = rows.reduce((s, r) => s + r.a, 0);
                      const totalB = rows.reduce((s, r) => s + r.b, 0);
                      return (
                        <>
                          {rows.map((r, i) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 500 }}>{r.title}</span>
                              <span style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{r.a > 0 ? fmt(r.a) : '—'}</span>
                              <span style={{ textAlign: 'right', fontSize: '13px', color: '#aaa' }}>{r.b > 0 ? fmt(r.b) : '—'}</span>
                              <span style={{ textAlign: 'right', fontSize: '11px', fontWeight: 700, color: changeColor(r.a, r.b) }}>{pctChange(r.a, r.b)}</span>
                            </div>
                          ))}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px', padding: '12px 16px', borderTop: '2px solid #e0e0e0', background: '#fafafa', fontWeight: 800, fontSize: '12px', color: '#1a1a1a' }}>
                            <span>Total</span>
                            <span style={{ textAlign: 'right' }}>{fmt(totalA)}</span>
                            <span style={{ textAlign: 'right', color: '#aaa', fontWeight: 600 }}>{fmt(totalB)}</span>
                            <span style={{ textAlign: 'right', fontSize: '11px', fontWeight: 700, color: changeColor(totalA, totalB) }}>{pctChange(totalA, totalB)}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        <div style={{ borderTop: '0.5px solid #ebebeb', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', background: '#fff' }}>
          <span style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#777', fontWeight: '600' }}>Los York Label · Internal Use Only</span>
          <span style={{ fontSize: '10px', color: '#888' }}>losyorklabel.com</span>
        </div>

      </div>
    </>
  );
}
