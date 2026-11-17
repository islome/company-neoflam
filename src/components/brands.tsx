import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import { site } from "@/config/site";
import { Reveal } from "./reveal";

const brands = [
  { key: "neoflam", name: "Neoflam", n: 1 },
  { key: "betterfinger", name: "Betterfinger", n: 2 },
  { key: "frenchbull", name: "French Bull", n: 3 },
] as const;

export function Brands({ t }: { t: Dictionary["brands"] }) {
  return (
    <section id="brands" aria-labelledby="brands-title" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <h2 id="brands-title" className="heading-3 md:heading-2 text-brand">
            {t.title}
          </h2>
          <p className="title-1 mt-4 text-ink">{t.subtitle}</p>
        </Reveal>

        <ul className="mt-12 grid gap-6 sm:grid-cols-3">
          {brands.map((b, i) => (
            <li key={b.key}>
              <Reveal delay={i * 0.06}>
                <a
                  href={site.links.brands[b.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-3xl border border-line p-2 transition-[border-color,transform] duration-300 hover:border-ink/30 active:scale-[0.98]"
                >
                  <span className="relative block aspect-[392/180] overflow-hidden rounded-2xl bg-cream">
                    <Image
                      src={`https://neoflam.com/en/img/our_brand_banner${b.n}.png`}
                      alt={b.name}
                      fill
                      sizes="(min-width: 640px) 360px, 100vw"
                      className="object-cover transition-opacity duration-500 group-hover:opacity-0"
                    />
                    <Image
                      src={`https://neoflam.com/en/img/our_brand_banner${b.n}_on.png`}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 360px, 100vw"
                      className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />
                  </span>
                  <span className="flex items-center justify-between px-2 pt-4 pb-2">
                    <span className="title-2 text-ink">{b.name}</span>
                    <span className="caption-1 inline-flex items-center gap-1 text-ink-soft transition-colors duration-300 group-hover:text-brand">
                      {t.cta}
                      <ArrowUpRight weight="bold" className="size-4" />
                    </span>
                  </span>
                </a>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
