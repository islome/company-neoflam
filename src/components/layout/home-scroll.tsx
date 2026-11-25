"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { homePath } from "./home-scroll-script";

/**
 * The home page always opens at the hero.
 *
 * Section links ("Do‘konlar", "Do‘kon topish", ...) point at `/uz#stores` and friends. Left alone, the
 * `#stores` stays in the address bar and every reload jumps back down to that section, and browsers also
 * restore the old scroll position on reload. This file fixes both:
 *
 * 1. `HOME_SCROLL_SCRIPT` (home-scroll-script.ts) runs while the HTML is parsed (inline script in the root layout <head>).
 *    On a load or reload of the home page it drops the #hash and turns off the browser's scroll restoration
 *    for that load only, then switches it back on so the back and forward buttons keep working.
 * 2. `HomeScroll` makes section links on the home page scroll smoothly without adding a #hash, and removes
 *    the #hash after arriving from another page (for example "find a store" on a product page).
 */

const dropHash = () => history.replaceState(history.state, "", location.pathname + location.search);

export function HomeScroll() {
  const pathname = usePathname();
  const onHome = homePath.test(pathname);

  // Arrived on the home page with a #section (client navigation): Next.js scrolls there, then the hash goes.
  useEffect(() => {
    if (!onHome || !location.hash) return;
    const id = setTimeout(dropHash, 600);
    return () => clearTimeout(id);
  }, [onHome, pathname]);

  // On the home page, links to its own sections scroll smoothly and leave the address unchanged.
  useEffect(() => {
    if (!onHome) return;
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!link || link.getAttribute("target") === "_blank") return;
      const url = new URL((link as HTMLAnchorElement).href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
      const section = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!section) return;
      e.preventDefault(); // Next.js <Link> skips its own navigation for prevented clicks
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Wait a frame so a closing mobile menu can release the page scroll first.
      setTimeout(() => section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 50);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [onHome]);

  return null;
}
