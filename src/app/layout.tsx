import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarWrapper } from "@/components/sidebar-wrapper";

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Smart Bizon AI — AI Webinar Agent",
  description: "Платформа автоматизации вебинаров на базе искусственного интеллекта",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <SidebarWrapper>{children}</SidebarWrapper>
      </body>
    </html>
  );
}
