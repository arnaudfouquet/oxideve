import type { Metadata } from "next";
import { headers } from "next/headers";
import { Poppins } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { siteDescription, siteName } from "@/lib/content";
import "./globals.css";

const displayFont = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const bodyFont = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: `${siteName} | Formations énergie et BTP`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-next-pathname") || headerStore.get("x-invoke-path") || "";
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <html lang="fr" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        {isAdminRoute ? null : <SiteHeader />}
        <main>{children}</main>
        {isAdminRoute ? null : <SiteFooter />}
      </body>
    </html>
  );
}
