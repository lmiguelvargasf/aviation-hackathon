import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ApolloClientProvider from "@/lib/ApolloClientProvider.client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClearSky AI - Aviation Go/No-Go Assistant",
  description: "Deterministic risk scoring + dual AI copilots (You.com & Gemini) for intelligent flight safety decisions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ApolloClientProvider>{children}</ApolloClientProvider>
      </body>
    </html>
  );
}
