"use client";

import { useState, useEffect } from "react";
import { Save, Bot, MessageSquare, Users, Bell } from "lucide-react";

interface AgentConfig {
  id: string;
  isActive: boolean;
  moderationEnabled: boolean;
  filterSpam: boolean;
  filterMat: boolean;
  filterToxic: boolean;
  customBanWords: string[];
  autoAnswersEnabled: boolean;
  autoAnswerDelay: number;
  hotScoreThreshold: number;
  warmScoreThreshold: number;
  telegramEnabled: boolean;
  telegramChatId: string | null;
  notifyOnHotLead: boolean;
  notifyOnPurchase: boolean;
  productDescription: string | null;
  targetAudience: string | null;
  salesScript: string | null;
  customFaq: { question: string; answer: string }[] | null;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        checked ? "bg-violet-600" : "bg-gray-700"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="text-violet-400">{icon}</div>
        <h2 className="font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function AgentPage() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [projectId, setProjectId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [banWordsInput, setBanWordsInput] = useState("");
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((projects) => {
        if (projects[0]) {
          setProjectId(projects[0].id);
          return fetch(`/api/agent/config?projectId=${projects[0].id}`);
        }
      })
      .then((r) => r?.json())
      .then((c) => {
        if (c) {
          setConfig(c);
          setBanWordsInput((c.customBanWords ?? []).join(", "));
        }
      });
  }, []);

  function update<K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) {
    setConfig((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  async function save() {
    if (!config || !projectId) return;
    setSaving(true);
    try {
      const payload = {
        ...config,
        customBanWords: banWordsInput
          .split(",")
          .map((w) => w.trim())
          .filter(Boolean),
      };
      await fetch(`/api/agent/config?projectId=${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function addFaq() {
    if (!faqQuestion || !faqAnswer) return;
    const existing = config?.customFaq ?? [];
    update("customFaq", [...existing, { question: faqQuestion, answer: faqAnswer }]);
    setFaqQuestion("");
    setFaqAnswer("");
  }

  function removeFaq(i: number) {
    const existing = config?.customFaq ?? [];
    update("customFaq", existing.filter((_, idx) => idx !== i));
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Загрузка настроек агента...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Настройки AI Агента</h1>
          <p className="text-gray-400 mt-1">Настройте поведение агента под ваш вебинар</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saved ? "Сохранено ✓" : saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>

      {/* Общее */}
      <Section title="Статус агента" icon={<Bot className="w-4 h-4" />}>
        <ToggleRow
          label="Агент активен"
          description="Включить или выключить AI обработку вебинаров"
          checked={config.isActive}
          onChange={(v) => update("isActive", v)}
        />
      </Section>

      {/* Продукт */}
      <Section title="О вашем продукте" icon={<Bot className="w-4 h-4" />}>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Описание продукта</label>
          <textarea
            value={config.productDescription ?? ""}
            onChange={(e) => update("productDescription", e.target.value)}
            rows={3}
            placeholder="Опишите ваш продукт или услугу..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Целевая аудитория</label>
          <textarea
            value={config.targetAudience ?? ""}
            onChange={(e) => update("targetAudience", e.target.value)}
            rows={2}
            placeholder="Кто ваши клиенты..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Скрипт продаж / ключевые тезисы</label>
          <textarea
            value={config.salesScript ?? ""}
            onChange={(e) => update("salesScript", e.target.value)}
            rows={3}
            placeholder="Ключевые преимущества, цена, оффер..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
          />
        </div>
      </Section>

      {/* Модерация */}
      <Section title="Модерация чата" icon={<MessageSquare className="w-4 h-4" />}>
        <ToggleRow
          label="Включить модерацию"
          checked={config.moderationEnabled}
          onChange={(v) => update("moderationEnabled", v)}
        />
        {config.moderationEnabled && (
          <>
            <ToggleRow label="Фильтровать спам" checked={config.filterSpam} onChange={(v) => update("filterSpam", v)} />
            <ToggleRow label="Фильтровать мат и оскорбления" checked={config.filterMat} onChange={(v) => update("filterMat", v)} />
            <ToggleRow label="Фильтровать токсичные сообщения" checked={config.filterToxic} onChange={(v) => update("filterToxic", v)} />
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">
                Запрещённые слова (через запятую)
              </label>
              <input
                value={banWordsInput}
                onChange={(e) => setBanWordsInput(e.target.value)}
                placeholder="слово1, слово2, слово3"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </>
        )}
      </Section>

      {/* Авто-ответы */}
      <Section title="Автоматические ответы" icon={<MessageSquare className="w-4 h-4" />}>
        <ToggleRow
          label="Генерировать ответы на вопросы"
          description="AI будет анализировать вопросы и готовить ответы"
          checked={config.autoAnswersEnabled}
          onChange={(v) => update("autoAnswersEnabled", v)}
        />

        {/* FAQ */}
        <div>
          <p className="text-sm text-gray-400 mb-2">База FAQ (вопрос-ответ)</p>
          {(config.customFaq ?? []).map((item, i) => (
            <div key={i} className="flex gap-2 mb-2 text-sm">
              <div className="flex-1 bg-gray-800 rounded-lg px-3 py-2">
                <p className="text-violet-300">Q: {item.question}</p>
                <p className="text-gray-300 mt-0.5">A: {item.answer}</p>
              </div>
              <button
                onClick={() => removeFaq(i)}
                className="text-gray-500 hover:text-red-400 px-2"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="space-y-2 mt-2">
            <input
              value={faqQuestion}
              onChange={(e) => setFaqQuestion(e.target.value)}
              placeholder="Вопрос..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
            <input
              value={faqAnswer}
              onChange={(e) => setFaqAnswer(e.target.value)}
              placeholder="Ответ..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
            />
            <button
              onClick={addFaq}
              disabled={!faqQuestion || !faqAnswer}
              className="text-sm bg-gray-800 hover:bg-gray-700 text-violet-400 px-4 py-2 rounded-lg disabled:opacity-40"
            >
              + Добавить
            </button>
          </div>
        </div>
      </Section>

      {/* Скоринг */}
      <Section title="Сегментация лидов" icon={<Users className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">
              Порог Горячего лида (0-100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={config.hotScoreThreshold}
              onChange={(e) => update("hotScoreThreshold", parseInt(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
            />
            <p className="text-xs text-gray-500 mt-1">Минимальный балл для 🔥 горячего</p>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">
              Порог Тёплого лида (0-100)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={config.warmScoreThreshold}
              onChange={(e) => update("warmScoreThreshold", parseInt(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
            />
            <p className="text-xs text-gray-500 mt-1">Минимальный балл для ⚡ тёплого</p>
          </div>
        </div>
      </Section>

      {/* Telegram */}
      <Section title="Telegram уведомления" icon={<Bell className="w-4 h-4" />}>
        <ToggleRow
          label="Включить Telegram уведомления"
          checked={config.telegramEnabled}
          onChange={(v) => update("telegramEnabled", v)}
        />
        {config.telegramEnabled && (
          <>
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Chat ID</label>
              <input
                value={config.telegramChatId ?? ""}
                onChange={(e) => update("telegramChatId", e.target.value)}
                placeholder="-100123456789"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>
            <ToggleRow
              label="Уведомлять о горячих лидах"
              checked={config.notifyOnHotLead}
              onChange={(v) => update("notifyOnHotLead", v)}
            />
          </>
        )}
      </Section>
    </div>
  );
}
