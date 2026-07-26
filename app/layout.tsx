import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;
  return {
    title: "Electro Oferte · ElectricSmart",
    description: "Oferte electrice profesionale, calculate corect în câteva minute.",
    icons: { icon: "/favicon.svg" },
    openGraph: {
      title: "Electro Oferte",
      description: "Oferte electrice corecte, în câteva minute.",
      images: [{ url: imageUrl, width: 1536, height: 1024, alt: "Electro Oferte - aplicație de ofertare ElectricSmart" }],
    },
    twitter: { card: "summary_large_image", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ro"><body className={geist.variable}>{children}</body></html>;
}
