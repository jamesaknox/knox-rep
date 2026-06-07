import { NextResponse } from "next/server";

// Maps a property subdomain to the internal /site/<slug> route.
//   242fykedr.knoxhd.com           -> /site/242fykedr
//   knoxhd.com / www.knoxhd.com    -> untouched (app, admin, galleries)
//
// Vercel routes *.knoxhd.com to this app; middleware inspects the Host header
// and rewrites property subdomains. Reserved subdomains (www, app, admin) are
// passed through so they don't get treated as property slugs.
const ROOT = process.env.NEXT_PUBLIC_BASE_DOMAIN || "knoxhd.com";
const RESERVED = new Set(["www", "app", "admin", "api", ""]);

export function middleware(req) {
  const host = (req.headers.get("host") || "").split(":")[0];
  const url = req.nextUrl;

  // strip the root domain to see if there's a property subdomain in front
  if (host.endsWith(ROOT)) {
    const sub = host.slice(0, host.length - ROOT.length).replace(/\.$/, "");
    if (sub && !RESERVED.has(sub)) {
      // already-internal paths shouldn't be double-rewritten
      if (!url.pathname.startsWith("/site/")) {
        url.pathname = `/site/${sub}${url.pathname === "/" ? "" : url.pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  // run on everything except static assets / API
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
