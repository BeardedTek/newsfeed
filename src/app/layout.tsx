import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Flowbite } from "flowbite-react";
import Navbar from "@/components/navbar/Navbar";
import { Footer } from "flowbite-react";
import PlausibleScript from "@/components/PlausibleScript";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NewsFeed",
  description: "NewsFeed: News Without Algorithms",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#2b5797" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className + " bg-gray-50 dark:bg-gray-900"}>
        <PlausibleScript />
        <Flowbite>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <Navbar />
            <main className="container mx-auto px-4 py-4 flex-1 dark:text-white">
              {children}
            </main>
          </div>
        </Flowbite>
      </body>
    </html>
  );
} 