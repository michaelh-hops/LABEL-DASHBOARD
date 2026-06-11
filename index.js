import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

// Seed data shown on load / if API fails
const SEED = {
  7: {
    summary: { total_orders: 22, gross_revenue: 3732, total_units: 14 },
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
      { source: 'Direct', orders: 14, revenue: 60 },
      { source: 'Search', orders: 5, revenue: 65 },
      { source: 'Social', orders: 3, revenue: 200 },
    ],
    inventory: {
      low_stock: [
        { title: 'LY hat', variant: '', units: 3 },
        { title: 'LOS YORK CITIZEN HEAVYWEIGHT HOODIE', variant: 'S', units: 2 },
        { title: 'Citizens Circle: Radu Pose', variant: 'S', units: 3 },
        { title: 'Ball Park Stickers', variant: '', units: 4 },
        { title: 'LOS YORK Pixels Hoodie', variant: 'S', units: 5 },
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
  }
};

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

export default function Dashboard() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(SEED[7]);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [tab, setTab] = useState('sales');
  const [reaktion, setReaktion] = useState(null);
  const [editingR, setEditingR] = useState(false);
  const [rDraft, setRDraft] = useState({});

  const fetchData = useCallback(async (d) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shopify?days=${d}`);
      const json = await res.json();
      if (json.ok) {
        setData(json);
        setIsLive(true);
      }
    } catch (e) {
      console.warn('Using seed data:', e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(days);
    const interval = setInterval(() => fetchData(days), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [days, fetchData]);

  function handleSetDays(d) {
    setDays(d);
    fetchData(d);
  }

  function saveReaktion() {
    setReaktion({ ...rDraft, updated_at: new Date().toISOString() });
    setEditingR(false);
  }

  const s = data?.summary || {};
  const products = data?.products || [];
  const referrers = data?.referrers || [];
  const lowStock = data?.inventory?.low_stock || [];
  const mostMoved = data?.inventory?.most_moved || [];
  const totalReferralOrders = referrers.reduce((sum, r) => sum + r.orders, 0);

  const WINDOWS = [7, 14, 30, 90];

  return (
    <>
      <Head>
        <title>Los York Label — Operations</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ fontFamily: "'Inter', sans-serif", background: '#0a0a0a', color: '#f0f0f0', minHeight: '100vh' }}>

        {/* Header */}
        <div style={{ borderBottom: '1px solid #1c1c1c', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#0a0a0a', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 800, fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Los York</span>
            <span style={{ color: '#333', fontSize: '12px' }}>®</span>
            <span style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444' }}>Label / Operations</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isLive && (
              <span style={{ fontSize: '10px', background: '#0a2a0a', color: '#44cc66', border: '1px solid #1a4a1a', padding: '3px 8px', borderRadius: '20px', letterSpacing: '0.08em' }}>
                ● LIVE
              </span>
            )}
            <span style={{ fontSize: '11px', color: '#444' }}>
              {loading ? 'Refreshing...' : `Updated ${timeAgo(data?.updated_at)} · auto-refresh 10m`}
            </span>
            <button onClick={() => fetchData(days)} disabled={loading} style={{ background: 'none', border: '1px solid #2a2a2a', color: '#666', padding: '5px 12px', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '4px', fontFamily: 'inherit' }}>
              {loading ? '...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Time window selector */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #1c1c1c', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444', marginRight: '4px' }}>Showing:</span>
          {WINDOWS.map(d => (
            <button key={d} onClick={() => handleSetDays(d)} style={{ background: days === d ? '#fff' : 'none', color: days === d ? '#000' : '#555', border: days === d ? '1px solid #fff' : '1px solid #2a2a2a', padding: '4px 12px', fontSize: '11px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
              {d === 7 ? 'Last 7 days' : d === 14 ? 'Last 14 days' : d === 30 ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', margin: '16px 24px 0', background: '#1c1c1c', border: '1px solid #1c1c1c', borderRadius: '6px', overflow: 'hidden' }}>
          {[
            { label: 'Gross Revenue', value: s.gross_revenue != null ? fmt(s.gross_revenue) : '—', sub: 'excl. discount codes (except WELCOME)' },
            { label: 'Total Orders', value: s.total_orders ?? '—', sub: 'excl. discount codes (except WELCOME)' },
            { label: 'Units Sold', value: s.total_units ?? '—', sub: `last ${days} days` },
          ].map((k, i) => (
            <div key={i} style={{ background: '#0f0f0f', padding: '18px 22px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', marginBottom: '7px' }}>{k.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, color: loading ? '#444' : '#fff' }}>{k.value}</div>
              <div style={{ fontSize: '10px', color: '#333', marginTop: '5px' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', margin: '18px 24px 0', borderBottom: '1px solid #1c1c1c' }}>
          {['sales', 'inventory', 'traffic', 'ads'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #fff' : '2px solid transparent', color: tab === t ? '#fff' : '#444', padding: '8px 16px', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: '-1px', fontFamily: 'inherit', transition: 'color .15s' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: '20px 24px 48px' }}>

          {/* SALES */}
          {tab === 'sales' && (
            <div>
              <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444', marginBottom: '12px' }}>Product Sales — Last {days} days</div>
              <div style={{ background: '#0f0f0f', border: '1px solid #1c1c1c', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', padding: '10px 18px', borderBottom: '1px solid #1c1c1c', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444' }}>
                  <span>Product</span><span style={{ textAlign: 'right' }}>Units</span><span style={{ textAlign: 'right' }}>Revenue</span>
                </div>
                {products.map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', padding: '12px 18px', borderBottom: i < products.length - 1 ? '1px solid #141414' : 'none', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#ddd' }}>{p.title}</span>
                    <span style={{ textAlign: 'right', fontSize: '13px', color: '#666' }}>{p.units}</span>
                    <span style={{ textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#fff' }}>{fmt(p.revenue)}</span>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', padding: '12px 18px', borderTop: '1px solid #2a2a2a', background: '#141414' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#777' }}>Total</span>
                  <span style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#fff' }}>{products.reduce((s, p) => s + p.units, 0)}</span>
                  <span style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#fff' }}>{fmt(products.reduce((s, p) => s + p.revenue, 0))}</span>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#333', marginTop: '8px' }}>
                All discount codes excluded · WELCOME code orders included at discounted price
              </div>
            </div>
          )}

          {/* INVENTORY */}
          {tab === 'inventory' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff4444', display: 'inline-block' }} />
                  Low Stock — Under 5 Units
                </div>
                <div style={{ background: '#0f0f0f', border: '1px solid #1c1c1c', borderRadius: '6px', overflow: 'hidden' }}>
                  {lowStock.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#333', fontSize: '13px' }}>All items well stocked</div>
                  ) : lowStock.map((item, i) => (
                    <div key={i} style={{ padding: '12px 18px', borderBottom: i < lowStock.length - 1 ? '1px solid #141414' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: '#ddd' }}>{item.title}</div>
                        {item.variant && <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>{item.variant}</div>}
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: item.units <= 2 ? '#ff4444' : '#ff9944', background: item.units <= 2 ? '#1a0000' : '#1a0d00', padding: '2px 8px', borderRadius: '4px' }}>
                        {item.units}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#44cc66', display: 'inline-block' }} />
                  Most Moved — Last {days} Days
                </div>
                <div style={{ background: '#0f0f0f', border: '1px solid #1c1c1c', borderRadius: '6px', overflow: 'hidden' }}>
                  {mostMoved.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#333', fontSize: '13px' }}>No sales data for this period</div>
                  ) : mostMoved.map((item, i) => (
                    <div key={i} style={{ padding: '12px 18px', borderBottom: i < mostMoved.length - 1 ? '1px solid #141414' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: '#ddd' }}>{item.title}</div>
                        {item.variant && <div style={{ fontSize: '11px', color: '#444', marginTop: '2px' }}>{item.variant}</div>}
                        <div style={{ fontSize: '10px', color: '#333', marginTop: '2px' }}>{item.remaining} remaining</div>
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#44cc66', background: '#001a07', padding: '2px 8px', borderRadius: '4px' }}>
                        {item.units_sold}
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
              <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444', marginBottom: '12px' }}>Order Sources — Last {days} days</div>
              <div style={{ background: '#0f0f0f', border: '1px solid #1c1c1c', borderRadius: '6px', overflow: 'hidden', maxWidth: '460px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px', padding: '10px 18px', borderBottom: '1px solid #1c1c1c', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444' }}>
                  <span>Source</span><span style={{ textAlign: 'right' }}>Orders</span><span style={{ textAlign: 'right' }}>Revenue</span>
                </div>
                {referrers.map((r, i) => {
                  const pct = totalReferralOrders > 0 ? Math.round((r.orders / totalReferralOrders) * 100) : 0;
                  const barColor = r.source === 'Social' ? '#44cc66' : r.source === 'Search' ? '#4488ff' : '#555';
                  return (
                    <div key={i} style={{ padding: '14px 18px', borderBottom: i < referrers.length - 1 ? '1px solid #141414' : 'none' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px', alignItems: 'center', marginBottom: '7px' }}>
                        <span style={{ fontSize: '13px', color: '#ddd' }}>{r.source}</span>
                        <span style={{ textAlign: 'right', fontSize: '13px', color: '#666' }}>{r.orders}</span>
                        <span style={{ textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#fff' }}>{fmt(r.revenue)}</span>
                      </div>
                      <div style={{ height: '2px', background: '#1c1c1c', borderRadius: '1px' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '1px', transition: 'width .5s ease' }} />
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
                  <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#444' }}>Reaktion — Ad Metrics</div>
                  {reaktion?.updated_at && (
                    <div style={{ fontSize: '11px', color: '#333', marginTop: '3px' }}>
                      Updated {timeAgo(reaktion.updated_at)}{reaktion.name ? ` by ${reaktion.name}` : ''}
                    </div>
                  )}
                </div>
                <button onClick={() => { setRDraft(reaktion || {}); setEditingR(!editingR); }} style={{ background: 'none', border: '1px solid #2a2a2a', color: '#666', padding: '5px 12px', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '4px', fontFamily: 'inherit' }}>
                  {editingR ? 'Cancel' : 'Update'}
                </button>
              </div>

              {editingR ? (
                <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '20px' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', marginBottom: '16px' }}>Enter this week's Reaktion numbers</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '14px' }}>
                    {[['spend', 'Ad Spend ($)'], ['roas', 'ROAS'], ['impressions', 'Impressions'], ['clicks', 'Clicks'], ['ctr', 'CTR (%)'], ['cpa', 'CPA ($)']].map(([key, label]) => (
                      <div key={key}>
                        <label style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', display: 'block', marginBottom: '5px' }}>{label}</label>
                        <input type="number" value={rDraft[key] || ''} onChange={e => setRDraft(d => ({ ...d, [key]: e.target.value }))}
                          style={{ background: '#141414', border: '1px solid #2a2a2a', color: '#fff', padding: '7px 10px', fontSize: '13px', width: '100%', borderRadius: '4px', outline: 'none', fontFamily: 'inherit' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#444', display: 'block', marginBottom: '5px' }}>Your Name</label>
                    <input type="text" placeholder="e.g. Mike" value={rDraft.name || ''} onChange={e => setRDraft(d => ({ ...d, name: e.target.value }))}
                      style={{ background: '#141414', border: '1px solid #2a2a2a', color: '#fff', padding: '7px 10px', fontSize: '13px', width: '200px', borderRadius: '4px', outline: 'none', fontFamily: 'inherit' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={saveReaktion} style={{ background: '#fff', border: 'none', color: '#000', padding: '7px 18px', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', borderRadius: '4px', fontFamily: 'inherit' }}>Save</button>
                    <button onClick={() => setEditingR(false)} style={{ background: 'none', border: '1px solid #2a2a2a', color: '#555', padding: '7px 18px', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '4px', fontFamily: 'inherit' }}>Cancel</button>
                  </div>
                </div>
              ) : reaktion ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#1c1c1c', border: '1px solid #1c1c1c', borderRadius: '6px', overflow: 'hidden' }}>
                  {[
                    { label: 'Ad Spend', value: `$${Number(reaktion.spend).toLocaleString()}` },
                    { label: 'ROAS', value: reaktion.roas },
                    { label: 'Impressions', value: Number(reaktion.impressions).toLocaleString() },
                    { label: 'Clicks', value: Number(reaktion.clicks).toLocaleString() },
                    { label: 'CTR', value: `${reaktion.ctr}%` },
                    { label: 'CPA', value: `$${reaktion.cpa}` },
                  ].map((k, i) => (
                    <div key={i} style={{ background: '#0f0f0f', padding: '18px 22px' }}>
                      <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', marginBottom: '7px' }}>{k.label}</div>
                      <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#0f0f0f', border: '1px solid #1c1c1c', borderRadius: '6px', padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#444', marginBottom: '6px' }}>No ad data yet</div>
                  <div style={{ fontSize: '11px', color: '#333' }}>Hit Update to add this week's Reaktion numbers</div>
                </div>
              )}

              <div style={{ marginTop: '16px', padding: '12px 16px', background: '#0a0a0a', border: '1px solid #141414', borderRadius: '4px', fontSize: '11px', color: '#333', lineHeight: 1.6 }}>
                Reaktion has no public API — enter manually from <span style={{ color: '#444' }}>advertiser.reaktion.com</span> (~2 min weekly)
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #141414', padding: '12px 24px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2a2a2a' }}>Los York Label · Internal Use Only</span>
          <span style={{ fontSize: '10px', color: '#2a2a2a' }}>losyorklabel.com</span>
        </div>

      </div>
    </>
  );
}
