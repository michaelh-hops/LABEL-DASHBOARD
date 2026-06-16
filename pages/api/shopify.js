const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function shopifyFetch(endpoint) {
  const res = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/${endpoint}`, {
    headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Shopify API error: ${res.status}`);
  return res.json();
}

async function shopifyGraphQL(query) {
  const res = await fetch(`https://${SHOPIFY_STORE}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`Shopify GraphQL error: ${res.status}`);
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

const FREELANCE_CODE = 'FREE?LANCE?25?';
const WELCOME_CODE = 'WELCOME';

function isGiftOrder(order) {
  const codes = (order.discount_codes || []).map(c => c.code.toUpperCase());
  if (codes.length === 0) return false;
  if (codes.includes(WELCOME_CODE)) return false;
  if (codes.includes(FREELANCE_CODE)) return false;
  return true;
}

function isFreelanceOrder(order) {
  const codes = (order.discount_codes || []).map(c => c.code.toUpperCase());
  return codes.includes(FREELANCE_CODE);
}

function isPaidOrder(order) {
  const codes = (order.discount_codes || []).map(c => c.code.toUpperCase());
  if (codes.length === 0) return true;
  if (codes.length === 1 && codes[0] === WELCOME_CODE) return true;
  return false;
}

function buildGiftSummary(giftOrders, costByTitle) {
  const productMap = {};
  giftOrders.forEach(order => {
    (order.line_items || []).forEach(item => {
      if (!productMap[item.title]) {
        productMap[item.title] = { title: item.title, units: 0, cost: 0 };
      }
      productMap[item.title].units += item.quantity;
      const unitCost = costByTitle[item.title] || 0;
      productMap[item.title].cost += unitCost * item.quantity;
    });
  });
  return Object.values(productMap).sort((a, b) => b.units - a.units);
}

function buildOrderList(orders) {
  return orders.map(order => ({
    name: order.customer
      ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() || 'Guest'
      : (order.billing_address
        ? `${order.billing_address.first_name || ''} ${order.billing_address.last_name || ''}`.trim()
        : 'Guest'),
    date: new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    items: (order.line_items || [])
      .map(item => item.quantity > 1 ? `${item.title} ×${item.quantity}` : item.title)
      .join(', '),
  }));
}

function calcTotalCost(products) {
  return Math.round(products.reduce((s, p) => s + (p.cost || 0), 0) * 100) / 100;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=60');

  const days = parseInt(req.query.days) || 7;
  const since = req.query.from ? new Date(req.query.from).toISOString() : getDaysAgo(days);
  const until = req.query.to
    ? new Date(new Date(req.query.to).getTime() + 86400000).toISOString()
    : new Date().toISOString();

  try {
    // 1. Fetch orders
    const { orders } = await shopifyFetch(
      `orders.json?status=any&created_at_min=${since}&created_at_max=${until}&limit=250&fields=id,created_at,total_price,discount_codes,line_items,referring_site,customer,billing_address`
    );

    // 2. Fetch active products (for inventory)
    const { products: shopifyProducts } = await shopifyFetch(
      'products.json?status=active&limit=250'
    );

    // 3. Fetch unit costs via GraphQL (REST API doesn't return unitCost)
    const costByTitle = {};
    try {
      const gqlResult = await shopifyGraphQL(`{
        products(first: 250, query: "status:active") {
          edges {
            node {
              title
              variants(first: 10) {
                edges {
                  node {
                    inventoryItem {
                      unitCost { amount }
                    }
                  }
                }
              }
            }
          }
        }
      }`);
      const gqlProducts = (gqlResult.data && gqlResult.data.products && gqlResult.data.products.edges) || [];
      gqlProducts.forEach(function(edge) {
        const p = edge.node;
        const variantEdges = (p.variants && p.variants.edges) || [];
        const costs = variantEdges
          .map(function(ve) {
            return ve.node && ve.node.inventoryItem && ve.node.inventoryItem.unitCost
              ? parseFloat(ve.node.inventoryItem.unitCost.amount)
              : 0;
          })
          .filter(function(c) { return c > 0; });
        if (costs.length > 0) {
          costByTitle[p.title] = costs.reduce(function(s, c) { return s + c; }, 0) / costs.length;
        }
      });
    } catch (costErr) {
      console.warn('Cost fetch failed, gifting costs will be 0:', costErr.message);
    }

    // 4. Split orders into categories
    const paidOrders = orders.filter(isPaidOrder);
    const clientGiftOrders = orders.filter(isGiftOrder);
    const freelanceOrders = orders.filter(isFreelanceOrder);

    // 5. Build product sales from paid orders
    const productMap = {};
    paidOrders.forEach(function(order) {
      (order.line_items || []).forEach(function(item) {
        if (!productMap[item.title]) productMap[item.title] = { title: item.title, units: 0, revenue: 0 };
        productMap[item.title].units += item.quantity;
        productMap[item.title].revenue += parseFloat(item.price) * item.quantity;
      });
    });
    const products = Object.values(productMap).sort(function(a, b) { return b.revenue - a.revenue; }).slice(0, 15);

    // 6. Build referrer breakdown
    const referrerMap = {};
    paidOrders.forEach(function(order) {
      const plat = getPlatform(order.referring_site);
      if (!referrerMap[plat.source]) referrerMap[plat.source] = { source: plat.source, platform: plat.platform, orders: 0, revenue: 0 };
      referrerMap[plat.source].orders += 1;
      referrerMap[plat.source].revenue += parseFloat(order.total_price);
    });
    const referrers = Object.values(referrerMap).sort(function(a, b) { return b.orders - a.orders; });

    // 7. Build inventory data
    const lowStock = [];
    const outOfStock = [];
    const allVariants = [];
    shopifyProducts.forEach(function(product) {
      (product.variants || []).forEach(function(variant) {
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
    lowStock.sort(function(a, b) { return a.units - b.units; });

    const mostMoved = products.slice(0, 8).map(function(p) {
      const inv = allVariants.find(function(v) { return v.title === p.title; });
      return { title: p.title, variant: '', units_sold: p.units, remaining: inv ? inv.units : '—' };
    });

    // 8. Build gifting summaries
    const clientGiftProducts = buildGiftSummary(clientGiftOrders, costByTitle);
    const freelanceProducts = buildGiftSummary(freelanceOrders, costByTitle);
    const totalGiftedUnits = clientGiftProducts.reduce(function(s, p) { return s + p.units; }, 0)
      + freelanceProducts.reduce(function(s, p) { return s + p.units; }, 0);

    // 9. Totals
    const totalRevenue = paidOrders.reduce(function(s, o) { return s + parseFloat(o.total_price); }, 0);
    const totalUnits = products.reduce(function(s, p) { return s + p.units; }, 0);
    const aov = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

    res.status(200).json({
      ok: true,
      days,
      summary: {
        total_orders: paidOrders.length,
        gross_revenue: Math.round(totalRevenue),
        total_units: totalUnits,
        aov,
        units_gifted: totalGiftedUnits,
      },
      products,
      referrers,
      inventory: {
        low_stock: lowStock.slice(0, 20),
        out_of_stock: outOfStock.slice(0, 20),
        most_moved: mostMoved,
      },
      gifting: {
        client: {
          products: clientGiftProducts,
          orders: buildOrderList(clientGiftOrders),
          total_cost: calcTotalCost(clientGiftProducts),
        },
        freelance: {
          products: freelanceProducts,
          orders: buildOrderList(freelanceOrders),
          total_cost: calcTotalCost(freelanceProducts),
        },
        total_cost: calcTotalCost(clientGiftProducts) + calcTotalCost(freelanceProducts),
        total_units: totalGiftedUnits,
      },
      updated_at: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Shopify fetch error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
}
