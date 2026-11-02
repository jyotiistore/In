# Store + Admin Panel Starter

A mobile-friendly Next.js storefront connected to Supabase. Product catalog and banner content are database-driven. Admin route: `/admin`.

## Setup (one time)

1. Create a project at https://supabase.com and open SQL Editor.
2. Run `supabase/schema.sql`.
3. In Supabase Authentication, create your admin user. Set that user's **app metadata** to `{"role":"admin"}` using a trusted admin method / Supabase dashboard. Do not put a service-role key in browser code.
4. Copy `.env.example` to `.env.local` and fill in the Supabase project URL and anon/publishable key.
5. Install Node.js 20+ then run:
   ```bash
   npm install
   npm run dev
   ```
6. Deploy the repository to Vercel and add the same environment variables in Project Settings → Environment Variables.

## URLs

- Store: `/`
- Product details: `/product/<product-uuid>`
- Cart: `/cart`
- Checkout: `/checkout`
- Customer login/profile: `/profile`
- Customer order history: `/orders`
- Admin panel: `/admin`

## Admin use

Sign in at `/admin`. Add products with up to four image URLs (one URL per line). Add one `top` banner and up to three `slider` banners. Banners can be hidden/shown from the panel. Use stable HTTPS image URLs. Product images can be hosted in Supabase Storage or another image host.

## Important production notes

- This starter is a deployable foundation, not a fully audited production commerce system.
- Before taking real orders, implement server-side checkout validation and atomic stock deduction (RPC/Edge Function), customer sign-up and address persistence, admin order management/status editing, and payment integration if needed. Current checkout validates visible stock in the browser, which is not sufficient against concurrent purchases or tampering.
- Cash on Delivery is not integrated as a payment provider; the checkout currently records an order request.
- Never expose Supabase service-role keys in `NEXT_PUBLIC_*` variables.
- The profile page is a minimal sign-in/logout starter; saved addresses and customer registration need completing for a production launch.
