import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CommandPalette } from "@/components/features/search/command-palette";
import { getCollections } from "@/features/collections/actions";
import { CollectionList } from "@/features/collections/components/collection-list";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "PromptRepo",
  description: "Git for Prompts",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: collections } = await getCollections();

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground flex h-screen overflow-hidden`}
      >
        <aside className="w-64 border-r border-[#16161D] bg-[#1F1F28] p-4 hidden md:block">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-[#DCD7BA]">PromptRepo</h1>
          </div>
          <CollectionList collections={collections || []} />
        </aside>
        <div className="flex-1 flex flex-col overflow-hidden">
          {children}
        </div>
        <CommandPalette />
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
