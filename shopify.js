// pages/api/shopify.js
// Fetches real Shopify data with proper discount code filtering:
// - Excludes all orders with discount codes
// - EXCEPT orders using the "WELCOME" code (included at discounted price)

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN; // e.g. los-york-shop.myshopify.com
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function shopifyFetch(endpoint) {
  const res = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/${endpoint}`, {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Shopify API error: ${res.status}`);
  return res.json();
}

function getDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export default async function handler(req, res) {
  // Cache for 10 minutes
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=60');

  const days = parseInt(req.query.days) || 7;
  const since = getDaysAgo(days);

  try {
    // Fetch all orders in the period
    const { orders } = await shopifyFetch(
      `orders.json?status=any&created_at_min=${since}&limit=250&fields=id,created_at,total_price,discount_codes,line_items,source_name,referring_site`
    );

    // Filter: keep orders with NO discount code, OR with ONLY the WELCOME code
    const filtered = orders.filter(order => {
      const codes = order.discount_codes || [];
      if (codes.length === 0) return true;
      if (codes.length === 1 && codes[0].code.toUpperCase() === 'WELCOME') return true;
      return false;
    });

    // Build product sales map
    const productMap = {};
    filtered.forEach(order => {
      (order.line_items || []).forEach(item => {
        const title = item.title;
        if (!productMap[title]) productMap[title] = { title, units: 0, revenue: 0, orders: 0 };
        productMap[title].units += item.quantity;
        productMap[title].revenue += parseFloat(item.price) * item.quantity;
        productMap[title].orders += 1;
      });
    });

    const products = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);

    // Traffic / referrer breakdown
    const referrerMap = {};
    filtered.forEach(order => {
      let source = 'Direct';
      const ref = order.referring_site || '';
      if (ref.includes('google') || ref.includes('bing') || ref.includes('yahoo')) source = 'Search';
      else if (ref.includes('instagram') || ref.includes('facebook') || ref.includes('tiktok') || ref.includes('twitter') || ref.includes('pinterest')) source = 'Social';
      else if (ref && ref !== '') source = 'Referral';
      if (!referrerMap[source]) referrerMap[source] = { source, orders: 0, revenue: 0 };
      referrerMap[source].orders += 1;
      referrerMap[source].revenue += parseFloat(order.total_price);
    });

    const referrers = Object.values(referrerMap).sort((a, b) => b.orders - a.orders);

    // Fetch inventory (active products only)
    const { products: shopifyProducts } = await shopifyFetch(
      'products.json?status=active&limit=250&fields=id,title,status,variants'
    );

    const lowStock = [];
    const allVariants = [];

    shopifyProducts.forEach(product => {
      if (product.status !== 'active') return;
      product.variants.forEach(variant => {
        const qty = variant.inventory_quantity;
        const variantLabel = variant.title === 'Default Title' ? '' : variant.title;
        allVariants.push({ title: product.title, variant: variantLabel, units: qty });
        if (qty !== null && qty <= 5 && qty >= 0) {
          lowStock.push({ title: product.title, variant: variantLabel, units: qty });
        }
      });
    });

    lowStock.sort((a, b) => a.units - b.units);

    // Most moved: use the product sales data from filtered orders
    const mostMoved = products
      .filter(p => p.units > 0)
      .slice(0, 8)
      .map(p => {
        const inv = allVariants.find(v => v.title === p.title);
        return { title: p.title, variant: '', units_sold: p.units, remaining: inv ? inv.units : '—' };
      });

    // Totals
    const totalRevenue = filtered.reduce((s, o) => s + parseFloat(o.total_price), 0);
    const totalUnits = products.reduce((s, p) => s + p.units, 0);

    res.status(200).json({
      ok: true,
      days,
      summary: {
        total_orders: filtered.length,
        gross_revenue: Math.round(totalRevenue),
        total_units: totalUnits,
      },
      products,
      referrers,
      inventory: {
        low_stock: lowStock.slice(0, 10),
        most_moved: mostMoved,
      },
      updated_at: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Shopify fetch error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
