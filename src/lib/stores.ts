import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { stores as fallbackStores, type Store } from "@/config/site";
import { getSupabaseAdmin } from "@/lib/supabase/server";

type StoreRow = {
  slug: string;
  kind: Store["kind"];
  city_uz: string;
  city_ru: string;
  city_en: string;
  name: string;
  address: string;
  hours: string;
  phone: string;
  map_url: string | null;
  lat: number | null;
  lng: number | null;
};

/**
 * Store locations. Reads the Supabase `stores` table when it is configured and
 * has rows, otherwise falls back to the list in src/config/site.ts.
 */
export async function getStores(): Promise<Store[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("stores");

  const supabase = getSupabaseAdmin();
  if (!supabase) return fallbackStores;

  const { data, error } = await supabase
    .from("stores")
    .select("slug, kind, city_uz, city_ru, city_en, name, address, hours, phone, map_url, lat, lng")
    .eq("is_active", true)
    .order("sort_order");

  if (error || !data?.length) {
    if (error) console.error("[stores] Supabase query failed:", error.message);
    return fallbackStores;
  }

  return (data as StoreRow[]).map((r) => ({
    id: r.slug,
    kind: r.kind,
    city: { uz: r.city_uz, ru: r.city_ru, en: r.city_en },
    name: r.name,
    address: r.address,
    hours: r.hours,
    phone: r.phone,
    mapUrl: r.map_url,
    lat: r.lat,
    lng: r.lng,
  }));
}
