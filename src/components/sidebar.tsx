"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Video,
  Users,
  Settings,
  Bot,
  BarChart3,
  Zap,
  Link2,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Дашборд", icon: LayoutDashboard },
  { href: "/webinars", label: "Вебинары", icon: Video },
  { href: "/leads", label: "CRM / Лиды", icon: Users },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/redirects", label: "Link Preview", icon: Link2 },
  { href: "/agent", label: "Настройки агента", icon: Bot },
  { href: "/settings", label: "Настройки", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-600 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Smart Bizon AI</p>
            <p className="text-xs text-gray-400">Webinar Agent</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-violet-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-gray-400">AI Агент активен</span>
        </div>
      </div>
    </aside>
  );
}
