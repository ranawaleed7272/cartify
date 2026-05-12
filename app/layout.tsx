import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import {
  ClerkProvider,
} from "@clerk/nextjs";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { getWebData } from "@/lib/api";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TechPulse | Smart Tech Gadgets Store", 
  description: "Best tech gadgets, laptops, and accessories",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const webData = await getWebData();

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ClientProviders webData={webData}>
            {children}
          </ClientProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}
