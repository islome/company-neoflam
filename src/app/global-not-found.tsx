import type { Metadata } from "next";
import Link from "next/link";
import { Changa_One, Manrope } from "next/font/google";
import uz from "@/i18n/dictionaries/uz";
import { Logo } from "@/components/layout/logo";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "600"],
});

const changaOne = Changa_One({
  variable: "--font-changa-one",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: `404 · ${uz.notFound.title}`,
};

export default function GlobalNotFound() {
  return (
    <html
      lang="uz-Latn"
      className={`${manrope.variable} ${changaOne.variable} antialiased`}
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-svh flex-col items-center justify-center gap-6 bg-sun px-4 text-center">
        <Logo className="h-5 w-auto text-brand" />
        <p className="font-[family-name:var(--heading-font)] text-9xl leading-none text-white">404</p>
        <h1 className="heading-4 text-ink">{uz.notFound.title}</h1>
        <p className="body-3 max-w-sm text-ink/80">{uz.notFound.body}</p>
        <Link
          href="/uz"
          className="button-md rounded-full bg-brand px-6 py-3 text-white transition-[background-color,transform] duration-300 hover:bg-brand-deep active:scale-[0.98]"
        >
          {uz.notFound.cta}
        </Link>
      </body>
    </html>
  );
}
