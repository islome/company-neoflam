import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { getStores } from "@/lib/stores";
import { AccountView } from "@/components/shop/account-view";

export async function generateMetadata({ params }: PageProps<"/[lang]/account">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { account } = await getDictionary(lang);
  return { title: `${account.title} · Neoflam`, robots: { index: false } };
}

export default async function AccountPage({ params }: PageProps<"/[lang]/account">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const [dict, stores] = await Promise.all([getDictionary(lang), getStores()]);

  return (
    <main id="main">
      <AccountView lang={lang} stores={stores} t={dict.account} shop={dict.shop} storesT={dict.stores} />
    </main>
  );
}
