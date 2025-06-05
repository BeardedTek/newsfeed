import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Flowbite } from "flowbite-react";
import Providers from "@/components/providers/Providers";
import Navbar from "@/components/navbar/Navbar";
import { Footer } from "flowbite-react";
import PlausibleScript from "@/components/PlausibleScript";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NewsFeed",
  description: "Your personalized news feed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PlausibleScript />
        <Providers>
          <Flowbite>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Navbar />
              <main className="container mx-auto px-4 py-4 flex-1">
                {children}
              </main>
              <Footer container className="bg-white border-t border-gray-200">
                <div className="w-full flex flex-col md:flex-row items-center md:items-center justify-between gap-2 px-4">
                  <div className="text-left w-full md:w-auto">
                    <Footer.Copyright href="/" by="NewsFeed" year={new Date().getFullYear()} />
                  </div>
                  <div className="flex w-full md:w-auto justify-end">
                    <Footer.LinkGroup>
                      <Footer.Link href="https://github.com/beardedtek/newsfeed">GitHub</Footer.Link>
                      <Footer.Link href="/about">About</Footer.Link>
                      <Footer.Link href="/privacy">Privacy Policy</Footer.Link>
                      <Footer.Link href="/contact">Contact</Footer.Link>
                    </Footer.LinkGroup>
                  </div>
                </div>
              </Footer>
            </div>
          </Flowbite>
        </Providers>
      </body>
    </html>
  );
} 