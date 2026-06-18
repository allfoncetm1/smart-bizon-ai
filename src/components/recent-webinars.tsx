import { cn } from "@/lib/utils";
import Link from "next/link";

interface Webinar {
  id: string;
  title: string;
  status: string;
  viewersCount: number;
  createdAt: Date;
  analytics: {
    hotLeadsCount: number;
    purchasesCount: number;
    conversionRate: number;
    summary?: string | null;
  } | null;
}

const statusLabel: Record<string, { label: string; className: string }> = {
  DONE: { label: "Готово", className: "bg-green-500/10 text-green-400" },
  PROCESSING: { label: "Обработка", className: "bg-yellow-500/10 text-yellow-400" },
  PENDING: { label: "Ожидание", className: "bg-gray-500/10 text-gray-400" },
  ERROR: { label: "Ошибка", className: "bg-red-500/10 text-red-400" },
};

export function RecentWebinars({ webinars }: { webinars: Webinar[] }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-base font-semibold text-white mb-4">Последние вебинары</h2>
      {webinars.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">
          Нет вебинаров. Синхронизируйте данные из Bizon365.
        </p>
      ) : (
        <div className="space-y-3">
          {webinars.map((w) => {
            const status = statusLabel[w.status] ?? statusLabel.PENDING;
            return (
              <Link
                key={w.id}
                href={`/webinars/${w.id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{w.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(w.createdAt).toLocaleDateString("ru-RU")} ·{" "}
                    {w.viewersCount} зрителей
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {w.analytics && (
                    <>
                      <span className="text-xs text-red-400">
                        🔥 {w.analytics.hotLeadsCount}
                      </span>
                      <span className="text-xs text-green-400">
                        💰 {w.analytics.purchasesCount}
                      </span>
                    </>
                  )}
                  <span className={cn("text-xs px-2 py-1 rounded-full font-medium", status.className)}>
                    {status.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <Link href="/webinars" className="text-sm text-violet-400 hover:text-violet-300">
          Все вебинары →
        </Link>
      </div>
    </div>
  );
}
