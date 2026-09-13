import type { Metadata } from "next";
import "../globals.css";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { SettingsProvider } from "@/lib/context/SettingsContext";
import { PWAInstallPrompt } from "@/components/layout/PWAInstallPrompt";
import { LiveStatusProvider } from "@/lib/context/LiveStatusContext";
import { PageShell } from "@/components/motion/PageMotion";
import { routing } from "@/i18n/routing";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  CONTACT_EMAIL,
  SITE_NAME,
  SITE_URL,
  THEME_COLOR,
  defaultDescription,
  defaultKeywords,
  defaultTitle,
  ogLocale,
  siteGraph,
} from "@/lib/seo/site";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = defaultTitle(locale);
  const description = defaultDescription(locale);
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: locale === "ar" ? `%s | يلا سبورت` : `%s | Yalla Sport`,
    },
    description,
    applicationName: SITE_NAME,
    keywords: defaultKeywords(locale),
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "sports",
    classification: locale === "ar" ? "رياضة، كرة قدم، نتائج مباشرة" : "Sports, football, live scores",
    referrer: "strict-origin-when-cross-origin",
    formatDetection: { telephone: false, email: false, address: false },
    icons: {
      icon: [
        { url: "/icon.png", type: "image/png" },
        { url: "/images/logo.jpg", type: "image/jpeg" },
      ],
      apple: [{ url: "/apple-icon.png", type: "image/png" }],
      shortcut: "/images/logo.jpg",
    },
    manifest: "/manifest.json",
    other: {
      "msapplication-TileColor": THEME_COLOR,
    },
    alternates: {
      languages: {
        ar: "/ar",
        en: "/en",
        "x-default": "/ar",
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      siteName: SITE_NAME,
      locale: ogLocale(locale),
      alternateLocale: locale === "ar" ? ["en_US"] : ["ar_EG"],
      type: "website",
      emails: [CONTACT_EMAIL],
      images: [
        {
          url: "/images/logo.jpg",
          width: 1200,
          height: 1200,
          alt: locale === "ar" ? "شعار يلا سبورت" : "Yalla Sport logo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/logo.jpg"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="h-full scroll-smooth dark" data-scroll-behavior="smooth">
      <head>
        <meta name="theme-color" content={THEME_COLOR} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col font-sans antialiased transition-colors duration-300">
        <JsonLd data={siteGraph(locale)} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LanguageProvider>
            <ThemeProvider>
              <SettingsProvider>
                <LiveStatusProvider>
                  <Header />
                  <main className="flex-grow pt-[4.65rem]">
                    <PageShell>{children}</PageShell>
                  </main>
                  <Footer />
                  <CookieConsent />
                  <PWAInstallPrompt />
                </LiveStatusProvider>
              </SettingsProvider>
            </ThemeProvider>
          </LanguageProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
