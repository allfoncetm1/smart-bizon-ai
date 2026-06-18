"use client";

import { useState, useEffect } from "react";
import { Link2, Copy, Trash2, Plus, ExternalLink, ToggleLeft, ToggleRight, Eye, Pencil, X, Check, Upload } from "lucide-react";

interface LinkRedirect {
  id: string;
  slug: string;
  destinationUrl: string;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  clicks: number;
  isActive: boolean;
  createdAt: string;
}

const EMPTY_FORM = {
  slug: "",
  destinationUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImageUrl: "",
  ogImageBlob: "",
  ogImageMime: "",
};

function randomSlug() {
  return Math.random().toString(36).slice(2, 8);
}

function getOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export default function RedirectsPage() {
  const [projectId, setProjectId] = useState("");
  const [links, setLinks] = useState<LinkRedirect[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : []))
      .then((projects) => {
        const pid = projects[0]?.id;
        if (!pid) return;
        setProjectId(pid);
        return fetch(`/api/redirects?projectId=${pid}`)
          .then((r) => (r.ok ? r.json() : []))
          .then(setLinks);
      })
      .catch(console.error);
  }, []);

  function openCreate() {
    setForm({ ...EMPTY_FORM, slug: randomSlug() });
    setEditId(null);
    setError("");
    setShowForm(true);
  }

  function openEdit(link: LinkRedirect) {
    setForm({
      slug: link.slug,
      destinationUrl: link.destinationUrl,
      ogTitle: link.ogTitle ?? "",
      ogDescription: link.ogDescription ?? "",
      ogImageUrl: link.ogImageUrl ?? "",
      ogImageBlob: "",
      ogImageMime: "",
    });
    setEditId(link.id);
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setError("");
  }

  async function save() {
    if (!form.destinationUrl || !form.slug) { setError("Заполните slug и URL назначения"); return; }
    setSaving(true);
    setError("");
    try {
      const body = { ...form, projectId };
      const res = editId
        ? await fetch(`/api/redirects/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/redirects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Ошибка");
        return;
      }
      const saved: LinkRedirect = await res.json();
      if (editId) {
        setLinks((prev) => prev.map((l) => l.id === editId ? saved : l));
      } else {
        setLinks((prev) => [saved, ...prev]);
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(link: LinkRedirect) {
    const res = await fetch(`/api/redirects/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !link.isActive }),
    });
    if (res.ok) {
      const updated: LinkRedirect = await res.json();
      setLinks((prev) => prev.map((l) => l.id === link.id ? updated : l));
    }
  }

  async function deleteLink(id: string) {
    if (!confirm("Удалить эту ссылку?")) return;
    setDeletingId(id);
    await fetch(`/api/redirects/${id}`, { method: "DELETE" });
    setLinks((prev) => prev.filter((l) => l.id !== id));
    setDeletingId(null);
  }

  function copy(slug: string, id: string) {
    navigator.clipboard.writeText(`${getOrigin()}/r/${slug}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Link Preview переходники</h1>
          <p className="text-gray-400 mt-1">Ссылки с кастомным превью для Telegram / WhatsApp / VK</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Новая ссылка
        </button>
      </div>

      {/* Как это работает */}
      <div className="bg-violet-600/10 border border-violet-600/20 rounded-xl p-4 text-sm text-violet-300 space-y-1">
        <p className="font-medium text-violet-200">Как работает Large Link Preview</p>
        <p>1. Создайте ссылку с кастомным заголовком, описанием и баннером</p>
        <p>2. Поделитесь ссылкой <code className="bg-violet-900/40 px-1 rounded">{getOrigin()}/r/ваш-slug</code> в Telegram, WhatsApp или VK</p>
        <p>3. Мессенджер покажет большое превью с вашим баннером — пользователь кликает и мгновенно попадает на целевой URL</p>
        <p className="text-violet-400">💡 Баннер должен быть ≥ 800×418px для большого превью в Telegram</p>
      </div>

      {/* Форма создания/редактирования */}
      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-white">{editId ? "Редактировать ссылку" : "Новая ссылка"}</h2>
            <button onClick={closeForm} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Slug (часть URL) *</label>
              <div className="flex gap-2">
                <input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="moy-vebinar"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={() => setForm((f) => ({ ...f, slug: randomSlug() }))}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-white"
                >
                  Авто
                </button>
              </div>
              {form.slug && (
                <p className="text-xs text-gray-500 mt-1">{getOrigin()}/r/{form.slug.toLowerCase().replace(/[^a-z0-9-_]/g, "-")}</p>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">URL назначения *</label>
              <input
                value={form.destinationUrl}
                onChange={(e) => setForm((f) => ({ ...f, destinationUrl: e.target.value }))}
                placeholder="https://bizon365.ru/webinar/..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">OG / Link Preview настройки</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Заголовок превью</label>
                <input
                  value={form.ogTitle}
                  onChange={(e) => setForm((f) => ({ ...f, ogTitle: e.target.value }))}
                  placeholder="🔥 Бесплатный вебинар по маркетингу"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Описание превью</label>
                <textarea
                  value={form.ogDescription}
                  onChange={(e) => setForm((f) => ({ ...f, ogDescription: e.target.value }))}
                  placeholder="Узнайте как увеличить продажи в 3 раза..."
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Баннер (изображение для превью)</label>
                <div className="space-y-2">
                  <input
                    value={form.ogImageBlob ? "" : form.ogImageUrl}
                    onChange={(e) => setForm((f) => ({ ...f, ogImageUrl: e.target.value, ogImageBlob: "", ogImageMime: "" }))}
                    placeholder="https://example.com/banner.jpg (мин. 800×418px)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">или</span>
                    <label className="flex items-center gap-2 cursor-pointer bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors">
                      <Upload className="w-4 h-4" />
                      {form.ogImageBlob ? "Файл загружен ✓" : "Загрузить с компьютера"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 3 * 1024 * 1024) { setError("Файл слишком большой (макс. 3MB)"); return; }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result as string;
                            const base64 = dataUrl.split(",")[1];
                            setForm((f) => ({ ...f, ogImageBlob: base64, ogImageMime: file.type, ogImageUrl: "" }));
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {form.ogImageBlob && (
                      <button onClick={() => setForm((f) => ({ ...f, ogImageBlob: "", ogImageMime: "" }))} className="text-xs text-red-400 hover:text-red-300">
                        Удалить
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">JPG/PNG/WebP · мин. 800×418px · макс. 3MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Превью */}
          {(form.ogTitle || form.ogDescription || form.ogImageUrl || form.ogImageBlob) && (
            <div className="border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Предпросмотр</p>
              <div className="bg-gray-800 rounded-xl overflow-hidden max-w-sm border border-gray-700">
                {(form.ogImageUrl || form.ogImageBlob) && (
                  <div className="aspect-[1200/630] bg-gray-700 overflow-hidden">
                    <img
                      src={form.ogImageBlob ? `data:${form.ogImageMime};base64,${form.ogImageBlob}` : form.ogImageUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}
                <div className="p-3">
                  {form.ogTitle && <p className="text-sm font-semibold text-white line-clamp-2">{form.ogTitle}</p>}
                  {form.ogDescription && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{form.ogDescription}</p>}
                  <p className="text-xs text-gray-600 mt-1">{getOrigin()}/r/{form.slug || "..."}</p>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
            >
              {saving ? "Сохранение..." : editId ? "Сохранить" : "Создать ссылку"}
            </button>
            <button onClick={closeForm} className="px-4 py-2 text-sm text-gray-400 hover:text-white">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Список ссылок */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-violet-400" />
          <h2 className="font-semibold text-white">Ваши ссылки</h2>
          <span className="ml-auto text-xs text-gray-500">{links.length} шт.</span>
        </div>

        {links.length === 0 ? (
          <div className="text-center py-16">
            <Link2 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Нет ссылок. Создайте первую!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {links.map((link) => (
              <div key={link.id} className="p-5 flex gap-4 items-start hover:bg-gray-800/30 transition-colors">
                {/* Баннер */}
                {link.ogImageUrl ? (
                  <div className="w-20 h-12 rounded-lg bg-gray-800 overflow-hidden flex-shrink-0">
                    <img src={link.ogImageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-12 rounded-lg bg-gray-800 flex-shrink-0 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-gray-600" />
                  </div>
                )}

                {/* Инфо */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{link.ogTitle || link.slug}</span>
                    {!link.isActive && (
                      <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">Выкл</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <code className="text-xs text-violet-400">/r/{link.slug}</code>
                    <span className="text-gray-700 text-xs">→</span>
                    <span className="text-xs text-gray-500 truncate max-w-xs">{link.destinationUrl}</span>
                  </div>
                  {link.ogDescription && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{link.ogDescription}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {link.clicks} кликов
                    </span>
                  </div>
                </div>

                {/* Кнопки */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => copy(link.slug, link.id)}
                    title="Скопировать ссылку"
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {copiedId === link.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`/r/${link.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Открыть ссылку"
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => openEdit(link)}
                    title="Редактировать"
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(link)}
                    title={link.isActive ? "Выключить" : "Включить"}
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {link.isActive ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteLink(link.id)}
                    disabled={deletingId === link.id}
                    title="Удалить"
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
