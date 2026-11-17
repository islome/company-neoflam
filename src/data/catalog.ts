/**
 * Neoflam product collections, taken from the global catalog
 * (neoflam.com/en/product/list.php). Names, categories, taglines and cover
 * images come from that source. Colours were read from the product photos and
 * should be checked by the team. `addedAt` is the date each collection was
 * published on the global catalog; set the Uzbekistan arrival date when known.
 * Prices are null until the Uzbekistan price list is confirmed: the site shows
 * "price coming soon" for null.
 */
import type { Locale } from "@/i18n/config";

export const categoryKeys = ["cookware", "storage", "tableware", "gadget"] as const;
export type CategoryKey = (typeof categoryKeys)[number];

export const colorKeys = ["cream", "white", "yellow", "pink", "red", "black", "clear", "multi"] as const;
export type ColorKey = (typeof colorKeys)[number];

/** Swatch fill for each colour filter. `clear` and `multi` get special swatches. */
export const colorSwatch: Record<ColorKey, string> = {
  cream: "#ede3d1",
  white: "#ffffff",
  yellow: "#f2cf5b",
  pink: "#e9b8b0",
  red: "#b3261e",
  black: "#1a1a1a",
  clear: "transparent",
  multi: "conic",
};

/** Price buckets in UZS. Shown only once products carry prices. */
export const priceRanges = [
  { key: "0-300", min: 0, max: 300_000 },
  { key: "300-600", min: 300_000, max: 600_000 },
  { key: "600-1000", min: 600_000, max: 1_000_000 },
  { key: "1000+", min: 1_000_000, max: Infinity },
] as const;
export type PriceKey = (typeof priceRanges)[number]["key"];

export type Product = {
  slug: string;
  name: string;
  category: CategoryKey;
  colors: ColorKey[];
  /** Price in UZS. null until confirmed. */
  price: number | null;
  image: string;
  tagline: Record<Locale, string>;
  /** Lower comes first in the "featured" sort. */
  rank: number;
  /** Date the collection was added to the catalog (YYYY-MM-DD). Drives the "newest" sort. */
  addedAt: string;
};

const img = (path: string) => `https://neoflam.com/upload/product/${path}`;

