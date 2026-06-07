-- ============================================================================
-- Seed Knox Creative's real products (from jamesknoxphotos.com pricing).
-- Run AFTER schema.sql. Money is stored as integer cents.
-- ============================================================================

-- ── PACKAGES ────────────────────────────────────────────────────────────
insert into products (kind, name, size_label, price_cents, on_site_label, description, features, sort_order) values
-- Tier 1 · Listing Photos
('package','Listing Photos','Under 2,000 sq ft', 17500,'1 hour on site',
 'HDR listing photography, MLS-ready.',
 '["HDR interior & exterior photos","MLS-ready delivery","Fast turnaround"]', 10),
('package','Listing Photos','2,000–3,500 sq ft', 22500,'1 hour on site',
 'HDR listing photography, MLS-ready.',
 '["HDR interior & exterior photos","MLS-ready delivery","Fast turnaround"]', 11),
('package','Listing Photos','3,500+ sq ft',      27500,'1.5 hours on site',
 'HDR listing photography, MLS-ready.',
 '["HDR interior & exterior photos","MLS-ready delivery","Fast turnaround"]', 12),

-- Tier 2 · Enhanced Listing
('package','Enhanced Listing','Under 2,000 sq ft', 27500,'1 hour on site',
 'Photos plus a 2D floor plan and social media kit.',
 '["HDR listing photos","2D floor plan","Social media post kit"]', 20),
('package','Enhanced Listing','2,000–3,500 sq ft', 32500,'1.5 hours on site',
 'Photos plus a 2D floor plan and social media kit.',
 '["HDR listing photos","2D floor plan","Social media post kit"]', 21),
('package','Enhanced Listing','3,500+ sq ft',      39900,'2 hours on site',
 'Photos plus a 2D floor plan and social media kit.',
 '["HDR listing photos","2D floor plan","Social media post kit"]', 22),

-- Tier 3 · Complete Listing
('package','Complete Listing','Under 2,000 sq ft', 42500,'2 hours on site',
 'Full photo coverage, drone aerials, virtual tour, 3D floor plan, social kit.',
 '["HDR listing photos","Drone aerial photography","Virtual tour","3D floor plan","Social media post kit"]', 30),
('package','Complete Listing','2,000–3,500 sq ft', 49900,'2.5 hours on site',
 'Full photo coverage, drone aerials, virtual tour, 3D floor plan, social kit.',
 '["HDR listing photos","Drone aerial photography","Virtual tour","3D floor plan","Social media post kit"]', 31),
('package','Complete Listing','3,500+ sq ft',      57500,'3 hours on site',
 'Full photo coverage, drone aerials, virtual tour, 3D floor plan, social kit.',
 '["HDR listing photos","Drone aerial photography","Virtual tour","3D floor plan","Social media post kit"]', 32),

-- Tier 4 · Signature Listing
('package','Signature Listing','Under 2,000 sq ft', 52500,'2.5 hours on site',
 'Everything in Complete, plus sun-mapped 3D floor plans.',
 '["HDR listing photos","Drone aerial photography","Virtual tour","3D floor plan with sun mapping","Social media post kit"]', 40),
('package','Signature Listing','2,000–3,500 sq ft', 59900,'3 hours on site',
 'Everything in Complete, plus sun-mapped 3D floor plans.',
 '["HDR listing photos","Drone aerial photography","Virtual tour","3D floor plan with sun mapping","Social media post kit"]', 41),
('package','Signature Listing','3,500+ sq ft',      69900,'3.5 hours on site',
 'Everything in Complete, plus sun-mapped 3D floor plans.',
 '["HDR listing photos","Drone aerial photography","Virtual tour","3D floor plan with sun mapping","Social media post kit"]', 42);

-- ── ADD-ONS ─────────────────────────────────────────────────────────────
insert into products (kind, name, price_cents, unit, description, sort_order) values
('addon','Drone Aerial Photos',          5000, null,        'Professional aerial drone photography.', 50),
('addon','Drone Boundary Lines',         2500, null,        'Property boundary overlay on aerial photos.', 51),
('addon','Virtual Twilight',             2000, 'per image', 'Dusk-style exterior enhancement.', 52),
('addon','Virtual Staging',              2000, 'per image', 'Digitally furnish vacant rooms.', 53),
('addon','Social Media Graphics',        2500, null,        'Branded social media post kit.', 54);
