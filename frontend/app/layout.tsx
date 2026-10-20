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

const siteUrl = process.env.SITE_URL || "http://localhost:3000";
const defaultTitle = `${siteName} | Organisme de formation professionnelle`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  // Canonique par défaut : chaque page peut la redéfinir pour la sienne.
  alternates: { canonical: "/" },
  // Aperçus de partage, absents jusqu'ici sur tout le site.
  openGraph: {
    type: "website",
    siteName,
    locale: "fr_FR",
    title: defaultTitle,
    description: siteDescription,
    url: siteUrl,
    images: ["/assets/home/illustration-home.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: siteDescription,
    images: ["/assets/home/illustration-home.png"],
  },
};

/**
 * Données structurées communes à tout le site : l'organisme de formation et le
 * site lui-même. Elles aident Google à rattacher les pages à l'entité Oxideve.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": `${siteUrl}/#organisation`,
      name: siteName,
      description: siteDescription,
      url: siteUrl,
      telephone: "+33636445593",
      email: "contact@oxideve.com",
      address: {
        "@type": "PostalAddress",
        streetAddress: "39 avenue Jean François Champollion",
        postalCode: "31100",
        addressLocality: "Toulouse",
        addressCountry: "FR",
      },
      areaServed: "FR",
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#site`,
      name: siteName,
      url: siteUrl,
      inLanguage: "fr-FR",
      publisher: { "@id": `${siteUrl}/#organisation` },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={nunito.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <LayoutShell header={<SiteHeader />} footer={<SiteFooter />}>
          {children}
        </LayoutShell>
      </body>
    </html>
  );
}
