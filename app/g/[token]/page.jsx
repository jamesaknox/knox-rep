import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import GalleryClient from "./GalleryClient";

export const dynamic = "force-dynamic";

async function getGallery(token) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("galleries")
    .select(
      "id, token, address, city, state, zip, sqft, paid, total_cents, deposit_cents, status, " +
      "link_virtual_tour, link_floorplan_3d, link_property_site, site_slug, " +
      "agent:agents(name, email, phone), " +
      "media(id, category, label, preview_path, sort_order)"
    )
    .eq("token", token)
    .single();
  return data;
}

export async function generateMetadata({ params }) {
  const g = await getGallery(params.token);
  if (!g) return { title: "Gallery Not Found" };
  return { title: `${g.address} · Knox Creative` };
}

export default async function GalleryPage({ params }) {
  const gallery = await getGallery(params.token);
  if (!gallery) notFound();

  // build public preview URLs for each media item
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const media = (gallery.media || [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((m) => ({
      ...m,
      previewUrl: `${supabaseUrl}/storage/v1/object/public/kc-previews/${m.preview_path}`,
    }));

  return (
    <GalleryClient
      gallery={gallery}
      media={media}
      squareAppId={process.env.NEXT_PUBLIC_SQUARE_APP_ID}
      squareLocationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID}
      baseDomain={process.env.NEXT_PUBLIC_BASE_DOMAIN}
    />
  );
}
