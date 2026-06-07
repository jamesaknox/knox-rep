# Knox Creative — Real Estate Photo Hub

A self-hosted HDPhotoHub alternative: branded galleries, a Square paywall on
downloads (watermarked previews → clean MLS-ready files after payment), Square
Appointments for booking, branded property sites, and an editable product
catalog. Built to live at **knoxhd.com**.

This README is the build-it-for-real checklist. The clickable front-end you've
already seen (`knox-gallery-prototype.jsx`) is the UI this backend powers.

---

## Architecture at a glance

```
Browser (gallery + admin)  ──►  Next.js on Vercel  ──►  Supabase (Postgres + Storage)
                                       │
                                       ├──►  Square (Payments + Appointments)
                                       └──►  Resend (email) + Twilio (SMS)  — "media ready" alerts

Buckets:  kc-previews (PUBLIC, watermarked)   kc-full (PRIVATE, clean, signed URLs only)
Access:   private link  knoxhd.com/g/<token>   (no client login)
Admin:    knoxhd.com/admin  (Supabase Auth, email allowlist — James only)
Property: 242fykedr.knoxhd.com  (wildcard subdomain)
```

**Notifications.** Booking confirmations are handled natively by Square
Appointments (no code). The app sends only the **"your media is ready"** alert —
email via Resend, SMS via Twilio — triggered from the admin once a gallery is
uploaded. See `lib/notify.js` and `/api/notify`.

**The one rule that makes the paywall real:** clean full-resolution files live
in the private `kc-full` bucket and only ever leave through a signed URL minted
*after* `/api/download` confirms the gallery is paid. The watermark is burned
into the preview pixels server-side (see `scripts/process-and-upload.js`), not
applied with CSS — a CSS watermark would be trivially stripped in the browser.

---

## Cost (typical real-estate volume)

| Service | Plan | Approx /mo |
|---|---|---|
| Vercel | Hobby/Pro | $0–20 |
| Supabase | Free → Pro | $0–25 |
| Square | pay-per-transaction | ~2.9% + 30¢ per charge |

Storage is the main scaler. A 60-photo shoot is ~1–2 GB in full-res; Supabase
Pro includes 100 GB. Archive or offload delivered shoots after ~90 days to stay
cheap.

---

## Setup, step by step

### 1. Supabase
You've created the **Knox Creative** organization. Now create the project inside it:
1. In the Knox Creative org → **New project**. Name it `knoxhd`, pick a region
   close to TN (e.g. `us-east-1`), and save the database password.
2. When it finishes provisioning, copy the Project URL, `anon` key, and
   `service_role` key (Settings → API).
3. SQL editor → run `supabase/schema.sql`, then `supabase/seed.sql`.
4. Storage → create two buckets:
   - `kc-previews` — **public**
   - `kc-full` — **private**
5. Authentication → Users → **Add user** → create your admin login
   (e.g. `james@knoxhd.com`). Disable public sign-ups (Authentication →
   Providers → turn off "Allow new users to sign up"). Add that same email to
   `ADMIN_EMAILS` in your env so `/admin` recognizes you.

### 2. Square
1. In the Square Developer Dashboard, create an application.
2. Grab: Application ID, Location ID, and an Access Token (start in **Sandbox**).
3. Square Appointments: set up your services + availability in your Square
   account. Booking + the deposit + booking confirmations all happen there
   (Square sends its own email/SMS confirmations — no code needed).

### 3. Notifications (media-ready alerts)
1. **Resend**: create an account, verify your sending domain (`knoxhd.com`), and
   create an API key → `RESEND_API_KEY`. Set `NOTIFY_FROM_EMAIL` to a verified
   address like `delivery@knoxhd.com`.
2. **Twilio**: get a phone number with SMS, copy your Account SID + Auth Token →
   `TWILIO_*` env vars.

### 4. App
1. `npm install`
2. Copy `.env.example` → `.env.local`, fill in every value.
3. `npm run dev` → http://localhost:3000

