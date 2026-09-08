import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isSectionEnabled } from "@/lib/app-config";

export default async function LeadsLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session?.isAdmin && !(await isSectionEnabled("leads"))) redirect("/");
  return <>{children}</>;
}
