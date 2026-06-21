"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isRedirectPage = pathname.startsWith("/r/");
  const isLoginPage = pathname.startsWith("/login");

  if (isRedirectPage || isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 262, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <TopBar />
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px 40px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
