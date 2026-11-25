import { locales } from "@/i18n/config";

/**
 * Plain module (not "use client") so the root layout, a Server Component, receives the actual script text.
 * See home-scroll.tsx for what it does.
 */
export const homePath = new RegExp(`^/(${locales.join("|")})/?$`);

/**
 * Runs while the HTML is parsed, on every page:
 * - when the home page document is about to unload (reload, or leaving the site), turn off scroll restoration,
 *   so the browser does not bring back the old scroll position on the next load;
 * - when the loaded page is the home page, drop any #section from the address so the browser and Next.js do
 *   not jump to it, then turn scroll restoration back on after load so back/forward inside the site still work.
 */
export const HOME_SCROLL_SCRIPT = `(function(){try{
var home=${homePath};
addEventListener("pagehide",function(){if(home.test(location.pathname))history.scrollRestoration="manual"});
if(!home.test(location.pathname))return;
if(location.hash)history.replaceState(history.state,"",location.pathname+location.search);
history.scrollRestoration="manual";
addEventListener("load",function(){setTimeout(function(){history.scrollRestoration="auto"},500)});
}catch(e){}})();`;
