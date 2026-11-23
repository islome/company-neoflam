import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import { site } from "@/config/site";
import { Reveal } from "@/components/ui/reveal";

// Matches the order of dictionary news items.
const sources = [
  {
    href: "https://neoflam.com/en/board/news_view.php?idx=10257",
    img: "https://neoflam.com/upload/board/list/202502/20250205085256_2C1BC.png",
  },
  {
    href: "https://neoflam.com/en/board/news_view.php?idx=10254",
    img: "https://neoflam.com/upload/board/list/202406/20240619070344_5B8DD.png",
  },
  {
    href: "https://neoflam.com/en/board/news_view.php?idx=10253",
    img: "https://neoflam.com/upload/board/list/202406/20240619070125_EE756.png",
  },
];

export function News({ t }: { t: Dictionary["news"] }) {
  return (
    <section id="news" aria-labelledby="news-title" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="news-title" className="heading-3 md:heading-2 text-ink">
            {t.title}
          </h2>
          <a
            href={site.links.news}
            target="_blank"
            rel="noopener noreferrer"
            className="button-sm group inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-white transition-[background-color,transform] duration-300 hover:bg-brand-deep active:scale-[0.98]"
          >
            {t.cta}
            <ArrowRight weight="bold" className="size-4 transition-transform duration-500 group-hover:translate-x-1" />
          </a>
        </Reveal>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {t.items.map((item, i) => (
            <Reveal key={item.date} delay={i * 0.06}>
              <article className="group">
                <a href={sources[i].href} target="_blank" rel="noopener noreferrer" className="block rounded-3xl">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-cream">
                    <Image
                      src={sources[i].img}
                      alt={item.title}
                      fill
                      sizes="(min-width: 768px) 360px, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="caption-3 mt-6 text-brand">{item.category}</p>
                  <h3 className="title-2 mt-2 text-ink transition-colors duration-300 group-hover:text-brand">
                    {item.title}
                  </h3>
                  <time dateTime={item.date.replaceAll(".", "-")} className="caption-5 mt-2 block text-ink-soft">
                    {item.date}
                  </time>
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
