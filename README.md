# Los York Label — Operations Dashboard

Internal dashboard for the Los York Label team. Shows live Shopify sales, inventory, traffic sources, and ad metrics.

## Features
- Live Shopify data via Orders API (proper discount code filtering)
- Excludes all discount code orders EXCEPT "WELCOME" code
- Adjustable time windows: 7, 14, 30, 90 days
- Auto-refreshes every 10 minutes
- Low stock alerts (under 5 units)
- Most moved inventory based on selected period
- Manual Reaktion ad metrics panel
- Shareable URL — no login required

## Deploy to Vercel

### 1. Add Environment Variables in Vercel
Go to your Vercel project → Settings → Environment Variables and add:

```
SHOPIFY_STORE_DOMAIN=los-york-shop.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_token_here
```

### 2. Get Your Shopify Token
1. Go to your Shopify admin → Settings → Apps and sales channels
2. Click "Develop apps" → Create an app called "Label Dashboard"
3. Under "Admin API access scopes" enable:
   - `read_orders`
   - `read_products`
   - `read_inventory`
4. Click "Install app" → copy the Admin API access token

### 3. Deploy
Connect this repo to Vercel and deploy. Done.

## Auto-refresh
The page auto-refreshes every 10 minutes while open in a browser.
Vercel also caches API responses for 10 minutes server-side.

## Discount filtering
The `/api/shopify` route filters orders at the source:
- Orders with NO discount code → included
- Orders with WELCOME code only → included at discounted price  
- Orders with any other discount code → excluded from all metrics
