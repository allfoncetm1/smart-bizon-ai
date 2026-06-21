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

const EMPTY_FORM = { slug: "", destinationUrl: "", ogTitle: "", ogDescription: "", ogImageUrl: "", ogImageBlob: "", ogImageMime: "" };

function randomSlug() { return Math.random().toString(36).slice(2, 8); }
function getOrigin() { if (typeof window === "undefined") return ""; return window.location.origin; }

const inputStyle: React.CSSProperties = { width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 13px", fontFamily: "inherit", fontSize: 13, color: "var(--text)", background: "var(--card)", outline: "none" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, marginBottom: 6, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" };

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
    fetch("/api/projects").then((r) => (r.ok ? r.json() : [])).then((projects) => {
      const pid = projects[0]?.id;
      if (!pid) return;
      setProjectId(pid);
      fetch(`/api/redirects?projectId=${pid}`).then((r) => (r.ok ? r.json() : [])).then(setLinks);
    }).catch(console.error);
  }, []);

  function openCreate() { setForm({ ...EMPTY_FORM, slug: randomSlug() }); setEditId(null); setError(""); setShowForm(true); }
  function openEdit(link: LinkRedirect) { setForm({ slug: link.slug, destinationUrl: link.destinationUrl, ogTitle: link.ogTitle ?? "", ogDescription: link.ogDescription ?? "", ogImageUrl: link.ogImageUrl ?? "", ogImageBlob: "", ogImageMime: "" }); setEditId(link.id); setError(""); setShowForm(true); }
  function closeForm() { setShowForm(false); setEditId(null); setError(""); }

  async function save() {
    if (!form.destinationUrl || !form.slug) { setError("Заполните slug и URL назначения"); return; }
    setSaving(true); setError("");
    try {
      const body = { ...form, projectId };
      const res = editId
        ? await fetch(`/api/redirects/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/redirects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const err = await res.json(); setError(err.error ?? "Ошибка"); return; }
      const saved: LinkRedirect = await res.json();
      setLinks((prev) => editId ? prev.map((l) => l.id === editId ? saved : l) : [saved, ...prev]);
      closeForm();
    } finally { setSaving(false); }
  }

  async function toggleActive(link: LinkRedirect) {
    const res = await fetch(`/api/redirects/${link.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !link.isActive }) });
    if (res.ok) { const updated: LinkRedirect = await res.json(); setLinks((prev) => prev.map((l) => l.id === link.id ? updated : l)); }
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
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
        <div>
          <h2 style={{ margin: "0 0 3px", fontSize: 21, fontWeight: 700, letterSpacing: "-0.015em", color: "var(--text)" }}>Link Preview переходники</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)" }}>Ссылки с кастомным превью для Telegram / WhatsApp / VK</p>
        </div>
        <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--accent)", border: "none", borderRadius: 10, padding: "10px 16px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#fff" }}>
          <Plus size={16} />Новая ссылка
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: 22, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Form */}
          {showForm && (
            <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 22, boxShadow: "0 1px 2px rgba(20,20,50,.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--text)" }}>{editId ? "Редактировать ссылку" : "Новая ссылка"}</h3>
                <button onClick={closeForm} style={{ color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer" }}><X size={18} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Slug (часть URL) *</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input style={{ ...inputStyle, flex: 1 }} value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="moy-vebinar" />
                    <button onClick={() => setForm((f) => ({ ...f, slug: randomSlug() }))} style={{ padding: "11px 12px", background: "var(--soft)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12, color: "var(--muted)", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>Авто</button>
                  </div>
                  {form.slug && <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--muted)" }}>{getOrigin()}/r/{form.slug.toLowerCase().replace(/[^a-z0-9-_]/g, "-")}</p>}
                </div>
                <div>
                  <label style={labelStyle}>URL назначения *</label>
                  <input style={inputStyle} value={form.destinationUrl} onChange={(e) => setForm((f) => ({ ...f, destinationUrl: e.target.value }))} placeholder="https://bizon365.ru/webinar/..." />
                </div>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 16 }}>
                <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>OG / Link Preview настройки</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div><label style={labelStyle}>Заголовок превью</label><input style={inputStyle} value={form.ogTitle} onChange={(e) => setForm((f) => ({ ...f, ogTitle: e.target.value }))} placeholder="🔥 Бесплатный вебинар по маркетингу" /></div>
                  <div><label style={labelStyle}>Описание превью</label><textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 } as React.CSSProperties} value={form.ogDescription} onChange={(e) => setForm((f) => ({ ...f, ogDescription: e.target.value }))} placeholder="Узнайте как увеличить продажи..." /></div>
                  <div>
                    <label style={labelStyle}>Баннер (изображение для превью)</label>
                    <input style={inputStyle} value={form.ogImageBlob ? "" : form.ogImageUrl} onChange={(e) => setForm((f) => ({ ...f, ogImageUrl: e.target.value, ogImageBlob: "", ogImageMime: "" }))} placeholder="https://example.com/banner.jpg (мин. 800×418px)" />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>или</span>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", background: "var(--soft)", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 12px", fontSize: 13, color: "var(--text)", fontFamily: "inherit", fontWeight: 500 }}>
                        <Upload size={14} />
                        {form.ogImageBlob ? "Файл загружен ✓" : "Загрузить с компьютера"}
                        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" style={{ display: "none" }} onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 3 * 1024 * 1024) { setError("Файл слишком большой (макс. 3MB)"); return; }
                          const reader = new FileReader();
                          reader.onload = (ev) => { const d = ev.target?.result as string; setForm((f) => ({ ...f, ogImageBlob: d.split(",")[1], ogImageMime: file.type, ogImageUrl: "" })); };
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                      {form.ogImageBlob && <button onClick={() => setForm((f) => ({ ...f, ogImageBlob: "", ogImageMime: "" }))} style={{ fontSize: 12, color: "var(--red)", background: "transparent", border: "none", cursor: "pointer" }}>Удалить</button>}
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--muted)" }}>JPG/PNG/WebP · мин. 800×418px · макс. 3MB</p>
                  </div>
                </div>
              </div>
              {(form.ogTitle || form.ogDescription || form.ogImageUrl || form.ogImageBlob) && (
                <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 16 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Предпросмотр</p>
                  <div style={{ background: "var(--soft)", borderRadius: 12, overflow: "hidden", maxWidth: 320, border: "1px solid var(--border)" }}>
                    {(form.ogImageUrl || form.ogImageBlob) && (
                      <div style={{ aspectRatio: "1200/630", background: "var(--line)", overflow: "hidden" }}>
                        <img src={form.ogImageBlob ? `data:${form.ogImageMime};base64,${form.ogImageBlob}` : form.ogImageUrl} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    )}
                    <div style={{ padding: 12 }}>
                      {form.ogTitle && <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{form.ogTitle}</p>}
                      {form.ogDescription && <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--muted)" }}>{form.ogDescription}</p>}
                      <p style={{ margin: 0, fontSize: 11, color: "#a3a2b0" }}>{getOrigin()}/r/{form.slug || "..."}</p>
                    </div>
                  </div>
                </div>
              )}
              {error && <p style={{ fontSize: 13, color: "var(--red)", marginTop: 12 }}>{error}</p>}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={save} disabled={saving} style={{ background: "var(--accent)", border: "none", borderRadius: 10, padding: "10px 20px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Сохранение..." : editId ? "Сохранить" : "Создать ссылку"}
                </button>
                <button onClick={closeForm} style={{ background: "transparent", border: "none", fontSize: 13, color: "var(--muted)", cursor: "pointer", fontFamily: "inherit" }}>Отмена</button>
              </div>
            </div>
          )}

          {/* Links list */}
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, boxShadow: "0 1px 2px rgba(20,20,50,.04)", overflow: "hidden" }}>
            <div style={{ padding: "22px 22px 14px" }}>
              <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 700, color: "var(--text)" }}>Ваши ссылки <span style={{ color: "var(--muted)", fontWeight: 500, fontSize: 13 }}>· {links.length} шт.</span></h3>
            </div>
            {links.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px" }}>
                <Link2 size={32} color="var(--line)" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, color: "var(--muted)" }}>Нет ссылок. Создайте первую!</p>
              </div>
            ) : (
              links.map((link) => (
                <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 22px", borderTop: "1px solid var(--line)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 11, background: "color-mix(in srgb, var(--accent) 11%, transparent)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", overflow: "hidden" }}>
                    {link.ogImageUrl ? <img src={link.ogImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Link2 size={19} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{link.ogTitle || link.slug}</div>
                    <div style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <span style={{ color: "var(--accent)", fontWeight: 600 }}>/r/{link.slug}</span> → {link.destinationUrl}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>{link.clicks}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>кликов</div>
                  </div>
                  <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    {[
                      { icon: copiedId === link.id ? <Check size={15} color="var(--green)" /> : <Copy size={15} />, action: () => copy(link.slug, link.id), title: "Копировать" },
                      { icon: <ExternalLink size={15} />, action: () => window.open(`/r/${link.slug}`, "_blank"), title: "Открыть" },
                      { icon: <Pencil size={15} />, action: () => openEdit(link), title: "Редактировать" },
                      { icon: link.isActive ? <ToggleRight size={15} color="var(--green)" /> : <ToggleLeft size={15} />, action: () => toggleActive(link), title: link.isActive ? "Выключить" : "Включить" },
                      { icon: <Trash2 size={15} />, action: () => deleteLink(link.id), title: "Удалить", disabled: deletingId === link.id },
                    ].map((btn, i) => (
                      <button key={i} onClick={btn.action} title={btn.title} disabled={"disabled" in btn && btn.disabled} style={{ padding: 7, color: "var(--muted)", background: "transparent", border: "none", cursor: "pointer", borderRadius: 8, opacity: ("disabled" in btn && btn.disabled) ? 0.4 : 1 }}>
                        {btn.icon}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* How it works */}
        <div style={{ background: "linear-gradient(165deg, color-mix(in srgb, var(--accent) 9%, #fff), #fff)", border: "1px solid var(--border)", borderRadius: 16, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
            <span style={{ width: 30, height: 30, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 16v-4M12 8h.01" /></svg>
            </span>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Как работает</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              "Создайте ссылку с кастомным заголовком, описанием и баннером.",
              "Поделитесь ссылкой в Telegram, WhatsApp или VK.",
              "Мессенджер покажет большое превью с баннером — клик ведёт на целевой URL.",
            ].map((text, i) => (
              <div key={i} style={{ display: "flex", gap: 11 }}>
                <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--text)" }}>{text}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--amberbg)", borderRadius: 11, fontSize: 12.5, lineHeight: 1.5, color: "#8a5a08" }}>
            💡 Баннер должен быть ≥ 800×418px для большого превью в Telegram.
          </div>
        </div>
      </div>
    </div>
  );
}
