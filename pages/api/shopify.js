const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function shopifyFetch(endpoint) {
  const res = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/${endpoint}`, {
    headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Shopify API error: ${res.status}`);
  return res.json();
}

function getDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function getPlatform(ref) {
  if (!ref) return { source: 'Direct', platform: 'direct' };
  const r = ref.toLowerCase();
  if (r.includes('instagram')) return { source: 'Instagram', platform: 'instagram' };
  if (r.includes('pinterest')) return { source: 'Pinterest', platform: 'pinterest' };
  if (r.includes('tiktok')) return { source: 'TikTok', platform: 'tiktok' };
  if (r.includes('facebook')) return { source: 'Facebook', platform: 'facebook' };
  if (r.includes('twitter') || r.includes('t.co')) return { source: 'Twitter/X', platform: 'twitter' };
  if (r.includes('google')) return { source: 'Google', platform: 'google' };
  if (r.includes('bing') || r.includes('yahoo') || r.includes('duckduckgo')) return { source: 'Search', platform: 'search' };
  return { source: 'Referral', platform: 'referral' };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=60');
  const days = parseInt(req.query.days) || 7;
  const since = req.query.from ? new Date(req.query.from).toISOString() : getDaysAgo(days);
  const until = req.query.to ? new Date(new Date(req.query.to).getTime() + 86400000).toISOString() : new Date().toISOString();

  try {
    const { orders } = await shopifyFetch(
      `orders.json?status=any&created_at_min=${since}&created_at_max=${until}&limit=250&fields=id,created_at,total_price,discount_codes,line_items,referring_site`
    );

    const filtered = orders.filter(order => {
      const codes = order.discount_codes || [];
      if (codes.length === 0) return true;
      if (codes.length === 1 && codes[0].code.toUpperCase() === 'WELCOME') return true;
      return false;
    });

    const productMap = {};
    filtered.forEach(order => {
      (order.line_items || []).forEach(item => {
        if (!productMap[item.title]) productMap[item.title] = { title: item.title, units: 0, revenue: 0 };
        productMap[item.title].units += item.quantity;
        productMap[item.title].revenue += parseFloat(item.price) * item.quantity;
      });
    });
    const products = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 15);

    const referrerMap = {};
    filtered.forEach(order => {
      const { source, platform } = getPlatform(order.referring_site);
      if (!referrerMap[source]) referrerMap[source] = { source, platform, orders: 0, revenue: 0 };
      referrerMap[source].orders += 1;
      referrerMap[source].revenue += parseFloat(order.total_price);
    });
    const referrers = Object.values(referrerMap).sort((a, b) => b.orders - a.orders);

    const { products: shopifyProducts } = await shopifyFetch('products.json?status=active&limit=250&fields=id,title,status,variants');

    const lowStock = [];
    const outOfStock = [];
    const allVariants = [];

    shopifyProducts.forEach(product => {
      product.variants.forEach(variant => {
        const qty = variant.inventory_quantity;
        const v = variant.title === 'Default Title' ? '' : variant.title;
        allVariants.push({ title: product.title, variant: v, units: qty });
        if (qty === 0) {
          outOfStock.push({ title: product.title, variant: v, units: 0 });
        } else if (qty > 0 && qty <= 4) {
          lowStock.push({ title: product.title, variant: v, units: qty });
        }
      });
    });

    lowStock.sort((a, b) => a.units - b.units);
    outOfStock.sort((a, b) => a.title.localeCompare(b.title));

    const mostMoved = products.slice(0, 8).map(p => {
      const inv = allVariants.find(v => v.title === p.title);
      return { title: p.title, variant: '', units_sold: p.units, remaining: inv ? inv.units : '—' };
    });

    res.status(200).json({
      ok: true, days,
      summary: {
        total_orders: filtered.length,
        gross_revenue: Math.round(filtered.reduce((s, o) => s + parseFloat(o.total_price), 0)),
        total_units: products.reduce((s, p) => s + p.units, 0),
        aov: filtered.length > 0 ? Math.round(filtered.reduce((s, o) => s + parseFloat(o.total_price), 0) / filtered.length) : 0,
      },
      products, referrers,
      inventory: {
        low_stock: lowStock.slice(0, 20),
        out_of_stock: outOfStock.slice(0, 20),
        most_moved: mostMoved,
      },
      updated_at: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Shopify fetch error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
