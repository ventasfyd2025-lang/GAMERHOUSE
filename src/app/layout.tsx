import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import CartProviderClient from "@/components/CartProviderClient";
import ChatProvider from "@/components/ChatProvider";
import { I18nProvider } from "@/context/I18nContext";
import { NotificationProvider } from "@/context/NotificationContext";
import NotificationDisplay from "@/components/NotificationDisplay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HunterCard TCG - Siempre los mejores precios en TCG",
  description: "La mejor y más confiable tienda de Trading Card Games en Chile. Pokémon TCG, One Piece, Star Wars Unlimited, Yu-Gi-Oh!, Dragon Ball, Digimon, Magic The Gathering y más. Envío a todo Chile.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="lazyOnload"
        />
        <I18nProvider>
          <NotificationProvider>
            <CartProviderClient>
              {children}
              <ChatProvider />
              <NotificationDisplay />
            </CartProviderClient>
          </NotificationProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
