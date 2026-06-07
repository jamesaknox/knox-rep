# Knox Creative — Deploy Runbook

An ordered, check-the-box guide to taking `knox-rep` live at **knoxhd.com**.
Work top to bottom — each phase depends on the one before it. Anything marked
**SECRET** must only ever go in Supabase/Vercel/Square settings, never in code or
the browser.

Stack: **eNom** (registrar) → **Cloudflare** (DNS) → **Vercel** (app) →
**Supabase** (database + photo storage) → **Square** (payments) +
**Resend/Twilio** (media-ready alerts). HostGator reseller is not used.

---

## Phase 1 — Supabase (database + storage)

- [ ] In the **Knox Creative** org → **New project**. Name `knoxhd`, region
      `us-east-1` (closest to TN). Save the database password somewhere safe.
- [ ] Wait for provisioning to finish (~2 min).
- [ ] Settings → API → copy these three values:
  - [ ] Project URL  → `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `service_role` key **(SECRET)** → `SUPABASE_SERVICE_ROLE_KEY`
- [ ] SQL Editor → paste + run `supabase/schema.sql`.
- [ ] SQL Editor → paste + run `supabase/seed.sql`.
- [ ] Storage → New bucket → `kc-previews` → **Public**.
- [ ] Storage → New bucket → `kc-full` → **Private** (leave "Public" unchecked).
- [ ] Authentication → Providers → Email → turn **OFF** "Allow new users to sign
      up" (no public signups — admin only).
- [ ] Authentication → Users → Add user → create your login
      (e.g. `james@knoxhd.com` + a strong password). This is how you log into /admin.

---

## Phase 2 — Square (payments)

- [ ] Square Developer Dashboard → create an application "Knox Creative".
- [ ] Start in **Sandbox** for testing. Copy:
  - [ ] Application ID → `NEXT_PUBLIC_SQUARE_APP_ID`
  - [ ] Location ID → `SQUARE_LOCATION_ID` and `NEXT_PUBLIC_SQUARE_LOCATION_ID`
  - [ ] Sandbox Access Token **(SECRET)** → `SQUARE_ACCESS_TOKEN`
- [ ] Set `SQUARE_ENV=sandbox`.
- [ ] In your live Square account, set up **Square Appointments**: your services
      (the four packages), durations, and availability. Square sends its own
      booking confirmations — nothing to build.

---

## Phase 3 — Notifications (Resend + Twilio)

- [ ] **Resend** → create account → add domain `knoxhd.com` → add the DNS records
      it gives you **into Cloudflare** (you'll be back in Cloudflare in Phase 5;
      can do it then). Create an API key **(SECRET)** → `RESEND_API_KEY`.
  - [ ] Set `NOTIFY_FROM_EMAIL=delivery@knoxhd.com`.
- [ ] **Twilio** → buy a phone number with SMS capability. Copy:
  - [ ] Account SID **(SECRET)** → `TWILIO_ACCOUNT_SID`
  - [ ] Auth Token **(SECRET)** → `TWILIO_AUTH_TOKEN`
  - [ ] The number → `TWILIO_FROM_NUMBER` (E.164, e.g. `+14235551234`)
- [ ] Set `ADMIN_EMAILS=james@knoxhd.com` (same email as your Supabase admin user).

> Notifications are optional to launch. If Resend/Twilio aren't ready, the app
> still runs — the "Send Media Alert" button just won't fire until the keys exist.

---

## Phase 4 — Wire prototypes + push to GitHub

- [ ] Drop the three UI prototypes into their route slots:
  - [ ] `knox-gallery-prototype.jsx` → `app/g/[token]/page.jsx`
        (swap hardcoded `ORDER` for a fetch by `token`; swap simulated `pay()`
        for the Square Web Payments card form posting to `/api/pay`).
  - [ ] `knox-admin-prototype.jsx` → `app/admin/page.jsx`
        (swap in-memory state for calls to `/api/admin/*`; gate behind Supabase login).
  - [ ] `knox-property-site-prototype.jsx` → component rendered by
        `app/site/[slug]/page.jsx` (feed it the gallery row; set the tour +
        floor-plan iframe `src` from `link_virtual_tour` / `link_floorplan_3d`).
- [ ] `npm install` locally, create `.env.local` from `.env.example`, fill it in,
      `npm run dev`, confirm it boots at localhost:3000.
- [ ] Push the repo to a new **GitHub** repository.

> This phase is the main hands-on coding step — a good one to do together in Cowork.

---

## Phase 5 — Cloudflare (DNS)

- [ ] At **eNom Central**: set the domain's nameservers to the two Cloudflare
      nameservers shown when you add the site to Cloudflare. (One-time; may already
      be done.)
- [ ] In **Cloudflare** → add site `knoxhd.com` → Free plan.
- [ ] Add these DNS records — **all set to "DNS only" (grey cloud, NOT orange)**:

  | Type  | Name | Target                  | Proxy        |
  |-------|------|-------------------------|--------------|
  | CNAME | `@`  | `cname.vercel-dns.com`  | DNS only 🌫️ |
  | CNAME | `www`| `cname.vercel-dns.com`  | DNS only 🌫️ |
  | CNAME | `*`  | `cname.vercel-dns.com`  | DNS only 🌫️ |

  > ⚠️ **The #1 thing that breaks this deploy:** if the records are orange-clouded
  > (proxied), Vercel can't issue SSL certs for property subdomains and
  > `242fykedr.knoxhd.com` throws SSL errors. Grey cloud = Vercel handles SSL =
  > everything works. Vercel has its own CDN, so you lose nothing.

- [ ] Add any Resend email-verification records from Phase 3 here too.

---

## Phase 6 — Vercel (deploy)

- [ ] Vercel → New Project → import the GitHub repo.
- [ ] Settings → Environment Variables → add **every** key from `.env.example`
      (all the values you collected in Phases 1–3). Double-check the SECRET ones
      are present.
- [ ] Deploy. Confirm the build succeeds.
- [ ] Settings → Domains → add:
  - [ ] `knoxhd.com`
  - [ ] `www.knoxhd.com`
  - [ ] `*.knoxhd.com`  (the wildcard — powers property sites)
- [ ] Vercel will verify each via the Cloudflare CNAMEs and issue SSL (takes a few
      minutes). All three should go green.

---

## Phase 7 — Smoke test (before any real client)

- [ ] Visit `knoxhd.com` → app loads over HTTPS.
- [ ] Log into `knoxhd.com/admin` with your Supabase user. A wrong/other email is
      rejected.
- [ ] Create a test agent (use your own email + phone).
- [ ] Create a test gallery, assign the agent, pick a package, set a small total
      and deposit.
- [ ] Run `npm run process -- <galleryId> Interior ./test-photos/*.jpg` and confirm
      watermarked previews appear and the clean files land in `kc-full`.
- [ ] Open the gallery link `knoxhd.com/g/<token>` → previews show watermarked,
      downloads locked.
- [ ] Pay the balance with a **Square sandbox test card**
      (`4111 1111 1111 1111`, any future expiry, any CVV) → watermark clears,
      download unlocks.
- [ ] Download all on desktop → ZIP of clean, unwatermarked files.
- [ ] Click "Send Media Alert" → you receive the email + text.
- [ ] Set the gallery's `site_slug`, visit `<slug>.knoxhd.com` → property site
      renders with SSL, tour + 3D plan embeds open on tap.

---

## Phase 8 — Go live

- [ ] Square: create a **production** application (or switch to production
      credentials), update `SQUARE_ACCESS_TOKEN`, IDs, and set
      `SQUARE_ENV=production` in Vercel.
- [ ] Run **one** real low-value transaction end to end, then refund it in Square.
- [ ] Update `jamesknoxphotos.com` (WordPress) so the delivery/booking links point
      to `knoxhd.com`.
- [ ] You're live.

---

## If something breaks

- **Property subdomain SSL error** → a DNS record is orange-clouded. Set it to
  grey (DNS only) in Cloudflare. (See Phase 5 warning.)
- **"Too many connections" / DB errors** → confirm the app uses the Supabase
  client from `lib/supabase.js`, not a raw connection. Supabase pools for serverless.
- **Payment fails in sandbox** → confirm `SQUARE_ENV=sandbox` and you're using a
  Square test card, not a real one.
- **Download returns 402** → that's correct when unpaid. If it 402s after paying,
  check the `/api/pay` route actually flipped `paid=true` (look at the gallery row).
- **Admin rejects your login** → the logged-in email must exactly match an entry
  in `ADMIN_EMAILS`.
