const SEGMENT_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  HOT: { label: "Горячие", color: "bg-red-500", emoji: "🔥" },
  WARM: { label: "Тёплые", color: "bg-yellow-500", emoji: "⚡" },
  COLD: { label: "Холодные", color: "bg-blue-500", emoji: "❄️" },
  PURCHASED: { label: "Купили", color: "bg-green-500", emoji: "💰" },
};

interface SegmentStat {
  segment: string;
  _count: number;
}

export function SegmentChart({
  stats,
  total,
}: {
  stats: SegmentStat[];
  total: number;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h2 className="text-base font-semibold text-white mb-4">Сегментация лидов</h2>
      {total === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">Нет данных</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(SEGMENT_CONFIG).map(([key, config]) => {
            const stat = stats.find((s) => s.segment === key);
            const count = stat?._count ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-300">
                    {config.emoji} {config.label}
                  </span>
                  <span className="text-sm font-medium text-white">
                    {count} <span className="text-gray-500 font-normal">({pct}%)</span>
                  </span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${config.color} rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          <div className="pt-2 border-t border-gray-800">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Итого лидов</span>
              <span className="text-white font-medium">{total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
