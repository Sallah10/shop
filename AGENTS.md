# Shop Website

## Overview

An online shop with a product catalog, cart, checkout page, Google login,
and order confirmation emails. Individual internship task.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase: Postgres database + Google auth (via @supabase/ssr)
- Mailgun: order confirmation emails (called from server code only)
- Deployment: Vercel

## Structure

- app/ -> pages and route handlers
- app/(shop)/ -> products, cart, checkout, order success
- app/admin/ -> admin overview and product management
- app/auth/callback/ -> Supabase OAuth callback
- components/ -> reusable UI components
- components/admin/ -> admin nav, product form, delete button
- lib/supabase/ -> browser and server Supabase clients
- lib/admin.ts -> admin guard (isAdmin / requireAdmin)
- lib/mailgun.ts -> email sending helper
- supabase/schema.sql -> shop tables, RLS policies, seed data
- supabase/admin.sql -> admins allow list, product write policies, image bucket

## Database

Tables: products, orders, order_items, admins. Users come from Supabase auth.

- orders.user_id references auth.users
- admins.user_id references auth.users
- Row Level Security enabled on every table
- Users can only read their own orders and order_items
- Products are readable by everyone; only rows in `admins` can write them
- Admins are managed by hand in the SQL editor, never from the app

## Rules

- Never commit secrets. .env.local stays in .gitignore; keep .env.example updated.
- Only NEXT*PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY may use
  the NEXT_PUBLIC* prefix. Mailgun and service role keys are server-only.
- There is no service role key in this app. Admin writes use the anon key and
  are authorised by RLS, so the database is the security boundary and the
  requireAdmin() guard in each action is only for user experience.
- Authorise inside every server action. Layouts do not protect actions.
- Never trust form values for things you can read from the database, such as
  the current image_url when saving a product.
- Calculate order totals on the server from database prices, never trust
  prices sent by the client.
- Await the Mailgun call (or use after()) so serverless doesn't kill it.
- Protect /checkout and order actions: redirect unauthenticated users to login.
- Use TypeScript types, handle loading and error states in the UI.
- commits with clear messages.

## Workflow

1. Do one batch of work at a time and stop after each.
2. After each batch, tell me exactly how to run and test it.
3. Don't start the next batch until I confirm the current one works.

## Stages

1. Project setup + database schema, RLS, seed data
2. Product listing and detail pages
3. Cart
4. Google login + protected checkout
5. Checkout page creates the order in the database
6. Mailgun confirmation email
7. Deploy to Vercel and test on the live URL
8. Admin area: overview, product CRUD, photo upload to Supabase Storage
9. Order management in the admin area (needs an admin read policy on orders)

## Env variables

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
MAILGUN_API_KEY=
MAILGUN_DOMAIN=
MAILGUN_FROM=

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
