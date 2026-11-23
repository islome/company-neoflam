import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import { getStores } from "@/lib/stores";
import { Reveal } from "@/components/ui/reveal";
import { StoreLocator } from "@/components/stores/store-locator";

export async function Stores({ t, lang }: { t: Dictionary["stores"]; lang: Locale }) {
  const stores = await getStores();

  return (
    <section id="stores" aria-labelledby="stores-title" className="bg-sun py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="caption-3 text-brand">{t.eyebrow}</p>
          <h2 id="stores-title" className="heading-3 md:heading-2 mt-4 text-ink">
            {t.title}
          </h2>
          <p className="body-3 mt-6 max-w-[560px] text-ink/80">{t.subtitle}</p>
        </Reveal>

        <Reveal delay={0.08} className="mt-12">
          <StoreLocator stores={stores} t={t} lang={lang} />
        </Reveal>
      </div>
    </section>
  );
}
