import {
  ArrowUp,
  ArrowUpRight,
  FacebookLogo,
  InstagramLogo,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";
import type { Dictionary } from "@/i18n/dictionaries/uz";
import { site } from "@/config/site";
import { Logo } from "./logo";

export function SiteFooter({ t }: { t: Dictionary["footer"] }) {
  const social = [
    { href: site.links.social.instagram, label: "Instagram", icon: InstagramLogo },
    { href: site.links.social.facebook, label: "Facebook", icon: FacebookLogo },
    { href: site.links.social.youtube, label: "YouTube", icon: YoutubeLogo },
  ];

  return (
    <footer className="bg-brand text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex items-center justify-between gap-6">
          <Logo className="h-6 w-auto text-white" />
          <a
            href="#top"
            className="button-sm inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 transition-colors duration-300 hover:bg-white/20 active:scale-[0.98]"
          >
            <ArrowUp weight="bold" className="size-4" />
            {t.top}
          </a>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h2 className="caption-3 text-white/70">{t.branch}</h2>
            <address className="body-6 mt-4 flex flex-col gap-1 not-italic">
              <span>{site.branch.address}</span>
              <span>{site.branch.phone}</span>
              <span>{site.branch.email}</span>
            </address>
          </div>
          <div>
            <h2 className="caption-3 text-white/70">{t.hq}</h2>
            <address className="body-6 mt-4 flex flex-col gap-1 not-italic">
              <span>{site.headquarters.company}</span>
              <span>{site.headquarters.address}</span>
            </address>
          </div>
          <div>
            <h2 className="caption-3 text-white/70">{t.follow}</h2>
            <ul className="mt-4 flex gap-2">
              {social.map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors duration-300 hover:bg-white/20 active:scale-[0.98]"
                  >
                    <Icon weight="fill" className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-start gap-2">
            <a
              href={site.links.global}
              target="_blank"
              rel="noopener noreferrer"
              className="title-4 inline-flex items-center gap-1 rounded-sm hover:underline"
            >
              {t.global}
              <ArrowUpRight weight="bold" className="size-4" />
            </a>
          </div>
        </div>

        <p className="caption-5 mt-12 border-t border-white/20 pt-6 text-white/70">
          © {t.rights}
        </p>
      </div>
    </footer>
  );
}
