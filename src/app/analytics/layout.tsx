import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isSectionEnabled } from "@/lib/app-config";

export default async function AnalyticsLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session?.isAdmin && !(await isSectionEnabled("analytics"))) redirect("/");
  return <>{children}</>;
}
