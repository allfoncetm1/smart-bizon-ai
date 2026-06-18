"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRedirectPage = pathname.startsWith("/r/");
  const isLoginPage = pathname.startsWith("/login");

  if (isRedirectPage || isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}
