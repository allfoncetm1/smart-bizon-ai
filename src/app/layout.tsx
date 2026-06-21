import type { Metadata } from "next";
import { Golos_Text } from "next/font/google";
import "./globals.css";
import { SidebarWrapper } from "@/components/sidebar-wrapper";

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-golos",
});

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
      <body className={`${golos.className} min-h-screen`} style={{ background: "var(--bg)", color: "var(--text)", WebkitFontSmoothing: "antialiased" }}>
        <SidebarWrapper>{children}</SidebarWrapper>
      </body>
    </html>
  );
}
