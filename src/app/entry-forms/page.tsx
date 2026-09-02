"use client";

import { useState, useEffect } from "react";
import { LogIn, Copy, Trash2, Plus, ExternalLink, ToggleLeft, ToggleRight, X, Check } from "lucide-react";

interface EntryForm {
  id: string;
  slug: string;
  bizonRoomUrl: string;
  title: string | null;
  clicks: number;
  isActive: boolean;
  createdAt: string;
}

interface RoomPreview {
  title: string | null;
  speaker: string | null;
  dateLabel: string | null;
}

const EMPTY_FORM = { slug: "", bizonRoomUrl: "", title: "" };

function randomSlug() { return Math.random().toString(36).slice(2, 8); }
function getOrigin() { if (typeof window === "undefined") return ""; return window.location.origin; }

const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 13px", fontFamily: "inherit", fontSize: 13, color: "var(--text)", background: "var(--card)", outline: "none" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" };

export default function EntryFormsPage() {
  const [forms, setForms] = useState<EntryForm[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<RoomPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetch("/api/entry-forms").then((r) => (r.ok ? r.json() : [])).then(setForms).catch(console.error);
  }, []);

  useEffect(() => {
    const url = form.bizonRoomUrl.trim();
    if (!url) { setPreview(null); return; }
    const t = setTimeout(() => {
      setPreviewLoading(true);
      fetch(`/api/entry-forms/preview?url=${encodeURIComponent(url)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then(setPreview)
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false));
    }, 500);
    return () => clearTimeout(t);
  }, [form.bizonRoomUrl]);

  function openCreate() { setForm({ ...EMPTY_FORM, slug: randomSlug() }); setEditId(null); setError(""); setPreview(null); setShowForm(true); }
  function openEdit(f: EntryForm) { setForm({ slug: f.slug, bizonRoomUrl: f.bizonRoomUrl, title: f.title ?? "" }); setEditId(f.id); setError(""); setPreview(null); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditId(null); setError(""); }

  async function save() {
    if (!form.slug || !form.bizonRoomUrl) { setError("Заполните slug и ссылку на комнату"); return; }
    setSaving(true); setError("");
    try {
      const res = editId
        ? await fetch(`/api/entry-forms/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        : await fetch("/api/entry-forms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); setError(err.error ?? "Ошибка"); return; }
      const saved: EntryForm = await res.json();
      setForms((prev) => editId ? prev.map((f) => f.id === editId ? saved : f) : [saved, ...prev]);
      closeForm();
    } finally { setSaving(false); }
  }

  async function toggleActive(f: EntryForm) {
    const res = await fetch(`/api/entry-forms/${f.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !f.isActive }) });
    if (res.ok) { const updated: EntryForm = await res.json(); setForms((prev) => prev.map((x) => x.id === f.id ? updated : x)); }
  }

  async function deleteForm(id: string) {
    if (!confirm("Удалить эту форму входа?")) return;
    setDeletingId(id);
    await fetch(`/api/entry-forms/${id}`, { method: "DELETE" });
    setForms((prev) => prev.filter((f) => f.id !== id));
    setDeletingId(null);
  }

  function copy(slug: string, id: string) {
    navigator.clipboard.writeText(`${getOrigin()}/j/${slug}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
        <div>
          <h2 style={{ margin: "0 0 3px", fontSize: 21, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--text)" }}>Формы входа на вебинар</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>Красивая страница вместо стандартной формы Bizon365 — вход в комнату автоматический</p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--accent)", border: "none", borderRadius: 10, padding: "10px 16px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#fff" }}>
          <Plus size={16} />Новая форма
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: 22, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {showForm && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(20,20,50,.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--text)" }}>{editId ? "Редактировать форму" : "Новая форма входа"}</h3>
                <button onClick={closeForm} style={{ color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer" }}><X size={18} /></button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Ссылка на комнату Bizon365 *</label>
                  <input style={inputStyle} value={form.bizonRoomUrl} onChange={(e) => setForm((f) => ({ ...f, bizonRoomUrl: e.target.value }))} placeholder="https://online.bizon365.ru/room/175423/TEGIN_SABAQ" />
                  <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--muted)" }}>Та же ссылка, что ведёт на обычную страницу входа Bizon</p>
                </div>

                {previewLoading && <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted)" }}>Загружаю данные вебинара...</p>}
                {preview && !previewLoading && (preview.title || preview.speaker || preview.dateLabel) && (
                  <div style={{ background: "var(--soft)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px", fontSize: 12.5, color: "var(--text)" }}>
                    {preview.title && <div style={{ fontWeight: 600, marginBottom: 4 }}>{preview.title}</div>}
                    {preview.speaker && <div style={{ color: "var(--muted)" }}>🎤 {preview.speaker}</div>}
                    {preview.dateLabel && <div style={{ color: "var(--muted)" }}>🗓 {preview.dateLabel}</div>}
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Slug (часть URL)</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input style={{ ...inputStyle, flex: 1 }} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="moy-vebinar" />
                    <button onClick={() => setForm((f) => ({ ...f, slug: randomSlug() }))} style={{ padding: "11px 12px", background: "var(--soft)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12, color: "var(--muted)", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Авто</button>
                  </div>
                  {form.slug && <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--muted)" }}>{getOrigin()}/j/{form.slug.toLowerCase().replace(/[^a-z0-9-_]/g, "-")}</p>}
                </div>

                <div>
                  <label style={labelStyle}>Заголовок (необязательно)</label>
                  <input style={inputStyle} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={preview?.title || "Возьмём заголовок из Bizon, если не указать"} />
                </div>
              </div>

              {error && <p style={{ fontSize: 13, color: "var(--red)", marginTop: 12 }}>{error}</p>}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={save} disabled={saving} style={{ background: "var(--accent)", border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Сохранение..." : editId ? "Сохранить" : "Создать форму"}
                </button>
                <button onClick={closeForm} style={{ background: "transparent", border: "none", fontSize: 13, color: "var(--muted)", cursor: "pointer", fontFamily: "inherit" }}>Отмена</button>
              </div>
            </div>
          )}

          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 1px 2px rgba(20,20,50,.04)", overflow: "hidden" }}>
            <div style={{ padding: "22px 22px 14px" }}>
              <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--text)" }}>Ваши формы <span style={{ color: "var(--muted)", fontWeight: 500, fontSize: 13 }}>· {forms.length} шт.</span></h3>
            </div>
            {forms.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px" }}>
                <LogIn size={32} color="var(--line)" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, color: "var(--muted)" }}>Нет форм. Создайте первую!</p>
              </div>
            ) : (
              forms.map((f) => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 22px", borderTop: "1px solid var(--line)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: "color-mix(in srgb, var(--accent) 11%, transparent)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" }}>
                    <LogIn size={19} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{f.title || f.slug}</div>
                    <div style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ color: "var(--accent)", fontWeight: 600 }}>/j/{f.slug}</span> → {f.bizonRoomUrl}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{f.clicks}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>заходов</div>
                  </div>
                  <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    {[
                      { icon: copiedId === f.id ? <Check size={15} color="var(--green)" /> : <Copy size={15} />, action: () => copy(f.slug, f.id), title: "Копировать" },
                      { icon: <ExternalLink size={15} />, action: () => window.open(`/j/${f.slug}`, "_blank"), title: "Открыть" },
                      { icon: <Trash2 size={15} />, action: () => deleteForm(f.id), title: "Удалить", disabled: deletingId === f.id },
                    ].map((btn, i) => (
                      <button key={i} onClick={btn.action} title={btn.title} disabled={"disabled" in btn && btn.disabled} style={{ padding: 7, color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer", borderRadius: 8, opacity: ("disabled" in btn && btn.disabled) ? 0.4 : 1 }}>
                        {btn.icon}
                      </button>
                    ))}
                    <button onClick={() => openEdit(f)} title="Редактировать" style={{ padding: 7, color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer", borderRadius: 8 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                    </button>
                    <button onClick={() => toggleActive(f)} title={f.isActive ? "Выключить" : "Включить"} style={{ padding: 7, color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer", borderRadius: 8 }}>
                      {f.isActive ? <ToggleRight size={15} color="var(--green)" /> : <ToggleLeft size={15} />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ background: "linear-gradient(165deg, color-mix(in srgb, var(--accent) 9%, #fff), #fff)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>
            </span>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Как работает</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              "Вставьте ссылку на комнату вебинара из Bizon365.",
              "Отправьте свою короткую ссылку зрителям вместо ссылки Bizon.",
              "Зритель вводит имя и телефон в крупной удобной форме — и сразу попадает в саму комнату, без стандартной формы Bizon.",
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", gap: 11 }}>
                <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--text)" }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
