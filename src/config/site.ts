/**
 * Single place for facts about the Uzbekistan branch.
 * Values wrapped in {{ }} are placeholders: replace them with confirmed details
 * before the site goes live. Nothing here should be guessed.
 */
import type { Locale } from "@/i18n/config";

export type Store = {
  id: string;
  /** "main" and "regional" label the two Tashkent stores. */
  kind: "main" | "regional" | null;
  city: Record<Locale, string>;
  name: string;
  address: string;
  hours: string;
  phone: string;
  /** Google or Yandex Maps link. Leave null until the address is confirmed. */
  mapUrl: string | null;
  /**
   * Map pin. Currently the city centre (approximate); replace with the exact
   * store coordinates once confirmed. null hides the pin.
   */
  lat: number | null;
  lng: number | null;
};

/** Fallback store list. Used when Supabase is not configured. */
export const stores: Store[] = [
  {
    id: "tashkent-main",
    kind: "main",
    city: { uz: "Toshkent", ru: "Ташкент", en: "Tashkent" },
    name: "Neoflam",
    address: "{{address}}",
    hours: "10:00 – 20:00",
    phone: "{{+998 phone}}",
    mapUrl: null,
    // Approximate: Tashkent City area. Replace with the exact store location.
    lat: 41.3138,
    lng: 69.2486,
  },
  {
    id: "tashkent-regional",
    kind: "regional",
    city: { uz: "Toshkent", ru: "Ташкент", en: "Tashkent" },
    name: "Neoflam",
    address: "{{address}}",
    hours: "10:00 – 20:00",
    phone: "{{+998 phone}}",
    mapUrl: null,
    // Approximate: Tashkent centre, placed apart from the main store. Replace with the exact store location.
    lat: 41.3111,
    lng: 69.2797,
  },
  {
    id: "samarkand",
    kind: null,
    city: { uz: "Samarqand", ru: "Самарканд", en: "Samarkand" },
    name: "Neoflam",
    address: "{{address}}",
    hours: "10:00 – 20:00",
    phone: "{{+998 phone}}",
    mapUrl: null,
    lat: 39.6542,
    lng: 66.9597,
  },
  {
    id: "namangan",
    kind: null,
    city: { uz: "Namangan", ru: "Наманган", en: "Namangan" },
    name: "Neoflam",
    address: "{{address}}",
    hours: "10:00 – 20:00",
    phone: "{{+998 phone}}",
    mapUrl: null,
    lat: 40.9983,
    lng: 71.6726,
  },
];

export const site = {
  name: "Neoflam Uzbekistan",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",

  branch: {
    address: "{{Tashkent office address}}",
    phone: "{{+998 phone}}",
    email: "{{email}}",
  },

  headquarters: {
    company: "Neoflam Inc.",
    address:
      "1, Gieopdosi-ro, Jijeong-myeon, Wonju-si, Gangwon-do, Republic of Korea",
  },

  media: {
    /**
     * Hero motion. Drop a Higgsfield AI export (mp4/webm) URL here and the hero
     * plays it in place of the hero product photo. Leave null to show the photo.
     */
    heroVideo: process.env.NEXT_PUBLIC_HERO_VIDEO_URL ?? null,
    brandFilm: "https://player.vimeo.com/video/893634142?h=07428c3f3a&autoplay=1",
    brandFilmCover: "https://neoflam.com/en/img/mov_cover.jpg",
  },

  links: {
    global: "https://neoflam.com/en",
    news: "https://neoflam.com/en/board/news.php",
    brands: {
      neoflam: "https://neoflam.com/en/about/brand/neoflam.php",
      betterfinger: "https://neoflam.com/en/about/brand/betterfinger.php",
      frenchbull: "https://neoflam.com/en/about/brand/frenchbull.php",
    },
    social: {
      instagram: "https://www.instagram.com/neoflam_korea/",
      facebook: "https://www.facebook.com/neoflamkorea",
      youtube: "https://www.youtube.com/channel/UCGBHqrr5vgPh8lbckTwvbXw",
    },
  },
} as const;
