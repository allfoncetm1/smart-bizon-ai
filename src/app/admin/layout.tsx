import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getRawSession } from "@/lib/auth";

// /admin — только для админов (по реальной, не подменённой «смотреть как» личности).
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getRawSession();
  if (!session?.isAdmin) redirect("/");
  return <>{children}</>;
}
