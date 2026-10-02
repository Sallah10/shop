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

There is deliberately **no service role key**. The admin area writes with the
anon key and Row Level Security rejects anything the caller is not allowed to
do, so the database is the security boundary rather than a check in a server
action. See [Admin area](#6-admin-area).

## 3. Create the database

Open the Supabase project → **SQL Editor** → **New**, paste the whole
`supabase/schema.sql` file and run it. That single file creates:

- tables `products`, `orders`, `order_items`
- Row Level Security on all three, plus the policies: products are readable by
  everyone and writable by nobody, orders and order items are readable and
  insertable by their owner only
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
2. Go to **Sending → Domains**. Mailgun already gives you a free **sandbox
   domain** (something like `sandbox1234.mailgun.org`) and it works straight
   away, so you can start without owning a domain. To send from your own
   address later, add a real domain here instead and change `MAILGUN_DOMAIN`
   and `MAILGUN_FROM` to match.
3. `MAILGUN_FROM` **must** use the same domain as `MAILGUN_DOMAIN`, otherwise
   Mailgun rejects the sender. With a sandbox domain:
   `MAILGUN_FROM=Northbound <no-reply@sandbox1234.mailgun.org>`.
4. Sandbox domains can only send to **authorized recipients**. Open the domain
   in Mailgun, find **Authorized addresses** and add every address you want to
   send order confirmations to.
5. For a real domain you must also add DNS records. Check what is missing at
   any time:

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

   You need one MX, one SPF TXT, one `email` CNAME and three DKIM records.
   DNS changes can take up to an hour.
6. Copy the private key from **Sending → API keys → Private key** (it looks
   like `key-...`) and put the three values in `.env.local`:

   ```env
   MAILGUN_API_KEY=key-...
   MAILGUN_DOMAIN=sandbox1234.mailgun.org
   MAILGUN_FROM=Northbound <no-reply@sandbox1234.mailgun.org>
   ```

7. Test it without placing a real order:

   ```bash
   npm run email:test -- you@example.com
   ```

## 6. Admin area

The admin area at `/admin` manages the catalog: overview numbers, add, edit and
delete products, and photo uploads to Supabase Storage.

Run a second script in the SQL editor. Unlike `schema.sql` this one does not
drop anything, so it is safe to re-run:

```sql
-- paste the whole supabase/admin.sql file
```

It creates:

- table `admins`, an allow list of user ids, readable only by the signed in user
  it belongs to
- `is_admin()`, the helper the policies below use
- insert / update / delete policies on `products`, allowed only when
  `is_admin()` is true
- the public `product-images` storage bucket, with upload, replace and delete
  allowed only for admins

Then make yourself an admin. Sign in to the shop with Google once, copy your id
from **Authentication → Users**, then:

```sql
insert into public.admins (user_id) values ('PASTE-YOUR-USER-ID-HERE');
```

Sign out and back in. The **Admin** link appears in the navbar and `/admin` now
loads. Anyone signed in who is *not* in the table gets a 404, so the admin area
does not advertise itself to customers.

To remove the admin flag:

```sql
delete from public.admins where user_id = 'PASTE-YOUR-USER-ID-HERE';
```

A product that already appears in an order cannot be deleted, because
`order_items.product_id` is `ON DELETE RESTRICT`. The database refuses and the
UI suggests setting the stock to 0 instead.

## 7. Run locally

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
  product, `app/robots.ts` serves `/robots.txt` and blocks `/admin`, `/checkout`,
  `/orders`, `/order-success/`, `/auth/` and `/api/` from crawlers.
- `app/layout.tsx` sets `metadataBase`, the title template and Open Graph and
  Twitter card defaults.
- Product pages generate their own title, description, social image and
  canonical URL, plus JSON-LD `Product` structured data with price and stock.
- Private pages set `robots: { index: false }`, so they never end up in search
  results.
- `app/icon.svg` is the favicon, `public/og.jpg` is the social card used for
  Open Graph and Twitter previews (1200x630 is the ideal size).
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
  admin/                   admin overview, product list, new/edit product, server actions
  auth/callback/route.ts   exchanges the OAuth code for a session
  auth/login/              Google login button
  auth/actions.ts          logOut server action
  error.tsx                error boundary with a retry button
  not-found.tsx            404 page
components/
  admin/                   admin nav, product form, delete confirmation
  cart/                    cart context, add to cart, cart view
  ui/                      empty state, error notice, quantity, confirm dialog, toasts
lib/
  supabase/                browser client, server client, session helper for proxy.ts, DB types
  admin.ts                 isAdmin / requireAdmin guard
  products.ts orders.ts    data access
  mailgun.ts               Mailgun HTTP API + the confirmation email template
  env.ts format.ts         env guard, price and date formatting
proxy.ts                   refreshes the Supabase session and guards protected routes
supabase/schema.sql        tables, RLS policies, stock function, seed data
supabase/admin.sql         admins allow list, product write policies, image bucket
scripts/                   dev-only helpers: send a test email, check Mailgun DNS
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
- Admin writes are authorised by the database too. `supabase/admin.sql` adds
  insert / update / delete policies on `products` gated on `is_admin()`, so a
  forged request with the anon key is rejected by Postgres even if the
  `requireAdmin()` guard in the action were missing.
- There is no service role key in the app, so there is no key that would turn a
  bug into full write access to every table.
- `public.admins` is insert / update / delete revoked for `anon` and
  `authenticated`, so a stolen session cannot promote itself. Only the SQL
  editor can add an admin.
- Protected routes are checked twice: in `proxy.ts` for a fast redirect, and
  again inside the page and the server action.
- `redirectTo` values coming back from the OAuth callback are sanitised, so
  only same-site paths are followed.

### Known simplifications

- Payment is not integrated: an order is recorded as `pending` on submit.
- Shipping is always free and is not calculated per product.
