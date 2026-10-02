# Northbound

A small online shop: product catalog, cart, Google login, checkout and order
confirmation emails.

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Supabase** for Postgres and Google auth (`@supabase/ssr`)
- **Mailgun** for order confirmation emails (server side only)

---

## 1. Install

```bash
npm install
```

## 2. Environment variables

Copy the example file and fill it in:

```bash
cp .env.example .env.local   # Windows PowerShell: Copy-Item .env.example .env.local
```

| Variable | Where to get it | Needed for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API → Project URL | everything |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → Data API → anon public key | everything |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role | optional, admin scripts only, never exposed to the browser |
| `MAILGUN_API_KEY` | Mailgun → Sending → API keys → Private key | order emails |
| `MAILGUN_DOMAIN` | Mailgun → Sending → Sending domains, e.g. `mg.example.com` | order emails |
| `MAILGUN_FROM` | e.g. `Northbound <no-reply@mg.example.com>` | order emails |
| `SITE_URL` | the public URL, e.g. `https://shop.vercel.app` | canonical links, sitemap, structured data |

`SITE_URL` has no `NEXT_PUBLIC_` prefix on purpose: it is only read on the
server. On Vercel it is picked up automatically from the project URL, so you
only need it locally.

Only the two `NEXT_PUBLIC_*` variables reach the browser. Everything else is
read on the server and must never be prefixed with `NEXT_PUBLIC_`.
`.env.local` is gitignored, `.env.example` is committed.

## 3. Create the database

Open the Supabase project → **SQL Editor** → **New**, paste the whole
`supabase/schema.sql` file and run it. That single file creates:

- tables `products`, `orders`, `order_items`
- Row Level Security on all three, plus the policies (products are public read
  only, orders and order items are readable and insertable by their owner only)
- `apply_stock_purchase()`, the function that decreases stock
- 10 seeded products

The script drops the three tables first, so run it on a fresh project (or
accept losing the existing shop data).

## 4. Enable Google login

1. In Supabase go to **Authentication → Providers → Google** and enable it.
   You need a Google Cloud OAuth client: create one with the authorised
   redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`.
2. In **Authentication → URL Configuration** add:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/auth/callback` and
     `https://<your-vercel-domain>/auth/callback`

## 5. Mailgun setup

Orders work without Mailgun, the confirmation email just fails and gets logged.
To turn emails on:

1. Create an account at https://www.mailgun.com and verify your email.
2. Go to **Sending → Domains** and either use the sandbox domain Mailgun gives
   you for testing, or add a domain you own (for example `mg.example.com`).
3. Mailgun shows a list of DNS records. Add them in the DNS provider where the
   domain is hosted: one MX, one SPF TXT, one `email` CNAME and three DKIM
   records. DNS changes can take up to an hour.
4. Check what is still missing at any time:

   ```bash
   npm run mailgun:check -- mg.example.com
   ```

   ```
   Checking Mailgun DNS records for mg.example.com

   OK       MX    mg.example.com
   OK       TXT   mg.example.com
   OK       CNAME email.mg.example.com
   OK       TXT   k1._domainkey.mg.example.com
   ...
   ```

5. Once the domain shows **Active**, go to **Sending → API keys → Private key**
   and copy the `key-...` value.
6. Put the three values in `.env.local`:

   ```env
   MAILGUN_API_KEY=key-...
   MAILGUN_DOMAIN=mg.example.com
   MAILGUN_FROM=Northbound <no-reply@mg.example.com>
   ```

7. Test it without placing a real order:

   ```bash
   npm run email:test -- you@example.com
   ```

Mailgun only lets you send from verified domains, and the sandbox domain is
restricted to the address you signed up with. Add your real address as a
recipient in **Sending → Domain settings → Authorized addresses** if you need
to send anywhere else.

## 6. Run locally

```bash
npm run dev
```

Open http://localhost:3000.

```bash
npm run build     # production build
npm run start     # serve the production build
npm run lint      # eslint
npm run typecheck # tsc --noEmit
```

## SEO

- `app/sitemap.ts` serves `/sitemap.xml` with the homepage, cart and every
  product, `app/robots.ts` serves `/robots.txt` and blocks `/checkout`,
  `/orders`, `/order-success/`, `/auth/` and `/api/` from crawlers.
- `app/layout.tsx` sets `metadataBase`, the title template and Open Graph and
  Twitter card defaults.
- Product pages generate their own title, description, social image and
  canonical URL, plus JSON-LD `Product` structured data with price and stock.
- Private pages set `robots: { index: false }`, so they never end up in search
  results.
- `app/icon.svg` is the favicon, `app/opengraph-image.tsx` renders a 1200x630
  social card on demand and picks a random product for it.
- Set `SITE_URL` in production so canonical links and the sitemap point at the
  real domain.

## Deploying to Vercel

```bash
npx vercel
```

Add the same environment variables in the Vercel project settings, then add
`https://<your-vercel-domain>/auth/callback` to the Supabase redirect URLs.

---

## How it fits together

```
app/
  (shop)/                  catalog, cart, checkout, order confirmation, order history
  actions/orders.ts        placeOrder server action (pricing, stock, inserts, email)
  auth/callback/route.ts   exchanges the OAuth code for a session
  auth/login/              Google login button
  auth/actions.ts          logOut server action
  error.tsx                error boundary with a retry button
  not-found.tsx            404 page
components/                cart context, product cards, checkout form, navbar, footer
lib/
  supabase/                browser client, server client, session helper for proxy.ts, DB types
  products.ts orders.ts    data access
  mailgun.ts               Mailgun HTTP API + the confirmation email template
  env.ts format.ts         env guard, price and date formatting
proxy.ts                   refreshes the Supabase session and guards protected routes
supabase/schema.sql        tables, RLS policies, stock function, seed data
```

### Cart

The cart lives in `localStorage` and is exposed through React context in
`components/cart/CartProvider.tsx`. It uses `useSyncExternalStore` so the
server and the first client render always agree. The navbar badge, the cart
page and the checkout summary all read from the same store.

### Checkout and pricing

`app/actions/orders.ts` receives **only product ids and quantities**. On the
server it then:

1. verifies the session with `supabase.auth.getUser()`;
2. re-reads those products from the database and uses the database price, so a
   tampered cart cannot change what a customer pays;
3. checks stock and returns a readable error if there is not enough;
4. inserts the order and its items;
5. calls `apply_stock_purchase()` to decrease stock under a row lock;
6. schedules the confirmation email with `after()`, so it is not cut off when
   the response is sent;
7. redirects to `/order-success/[id]`, where the cart is cleared.

A failing email is logged and never fails the order.

### Security notes

- Row Level Security is the real access control. The server never filters
  orders by user id to stay safe, the policies already do it.
- Protected routes are checked twice: in `proxy.ts` for a fast redirect, and
  again inside the page and the server action.
- `redirectTo` values coming back from the OAuth callback are sanitised, so
  only same-site paths are followed.

### Known simplifications

- Payment is not integrated: an order is recorded as `pending` on submit.
- Shipping is always free and is not calculated per product.
