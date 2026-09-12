import { auth } from "@/lib/auth/auth";
import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const localeMatch = nextUrl.pathname.match(/^\/(ar|en)(?=\/|$)/);
  const locale = localeMatch?.[1] ?? routing.defaultLocale;
  const pathname = localeMatch
    ? nextUrl.pathname.slice(localeMatch[0].length) || "/"
    : nextUrl.pathname;

  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/api/auth/signin", nextUrl));
    }

    // Role-Based Access Control Mapping
    const rolePermissions: Record<string, string[]> = {
      'SUPER_ADMIN': ['/admin'],
      'EDITOR': ['/admin/news', '/admin/tv-guide', '/admin/news/calendar', '/admin/translations', '/admin/inbox'],
      'NEWS_EDITOR': ['/admin/news', '/admin/news/calendar', '/admin/translations'],
      'ADS_MANAGER': ['/admin/ads'],
      'CONTENT_MANAGER': ['/admin/leagues', '/admin/teams', '/admin/players', '/admin/matches'],
      'MODERATOR': ['/admin/comments', '/admin/news', '/admin/inbox']
    };

    const userRole = role as string;
    const allowedPaths = rolePermissions[userRole] || [];
    
    // Super Admin can access everything under /admin
    if (userRole === 'SUPER_ADMIN') return handleI18nRouting(req);

    // Check if the current path is allowed for this role
    const isAllowed = allowedPaths.some(path => pathname.startsWith(path));

    if (!isAllowed) {
      return NextResponse.redirect(new URL(`/${locale}`, nextUrl));
    }
  }

  return handleI18nRouting(req);
});

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)"
  ],
};
