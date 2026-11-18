import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, locales, type Locale } from "@/i18n/config";

function preferredLocale(request: NextRequest): Locale {
  const header = request.headers.get("accept-language") ?? "";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of ranked) {
    if (hasLocale(lang)) return lang;
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // A file that doesn't exist (/apple-touch-icon.png from iPhones, /robots.txt…) would
  // otherwise reach [lang] with the file name as the locale and render the site's 404 from there.
  if (/\.[^/]*$/.test(pathname)) return new NextResponse(null, { status: 404 });

  const hasPrefix = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasPrefix) return;

  request.nextUrl.pathname = `/${preferredLocale(request)}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Skip API routes, Next internals and the real files: public/images, public/models,
  // .well-known and the app icons. Add a new top-level public file or folder here too.
  matcher: ["/((?!api|_next|images/|models/|\\.well-known/|favicon\\.ico|icon\\.svg).*)"],
};
