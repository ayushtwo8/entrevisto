import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";
import Providers from "./providers";
import Navbar from "@/components/ui/navbar";
import { SignedIn } from "@clerk/nextjs";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: 'ScreenAI: AI-Powered Interview Screening Platform',
  description: 'Hire smarter, faster - with AI powered interview screening.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <SignedIn>
            <Navbar />
          </SignedIn>
          {children}
        </Providers>
      </body>
    </html>
  );
}