### 5. Deploy to Vercel
1. Push this repo to GitHub, import into Vercel.
2. Add all env vars from `.env.example` in Vercel project settings.
3. Domains → add `knoxhd.com` **and** a wildcard `*.knoxhd.com`
   (the wildcard powers branded property sites like `242fykedr.knoxhd.com`).
4. In your DNS, point those at Vercel (CNAME for `rep` and `*`). Keep your
   existing WordPress `@`/`www` records untouched — the marketing site is
   unaffected.

### 6. Go live
- Flip `SQUARE_ENV=production` and swap in production Square credentials.
- Test one real low-value transaction end to end before handing a gallery to a client.

---

## Daily workflow (how you actually use it)

1. **Shoot** the property.
2. **Create a gallery** in the admin: pick the agent, enter address/sqft, choose
   the package (pulls price), set the deposit already collected at booking.
3. **Upload + process**:
   ```bash
   npm run process -- <galleryId> Interior ./edits/interiors/*.jpg
   npm run process -- <galleryId> Drone    ./edits/drone/*.jpg
   ```
   This burns watermarks, uploads both derivatives, and creates media rows.
4. **Paste the link-outs** (Giraffe360 tour, 3D floor plan, property-site URL).
5. **Send the gallery link** `knoxhd.com/g/<token>` to the agent.
6. Agent views watermarked previews → pays the balance with Square → downloads
   clean MLS-ready files (ZIP on desktop, per-image save on phone).

---

## What's in this repo

```
supabase/schema.sql          database tables, RLS, bucket notes
supabase/seed.sql            your real packages + add-ons, prefilled
lib/supabase.js              anon (browser) + service-role (server) clients
lib/square.js                server-side Square payment helper
lib/notify.js                Resend (email) + Twilio (SMS) + message templates
lib/auth.js                  admin auth gate (Supabase session + email allowlist)
app/api/pay/route            charges the balance, marks gallery paid
app/api/download/route       verifies payment, zips clean files, signs URLs
app/api/notify/route         sends the "media ready" email + SMS
app/api/admin/galleries      create / edit / list galleries
app/api/admin/products       create / edit / hide products
app/api/admin/agents         create / edit / list agents
middleware.js                maps *.knoxhd.com subdomains to /site/<slug>
app/site/[slug]/page.jsx     branded property site + SEO + schema markup
scripts/process-and-upload   watermark burn + dual-derivative upload (sharp)
.env.example                 every secret you need to provide
```

The three UI prototypes (`knox-gallery-prototype.jsx`, `knox-admin-prototype.jsx`,
`knox-property-site-prototype.jsx`) drop in as `app/g/[token]/page.jsx`,
`app/admin/page.jsx`, and the component rendered by `app/site/[slug]/page.jsx`.
The gallery fetches by `token`; the admin calls the `/api/admin/*` routes; the
property site is fed the gallery row by `site_slug`. Swap points are marked in
each file.

---

## Still to build (in priority order)

1. **Square Appointments embed** — a `/book` page; deposit + confirmation handled
   by Square.
2. **Wire the prototypes to the live routes** — drop the UI files in and connect
   them to Supabase + the `/api/*` routes (a Cowork session is a good place to do
   this together).
3. **Phone "save to camera roll"** — works per-image on the web today; a true
   one-tap save-all needs a PWA/installed wrapper (phase 2).

## Done
- Database schema + RLS + your real seeded catalog
- Watermark-burning pipeline (sharp)
- Square payment route + paywalled signed-URL downloads
- Media-ready notifications (Resend email + Twilio SMS)
- Admin API (galleries, products, agents) + admin UI prototype
- Branded property-site template — wildcard subdomain routing (`middleware.js`),
  dynamic page (`app/site/[slug]`), SEO metadata + RealEstateListing schema,
  lazy-loaded tour embed (`knox-property-site-prototype.jsx`)
