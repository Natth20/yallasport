import React from "react";
import {Link} from "@/i18n/navigation";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import {getLocale} from "next-intl/server";
import {pick} from "@/i18n/pick";

/**
 * AdminLayout - Wraps all admin pages.
 * Includes a role-aware sidebar for RBAC enforcement at the UI level.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const session = await auth();
  
  if (!session) {
    redirect("/api/auth/signin");
  }

  const role = session.user?.role as string;

  // Permission Map for Sidebar Links
  const links = [
    { label: pick(locale, "الرئيسية", "Home"), href: "/admin", roles: ["SUPER_ADMIN", "EDITOR", "NEWS_EDITOR", "MODERATOR", "CONTENT_MANAGER", "ADS_MANAGER"] },
    { label: pick(locale, "إدارة الأخبار", "Manage news"), href: "/admin/news", roles: ["SUPER_ADMIN", "EDITOR", "NEWS_EDITOR", "MODERATOR"] },
    { label: pick(locale, "التقويم التحريري", "Editorial calendar"), href: "/admin/news/calendar", roles: ["SUPER_ADMIN", "EDITOR", "NEWS_EDITOR"] },
    { label: pick(locale, "إدارة التعليقات", "Manage comments"), href: "/admin/comments", roles: ["SUPER_ADMIN", "MODERATOR"] },
    { label: pick(locale, "صندوق المكتب", "Desk inbox"), href: "/admin/inbox", roles: ["SUPER_ADMIN", "MODERATOR", "EDITOR"] },
    { label: pick(locale, "لوحة المتصدرين", "Leaderboard"), href: "/leaderboard", roles: ["SUPER_ADMIN", "EDITOR", "NEWS_EDITOR", "MODERATOR", "CONTENT_MANAGER", "ADS_MANAGER"] },
    { label: pick(locale, "إدارة المباريات", "Manage matches"), href: "/admin/matches", roles: ["SUPER_ADMIN", "CONTENT_MANAGER"] },
    { label: pick(locale, "إدارة البطولات", "Manage leagues"), href: "/admin/leagues", roles: ["SUPER_ADMIN", "CONTENT_MANAGER"] },
    { label: pick(locale, "إدارة الأندية", "Manage teams"), href: "/admin/teams", roles: ["SUPER_ADMIN", "CONTENT_MANAGER"] },
    { label: pick(locale, "إدارة اللاعبين", "Manage players"), href: "/admin/players", roles: ["SUPER_ADMIN", "CONTENT_MANAGER"] },
    { label: pick(locale, "إدارة المحتوى", "Manage VOD"), href: "/admin/vod", roles: ["SUPER_ADMIN", "CONTENT_MANAGER"] },
    { label: pick(locale, "دليل القنوات", "TV Guide"), href: "/admin/tv-guide", roles: ["SUPER_ADMIN", "EDITOR"] },
    { label: pick(locale, "إدارة الإعلانات", "Manage ads"), href: "/admin/ads", roles: ["SUPER_ADMIN", "ADS_MANAGER"] },
    { label: pick(locale, "التراخيص", "Licenses"), href: "/admin/licenses", roles: ["SUPER_ADMIN"] },
    { label: pick(locale, "أصول البث", "Stream assets"), href: "/admin/streaming", roles: ["SUPER_ADMIN"] },
    { label: pick(locale, "الترجمات", "Translations"), href: "/admin/translations", roles: ["SUPER_ADMIN", "EDITOR", "NEWS_EDITOR"] },
    { label: pick(locale, "المستخدمون", "Users"), href: "/admin/users", roles: ["SUPER_ADMIN"] },
    { label: pick(locale, "مؤشرات الأداء", "KPIs"), href: "/admin/kpis", roles: ["SUPER_ADMIN"] },
  ];

  const filteredLinks = links.filter(link => link.roles.includes(role));

  return (
    <div className="flex h-screen bg-muted dark:bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-green text-white shadow-lg overflow-y-auto shrink-0">
        <div className="p-8">
          <h2 className="text-2xl font-black tracking-tighter">{pick(locale, "لوحة التحكم", "Dashboard")}</h2>
          <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest mt-1">{pick(locale, "لوحة يلا سبورت", "Yalla Sport Dashboard")}</p>
        </div>
        <nav className="mt-4 px-4 space-y-1">
          {filteredLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="block py-3 px-5 rounded-2xl transition-all duration-200 hover:bg-white/10 font-bold text-sm"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-6 mt-6 border-t border-white/10">
            <Link href="/" className="block py-3 px-5 rounded-2xl transition-all duration-200 hover:bg-orange-500 bg-orange-600 text-primary-foreground font-black text-center text-sm shadow-lg shadow-orange-900/20">
              {pick(locale, "العودة للموقع", "Back to site")}
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card dark:bg-muted shadow-sm z-20">
          <div className="max-w-7xl mx-auto py-5 px-8 flex justify-between items-center">
            <h1 className="text-xl font-black text-foreground dark:text-foreground">{pick(locale, "يلا سبورت", "Yalla Sport")}</h1>
            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-black block text-muted-foreground uppercase">{role}</span>
                <span className="text-sm font-bold text-foreground dark:text-foreground">{session.user?.name || pick(locale, "مدير النظام", "System administrator")}</span>
              </div>
              <button className="bg-red-50 dark:bg-red-950/20 text-red-600 px-4 py-2 rounded-xl text-xs font-black transition-colors hover:bg-red-100">
                {pick(locale, "تسجيل الخروج", "Sign out")}
              </button>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-10 bg-muted dark:bg-background">
          {children}
        </div>
      </main>
    </div>
  );
}
