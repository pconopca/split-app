import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@coinbase/onchainkit/styles.css";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Split — pay your share in USDC on Base",
  description: "Split bills with friends in USDC, right inside the Base App.",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "1024x1024" }],
    apple: [{ url: "/icon.png", sizes: "1024x1024" }],
    shortcut: ["/icon.png"],
  },
  other: {
    // base.dev domain ownership verification — keep until the domain is
    // approved and listed in the Base App directory.
    "base:app_id": "6a1c4fa2ac7b22973145cfe4",
    // talent.app project verification — proves we own this domain for
    // Builder Score attribution.
    "talentapp:project_verification":
      "58d531a805ad91b09de4b5404255287995b7b8cdea9b73e056aaf3219e6751294616ba20af6e083f23076fcbcb9612a666f6b4e74f83ad1949dcfa51d15eb595",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