export const products: Product[] = [
  {
    slug: "retro",
    name: "Retro",
    category: "cookware",
    colors: ["pink"],
    price: null,
    image: "/images/products/pots-window.jpg",
    tagline: {
      uz: "Qozon tamoyili bilan mazaliroq taomlar. Tosh shaklidagi tutqichda yashirin bug‘ teshigi bor.",
      ru: "Готовит по принципу котла для более насыщенного вкуса. В ручке в форме камешка спрятан клапан для пара.",
      en: "Cooks like a cauldron for richer flavour, with a steam vent hidden in its pebble shaped knob.",
    },
    rank: 1,
    addedAt: "2024-01-30",
  },
  {
    slug: "fika",
    name: "FIKA",
    category: "cookware",
    colors: ["cream"],
    price: null,
    image: img("202401/20240104113902_0A2E0.jpg"),
    tagline: { uz: "Kamroq, lekin yaxshiroq", ru: "Меньше, но лучше", en: "Less but better" },
    rank: 2,
    addedAt: "2024-01-04",
  },
  {
    slug: "bebe",
    name: "Bebe",
    category: "cookware",
    colors: ["yellow"],
    price: null,
    image: img("202401/20240115163613_5DEED.jpg"),
    tagline: { uz: "Baxtli bo‘lish vaqti", ru: "Время быть счастливым", en: "Time to be happy" },
    rank: 3,
    addedAt: "2024-01-15",
  },
  {
    slug: "danish",
    name: "Danish",
    category: "cookware",
    colors: ["multi"],
    price: null,
    image: img("202401/20240130100416_BAB5F.jpg"),
    tagline: { uz: "Makoningizni yangilang", ru: "Обновите свое пространство", en: "Rebuild your place" },
    rank: 4,
    addedAt: "2024-01-30",
  },
  {
    slug: "bien",
    name: "Bien",
    category: "cookware",
    colors: ["white"],
    price: null,
    image: img("202401/20240130102003_9FC48.jpg"),
    tagline: { uz: "Men izlagan idish, Bien", ru: "Та самая посуда, Bien", en: "The cookware I was looking for, Bien" },
    rank: 5,
    addedAt: "2024-01-30",
  },
  {
    slug: "chou-chou",
    name: "Chou Chou",
    category: "cookware",
    colors: ["cream"],
    price: null,
    image: img("202401/20240130102252_2CDA0.jpg"),
    tagline: {
      uz: "Chou Chou, oshxonamdagi yoqimli hamroh",
      ru: "Chou Chou, милый помощник на моей кухне",
      en: "Chou Chou, a lovely partner in my kitchen",
    },
    rank: 6,
    addedAt: "2024-01-30",
  },
  {
    slug: "hej",
    name: "Hej",
    category: "cookware",
    colors: ["multi"],
    price: null,
    image: img("202401/20240130102616_1FFFF.jpg"),
    tagline: { uz: "Baxtli kunning boshlanishi", ru: "Начало счастливого дня", en: "A beginning of happy day" },
    rank: 7,
    addedAt: "2024-01-30",
  },
  {
    slug: "noblesse",
    name: "Noblesse",
    category: "cookware",
    colors: ["black"],
    price: null,
    image: img("202401/20240130102848_A93F9.jpg"),
    tagline: {
      uz: "Har doimgidek va hech qachon bo‘lmaganidek",
      ru: "Как всегда и как никогда раньше",
      en: "Like always, like never before",
    },
    rank: 8,
    addedAt: "2024-01-30",
  },
  {
    slug: "de-chef",
    name: "de Chef",
    category: "cookware",
    colors: ["red", "black"],
    price: null,
    image: img("202401/20240130103336_536D6.jpg"),
    tagline: {
      uz: "Siz oshpazning kechki ziyofatiga taklif qilindingiz",
      ru: "Вы приглашены на ужин от шефа",
      en: "You're invited to the chef's dinner",
    },
    rank: 9,
    addedAt: "2024-01-30",
  },
  {
    slug: "perfect-seal-m",
    name: "Perfect Seal M",
    category: "storage",
    colors: ["clear"],
    price: null,
    image: img("202402/20240226092521_DE8CC.jpg"),
    tagline: {
      uz: "“Nega?” degan savoldan boshlangan yangilik",
      ru: "Инновация, которая началась с вопроса «почему?»",
      en: "Innovation that starts with asking why",
    },
    rank: 10,
    addedAt: "2024-02-26",
  },
  {
    slug: "glace",
    name: "Glacé",
    category: "storage",
    colors: ["clear"],
    price: null,
    image: img("202401/20240115162614_FEBB7.jpg"),
    tagline: { uz: "Yuqoridan pastgacha shisha", ru: "Стекло сверху донизу", en: "Glass from top to bottom" },
    rank: 11,
    addedAt: "2024-01-15",
  },
  {
    slug: "glace-z",
    name: "Glacé Z",
    category: "storage",
    colors: ["clear"],
    price: null,
    image: img("202401/20240115163243_C78BD.jpg"),
    tagline: { uz: "Havosiz va plastiksiz", ru: "Ноль воздуха и ноль пластика", en: "Zero air and zero plastic" },
    rank: 12,
    addedAt: "2024-01-15",
  },
  {
    slug: "fika-one",
    name: "FIKA ONE",
    category: "storage",
    colors: ["cream"],
    price: null,
    image: img("202401/20240115164130_177CB.jpg"),
    tagline: { uz: "Kamroq, lekin yaxshiroq", ru: "Меньше, но лучше", en: "Less but better" },
    rank: 13,
    addedAt: "2024-01-15",
  },
  {
    slug: "wavelock",
    name: "Wavelock",
    category: "storage",
    colors: ["clear"],
    price: null,
    image: img("202401/20240130100050_2AA9B.jpg"),
    tagline: { uz: "Yangilik to‘lqinida", ru: "На волне свежести", en: "Surf the fresh" },
    rank: 14,
    addedAt: "2024-01-30",
  },
  {
    slug: "smart-seal",
    name: "Smart Seal",
    category: "storage",
    colors: ["clear"],
    price: null,
    image: img("202401/20240130103917_EB7BA.jpg"),
    tagline: { uz: "Aqlli hayot, aqlli qopqoq", ru: "Умная жизнь, умная крышка", en: "Smart life, smart seal" },
    rank: 15,
    addedAt: "2024-01-30",
  },
  {
    slug: "milan",
    name: "Milan",
    category: "tableware",
    colors: ["white"],
    price: null,
    image: img("202401/20240115164041_A6DB5.jpg"),
    tagline: {
      uz: "Mohiyatdagi go‘zallik, zamonaviy hunarmandchilik",
      ru: "Красота в сути, современное мастерство",
      en: "The beauty found in essence, contemporary craft",
    },
    rank: 16,
    addedAt: "2024-01-15",
  },
  {
    slug: "casa",
    name: "Casa",
    category: "gadget",
    colors: ["multi"],
    price: null,
    image: img("202401/20240130131143_A35DB.jpg"),
    tagline: { uz: "Uydek joy yo‘q", ru: "Нет места лучше дома", en: "There's no place like home" },
    rank: 17,
    addedAt: "2024-01-30",
  },
  {
    slug: "biju",
    name: "BIJU",
    category: "gadget",
    colors: ["multi"],
    price: null,
    image: img("202401/20240130133154_07404.jpg"),
    tagline: { uz: "Oddiy va ixcham", ru: "Просто и компактно", en: "Simple and slim" },
    rank: 18,
    addedAt: "2024-01-30",
  },
];
