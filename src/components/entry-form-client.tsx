"use client";

import { useRef, useState } from "react";
import { toE164 } from "@/lib/bizon-room";

interface Props {
  bizonRoomUrl: string;
  title: string;
  speaker: string | null;
  dateLabel: string | null;
}

export function EntryFormClient({ bizonRoomUrl, title, speaker, dateLabel }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Введите ваше имя"); return; }
    const e164 = toE164(phone);
    if (!e164) { setError("Введите корректный номер телефона"); return; }

    setSubmitting(true);

    // Real <form> POST into a hidden iframe, targeting Bizon's own
    // `authorize` endpoint directly — a genuine cross-site navigation, not
    // fetch/XHR, so it isn't subject to CORS. Bizon sets its session cookie
    // in the visitor's browser as a normal side effect of that POST.
    const iframe = iframeRef.current;
    if (!iframe) return;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = `${bizonRoomUrl}/authorize?_csrf=`;
    form.target = iframe.name;
    form.style.display = "none";

    const fields: Record<string, string> = {
      username: name.trim().slice(0, 30),
      email: "",
      phone: e164,
      custom1: "",
      referer: "",
      "g-recaptcha-response": "",
      param1: "",
      param2: "",
      param3: "",
      cu1: "",
      sup: "",
    };
    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
    form.remove();

    // Give Bizon a moment to process the POST and set the cookie, then send
    // the visitor's actual tab into the room — a top-level navigation, so
    // the freshly-set session cookie is sent along and they land straight
    // in the live room instead of Bizon's own entry form.
    window.setTimeout(() => {
      window.location.href = bizonRoomUrl;
    }, 900);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f3f7", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: 24, boxShadow: "0 20px 60px rgba(20,20,50,.12)", padding: "44px 40px", boxSizing: "border-box" }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: "#6d5cff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
          <img src="/logo.png" alt="" style={{ width: 36, height: 36, objectFit: "contain" }} />
        </div>

        <h1 style={{ margin: "0 0 14px", fontSize: 26, fontWeight: 800, lineHeight: 1.25, color: "#171622", letterSpacing: "-0.01em" }}>
          {title}
        </h1>

        {(speaker || dateLabel) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 18px", marginBottom: 28, fontSize: 14.5, color: "#6f6e7e" }}>
            {speaker && <span>🎤 {speaker}</span>}
            {dateLabel && <span>🗓 {dateLabel}</span>}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, marginBottom: 8, color: "#171622" }}>Ваше имя</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Как к вам обращаться"
              autoFocus
              style={{ width: "100%", boxSizing: "border-box", padding: "16px 18px", fontSize: 18, fontWeight: 500, border: "2px solid #ecebf2", borderRadius: 14, outline: "none", fontFamily: "inherit", color: "#171622" }}
              onFocus={(e) => { e.target.style.borderColor = "#6d5cff"; }}
              onBlur={(e) => { e.target.style.borderColor = "#ecebf2"; }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13.5, fontWeight: 600, marginBottom: 8, color: "#171622" }}>Номер телефона</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 700 000 00 00"
              type="tel"
              style={{ width: "100%", boxSizing: "border-box", padding: "16px 18px", fontSize: 18, fontWeight: 500, border: "2px solid #ecebf2", borderRadius: 14, outline: "none", fontFamily: "inherit", color: "#171622" }}
              onFocus={(e) => { e.target.style.borderColor = "#6d5cff"; }}
              onBlur={(e) => { e.target.style.borderColor = "#ecebf2"; }}
            />
          </div>

          {error && <p style={{ margin: 0, fontSize: 14, color: "#e1483a", fontWeight: 500 }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            style={{ marginTop: 8, width: "100%", padding: "18px 0", fontSize: 18, fontWeight: 700, color: "#fff", background: "#6d5cff", border: "none", borderRadius: 14, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.75 : 1, boxShadow: "0 8px 24px rgba(109,92,255,.35)" }}
          >
            {submitting ? "Входим..." : "Войти на вебинар →"}
          </button>
        </form>

        <p style={{ margin: "20px 0 0", fontSize: 12, color: "#a3a2b0", textAlign: "center" }}>
          Заполняя форму, вы соглашаетесь на обработку персональных данных
        </p>
      </div>

      <iframe ref={iframeRef} name="bizon-auth-frame" title="" style={{ display: "none" }} />
    </div>
  );
}
