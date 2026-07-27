import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const imageUrl = `${protocol}://${host}/og.png`;
  return {
    title: "Frizeo Oferte",
    description: "Oferte profesionale pentru orice tip de afacere.",
    icons: { icon: "/favicon.svg" },
    openGraph: {
      title: "Frizeo Oferte",
      description: "Creează, personalizează și trimite oferte profesionale.",
      images: [{ url: imageUrl, width: 1536, height: 1024, alt: "Frizeo Oferte" }],
    },
    twitter: { card: "summary_large_image", images: [imageUrl] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ro"><body>{children}</body></html>;
}
