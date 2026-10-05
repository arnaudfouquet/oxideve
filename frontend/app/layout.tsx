import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { LayoutShell } from "@/components/LayoutShell";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { siteDescription, siteName } from "@/lib/content";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: {
    default: `${siteName} | Organisme de formation professionnelle`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={nunito.variable}>
      <body>
        <LayoutShell header={<SiteHeader />} footer={<SiteFooter />}>
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}
