import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isSectionEnabled } from "@/lib/app-config";

// Раздел может быть закрыт («Скоро») из /admin — тогда пускаем только админов.
export default async function WebinarsLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session?.isAdmin && !(await isSectionEnabled("webinars"))) redirect("/");
  return <>{children}</>;
}
