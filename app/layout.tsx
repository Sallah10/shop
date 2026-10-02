import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { CartProvider } from "@/components/cart/CartProvider";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { getSiteUrl } from "@/lib/site";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Northbound, a small shop for well made everyday things",
    template: "%s | Northbound",
  },
  description:
    "Northbound sells a short list of everyday things we use ourselves: stoneware dinner sets, linen bedding, cast iron pans and more. Free shipping over $75.",
  applicationName: "Northbound",
  keywords: ["homeware", "kitchen", "linen bedding", "cast iron", "small shop"],
  openGraph: {
    type: "website",
    siteName: "Northbound",
    locale: "en_US",
    images: [
      {
        url: "/og.jpg",
        width: 1424,
        height: 752,
        alt: "Northbound, a small shop for well made everyday things",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
