import type { Metadata } from "next";
import Layout from "@/components/Layout";
import HunterCardHomepage from '@/components/home/HunterCardHomepage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "HunterCard TCG - Siempre los mejores precios en TCG",
  description: "La mejor y más confiable tienda de Trading Card Games en Chile. Pokémon TCG, One Piece, Star Wars Unlimited, Yu-Gi-Oh!, Dragon Ball, Digimon, Magic The Gathering y más. Envío a todo Chile.",
  keywords: "TCG, trading card games, pokémon, one piece, yu-gi-oh, magic the gathering, dragon ball, digimon, star wars, Chile, comprar cartas",
  authors: [{ name: "HunterCard TCG" }],
  openGraph: {
    title: "HunterCard TCG - Siempre los mejores precios en TCG",
    description: "La mejor tienda de Trading Card Games en Chile. Pokémon, One Piece, Yu-Gi-Oh! y más.",
    url: "https://huntercardtcg.vercel.app",
    siteName: "HunterCard TCG",
    images: [
      {
        url: "https://huntercardtcg.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "HunterCard TCG - Tienda de Trading Card Games"
      }
    ],
    locale: "es_CL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HunterCard TCG - Siempre los mejores precios en TCG",
    description: "La mejor tienda de Trading Card Games en Chile",
    images: ["https://huntercardtcg.vercel.app/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return (
    <Layout>
      <HunterCardHomepage />
    </Layout>
  );
}
