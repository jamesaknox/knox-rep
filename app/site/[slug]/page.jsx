import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import PropertySite from "./PropertySite";

// Server component for the branded property site, rendered for the wildcard
// subdomain via middleware (242fykedr.knoxhd.com -> /site/242fykedr).
// No paywall, no watermark — this is the public marketing page.

async function getProperty(slug) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("galleries")
    .select("*, agent:agents(name, email, phone, headshot_url, brokerage), media(category, label, preview_path)")
    .eq("site_slug", slug)
    .single();
  return data;
}

// ── SEO: per-property <title>, description, Open Graph (social previews) ──
export async function generateMetadata({ params }) {
  const p = await getProperty(params.slug);
  if (!p) return { title: "Property Not Found" };
  const title = `${p.address}, ${p.city} ${p.state} | For Sale`;
  const desc =
    p.description?.slice(0, 155) ||
    `${p.beds ?? ""} bed, ${p.baths ?? ""} bath home for sale in ${p.city}, ${p.state}. Professional listing photography by Knox Creative.`;
  const url = `https://${params.slug}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      type: "website",
      siteName: "Knox Creative",
    },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}

export default async function SitePage({ params }) {
  const p = await getProperty(params.slug);
  if (!p) notFound();

  // ── Schema.org structured data so Google + AI search understand the listing.
  // SingleFamilyResidence + RealEstateListing give rich-result eligibility.
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: `${p.address}, ${p.city}, ${p.state} ${p.zip}`,
    description: p.description,
    url: `https://${params.slug}.${process.env.NEXT_PUBLIC_BASE_DOMAIN}`,
    datePosted: p.created_at,
    about: {
      "@type": "SingleFamilyResidence",
      address: {
        "@type": "PostalAddress",
        streetAddress: p.address,
        addressLocality: p.city,
        addressRegion: p.state,
        postalCode: p.zip,
        addressCountry: "US",
      },
      numberOfBedrooms: p.beds || undefined,
      numberOfBathroomsTotal: p.baths || undefined,
      floorSize: p.sqft ? { "@type": "QuantitativeValue", value: p.sqft, unitCode: "FTK" } : undefined,
      yearBuilt: p.year_built || undefined,
    },
    provider: {
      "@type": "ProfessionalService",
      name: "Knox Creative",
      image: "https://knoxhd.com/logo.png",
      areaServed: "East Tennessee",
    },
  };

  // The visual layout matches knox-property-site-prototype.jsx; the prototype is
  // the reference implementation. Hydrate it here with `p` (address, media, agent,
  // p.link_virtual_tour, p.link_floorplan_3d). Render the JSON-LD below in <head>.
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PropertySite property={p} />
    </>
  );
}
