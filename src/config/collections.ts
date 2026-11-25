/**
 * Neoflam cookware collections shown in the home page carousel, in display order.
 *
 * Static for now: names and photos come from the official list at
 * https://neoflam.com/en/product/list.php?sch_cate=10008, with the photos saved in /public/images/collections.
 * This file will be replaced by a Supabase `collections` table later; keep the `Collection` shape
 * so the carousel does not need to change.
 */
import type { StaticImageData } from "next/image";
import fika from "../../public/images/collections/fika.jpg";
import retro from "../../public/images/collections/retro.jpg";
import bebe from "../../public/images/collections/bebe.jpg";
import danish from "../../public/images/collections/danish.jpg";
import bien from "../../public/images/collections/bien.jpg";
import chouChou from "../../public/images/collections/chou-chou.jpg";
import hej from "../../public/images/collections/hej.jpg";
import noblesse from "../../public/images/collections/noblesse.jpg";
import deChef from "../../public/images/collections/de-chef.jpg";

export type Collection = {
  slug: string;
  name: string;
  image: StaticImageData | string;
  /** Where "Explore" leads. The official collection page until the catalog can filter by collection. */
  href: string;
};

const page = (idx: number) => `https://neoflam.com/en/product/view.php?sch_cate=10008&idx=${idx}`;

export const collections: Collection[] = [
  { slug: "fika", name: "FIKA", image: fika, href: page(10050) },
  { slug: "retro", name: "Retro", image: retro, href: page(10062) },
  { slug: "bebe", name: "Bebe", image: bebe, href: page(10053) },
  { slug: "danish", name: "Danish", image: danish, href: page(10057) },
  { slug: "bien", name: "Bien", image: bien, href: page(10058) },
  { slug: "chou-chou", name: "Chou Chou", image: chouChou, href: page(10059) },
  { slug: "hej", name: "Hej", image: hej, href: page(10060) },
  { slug: "noblesse", name: "Noblesse", image: noblesse, href: page(10061) },
  { slug: "de-chef", name: "de Chef", image: deChef, href: page(10063) },
];
