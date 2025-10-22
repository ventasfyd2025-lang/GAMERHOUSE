import type { Metadata } from "next";
import Layout from "@/components/Layout";
import RetailHomepage from '@/components/home/RetailHomepage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "GAMERHOUSE - Tienda Gaming Online Chile",
  description: "Compra los mejores productos gaming y electrónicos con ofertas especiales. Componentes, accesorios gaming y más con envío a domicilio en todo Chile.",
  keywords: "gaming, tienda gaming, electrónicos, componentes pc, accesorios gaming, Chile, envío gratuito",
  authors: [{ name: "GAMERHOUSE" }],
  openGraph: {
    title: "GAMERHOUSE - Tienda Gaming Online Chile",
    description: "Compra los mejores productos gaming y electrónicos con ofertas especiales.",
    url: "https://gamerhouse.vercel.app",
    siteName: "GAMERHOUSE",
    images: [
      {
        url: "https://gamerhouse.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "GAMERHOUSE - Ofertas gaming especiales"
      }
    ],
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GAMERHOUSE - Tienda Gaming Online Chile",
    description: "Compra los mejores productos gaming con ofertas especiales.",
    images: ["https://gamerhouse.vercel.app/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return (
    <Layout>
      <RetailHomepage />
    </Layout>
  );
}
