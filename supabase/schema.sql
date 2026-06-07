-- ============================================================================
-- KNOX CREATIVE — Real Estate Photo Hub
-- Supabase / Postgres schema
--
-- Access model: PRIVATE LINK (no client login). Each gallery has an
-- unguessable token used in the URL: rep.jamesknoxphotos.com/g/<token>
-- Only the admin (you) authenticates, via Supabase Auth.
-- ============================================================================

-- Enable the extension used to generate URL-safe random tokens.
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────
-- AGENTS (your realtor clients — Evelyn Cole, Corrina Ashe, etc.)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists agents (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  phone       text,
  brokerage   text,
  headshot_url text,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- PRODUCTS / PACKAGES (your four tiers × three sizes, plus add-ons)
-- Editable from the admin so you never touch code to change pricing.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('package','addon')),
  name          text not null,          -- "Complete Listing"
  size_label    text,                   -- "Under 2,000 sq ft" (null for add-ons)
  price_cents   integer not null,       -- store money as integer cents, always
  unit          text,                   -- "per image" for some add-ons, else null
  on_site_label text,                   -- "2 hours on site"
  description   text,
  features      jsonb default '[]',     -- ["HDR listing photos","Drone aerials",...]
  sort_order    integer default 0,
  active        boolean default true,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────
-- GALLERIES (one per shoot / property — mirrors an HDPhotoHub "Site")
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists galleries (
  id              uuid primary key default gen_random_uuid(),
  -- URL-safe private token. encode(...,'base64') then made URL-safe.
  token           text not null unique
                   default replace(replace(encode(gen_random_bytes(12),'base64'),'+','-'),'/','_'),
  agent_id        uuid references agents(id) on delete set null,

  -- property data (matches HDPhotoHub Site Data screen)
  address         text not null,         -- "242 Fyke Dr"
  city            text,
  state           text default 'TN',
  zip             text,
  sqft            integer,
  beds            integer,
  baths           numeric(3,1),
  year_built      integer,
  lot_size        text,
  description     text,

  -- subdomain slug for the branded property site: 242fykedr -> 242fykedr.jamesknoxphotos.com
  site_slug       text unique,

  -- shareable link-out deliverables (always public, never paywalled)
  link_virtual_tour    text,
  link_floorplan_3d    text,            -- "3D Floor Plan & Sun Map"
  link_property_site   text,

  -- money + payment state (deposit at booking, balance before download)
  total_cents     integer not null default 0,
  deposit_cents   integer not null default 0,
  paid            boolean not null default false,
  paid_at         timestamptz,
  square_order_id text,
  square_payment_id text,

  status          text not null default 'preparing'
                   check (status in ('preparing','delivery_only','active','archived')),
  shoot_date      date,
  notified_at     timestamptz,           -- when the "media ready" alert was sent
  created_at      timestamptz not null default now()
);

create index if not exists galleries_token_idx  on galleries(token);
create index if not exists galleries_agent_idx  on galleries(agent_id);
create index if not exists galleries_slug_idx   on galleries(site_slug);

-- ─────────────────────────────────────────────────────────────────────────
-- MEDIA (each photo / floor plan / staging / marketing asset)
-- Two files per item:
--   preview_path  -> WATERMARKED, public-readable thumbnail (proves the work)
--   full_path     -> CLEAN full-res, served ONLY via signed URL after payment
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists media (
  id           uuid primary key default gen_random_uuid(),
  gallery_id   uuid not null references galleries(id) on delete cascade,
  category     text not null
                check (category in
                  ('Interior','Exterior','Drone','Twilight',
                   '2D Floor Plans','Virtual Staging','Marketing')),
  label        text,
  preview_path text not null,           -- storage path in the PUBLIC bucket
  full_path    text not null,           -- storage path in the PRIVATE bucket
  width        integer,
  height       integer,
  sort_order   integer default 0,
  created_at   timestamptz not null default now()
);

create index if not exists media_gallery_idx on media(gallery_id);

-- ─────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- The public (anon key) can READ gallery + media rows ONLY by knowing the
-- token (it's queried via a server route using the service key anyway, but we
-- lock the tables down so nothing leaks if the anon key is ever used directly).
-- All writes go through the service-role key on the server only.
-- ─────────────────────────────────────────────────────────────────────────
alter table galleries enable row level security;
alter table media     enable row level security;
alter table products  enable row level security;
alter table agents    enable row level security;

-- Products are public-readable (used to render pricing on the marketing site).
create policy products_public_read on products
  for select using (active = true);

-- Galleries/media/agents: NO public policies. Only the service-role key
-- (used exclusively server-side) bypasses RLS. This means the browser can
-- never read these tables directly — every read is brokered by your API
-- routes, which check the token first.

-- ─────────────────────────────────────────────────────────────────────────
-- STORAGE BUCKETS (create these in the Supabase dashboard or via the API)
--   kc-previews  : PUBLIC   — watermarked previews
--   kc-full      : PRIVATE  — clean full-res; access only via signed URLs
-- ─────────────────────────────────────────────────────────────────────────
