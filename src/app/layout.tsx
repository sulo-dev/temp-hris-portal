// src/app/layout.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Outfit,
  Plus_Jakarta_Sans,
  JetBrains_Mono,
} from "next/font/google";
import { Toaster } from "sonner";
import { FloatingTopbar } from "@/components/layout/floating-topbar";
import { SpatialBackdrop } from "@/components/motion/motion-primitives";
import { SuloPageSkeleton } from "@/components/layout/sulo-page-skeleton";
import "./globals.css";

const fontDisplay = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700"],
});

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SuloHR v3.0 — Spatial Enterprise HRIS & Self-Service Platform",
  description:
    "Platform manajemen SDM modern PT Sulo dengan antarmuka Arctic Spatial Glassmorphism, RBAC Zero-Trust, dan Automated Payroll Engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
    >
      <body className="bg-sulo-canvas font-sans min-h-[100dvh] text-slate-900 antialiased">
        <SpatialBackdrop />

        <Suspense fallback={null}>
          <FloatingTopbar />
        </Suspense>

        <Suspense fallback={<SuloPageSkeleton />}>
          <main className="min-h-[100dvh]">{children}</main>
        </Suspense>

        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}