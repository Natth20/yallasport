import { auth } from "@/lib/auth/auth";
import { canAccessAdminPath } from "@/lib/auth/admin-access";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { STREAMING_ENABLED } from "@/lib/streaming/flag";

const handleI18nRouting = createMiddleware(routing);

export default auth((req) => {
  const { nextUrl } = req;
  if (nextUrl.pathname === '/') {
    const cookieLocale = req.cookies.get('yalla-locale')?.value;
    const dest = cookieLocale === 'en' ? '/en' : '/ar';
    return NextResponse.redirect(new URL(dest, nextUrl));
  }
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const localeMatch = nextUrl.pathname.match(/^\/(ar|en)(?=\/|$)/);
  const locale = localeMatch?.[1] ?? routing.defaultLocale;
  const pathname = localeMatch
    ? nextUrl.pathname.slice(localeMatch[0].length) || "/"
    : nextUrl.pathname;

  if (pathname === "/video" || pathname.startsWith("/video/")) {
    return NextResponse.redirect(new URL(`/${locale}/videos`, nextUrl));
  }

  const listingsOnly = pathname === "/tv-guide" || pathname.startsWith("/tv-guide/");
  const licensedDesk =
    pathname === "/watch" ||
    pathname.startsWith("/watch/") ||
    pathname === "/vod" ||
    pathname.startsWith("/vod/");
  if (listingsOnly || (!STREAMING_ENABLED && licensedDesk)) {
    return NextResponse.redirect(new URL(`/${locale}/live`, nextUrl));
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const needsAccount =
    pathname === "/profile" ||
    pathname.startsWith("/profile/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/");

  if (needsAccount && !isLoggedIn) {
    const callback = pathname + (nextUrl.search || "");
    return NextResponse.redirect(
      new URL(`/${locale}/login?callbackUrl=${encodeURIComponent(callback)}`, nextUrl)
    );
  }

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/api/auth/signin", nextUrl));
    }

    // Role paths live in src/lib/auth/admin-access.ts (sidebar + middleware).
    const userRole = role as string;
    if (!canAccessAdminPath(userRole, pathname)) {
      return NextResponse.redirect(new URL(`/${locale}`, nextUrl));
    }
  }

  const response = handleI18nRouting(req);
  response.headers.set("x-ys-page", pathname);
  return response;
});

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)"
  ],
};
