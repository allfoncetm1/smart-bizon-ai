import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: "blue" | "red" | "green" | "violet";
  subtitle?: string;
}

const colorMap = {
  blue: "bg-blue-500/10 text-blue-400",
  red: "bg-red-500/10 text-red-400",
  green: "bg-green-500/10 text-green-400",
  violet: "bg-violet-500/10 text-violet-400",
};

export function StatsCard({ title, value, icon, color, subtitle }: StatsCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-400">{title}</p>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", colorMap[color])}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
