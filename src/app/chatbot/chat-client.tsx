"use client";

import { useEffect, useState } from "react";

type User = { fullName: string; email: string; org: string };

type ApiResp =
  | { ok: false; error: string }
  | { ok: true; mode: "list"; total: number; items: { q: string }[] }
  | { ok: true; mode: "none"; answer: null; suggestions: string[] }
  | { ok: true; mode: "answer"; answer: { q: string; a: string }; suggestions: string[] };

export default function ChatClient({ user }: { user: User }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<ApiResp | null>(null);

  async function loadList() {
    setLoading(true);
    try {
      const r = await fetch("/api/faq", { cache: "no-store" });
      const d = (await r.json()) as ApiResp;
      setResp(d);
    } catch {
      setResp({ ok: false, error: "تعذر الاتصال بالسيرفر." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
  }, []);

  async function ask(text?: string) {
    const query = (text ?? q).trim();
    if (!query) return;

    setLoading(true);
    try {
      const r = await fetch(`/api/faq?q=${encodeURIComponent(query)}`, {
        cache: "no-store",
      });
      const d = (await r.json()) as ApiResp;
      setResp(d);
    } catch {
      setResp({ ok: false, error: "تعذر الاتصال بالسيرفر." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h1 className="h1">Chatbot / الأسئلة الشائعة</h1>
        <div className="small">
          <span className="badge" style={{ marginInlineEnd: 8 }}>
            {user.email}
          </span>
          <span className="badge">{user.fullName}</span>
        </div>

        <div className="grid" style={{ gap: 10, marginTop: 12 }}>
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="اكتب سؤالك بالعربي أو English..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                ask();
              }
            }}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn" onClick={() => ask()} disabled={loading}>
              {loading ? "..." : "إرسال / Ask"}
            </button>

            <button
              className="btn"
              onClick={() => {
                setQ("");
                loadList();
              }}
              disabled={loading}
              style={{ background: "#334155" }}
            >
              {loading ? "..." : "عرض الأسئلة / List"}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="h2">النتيجة / Result</h2>

        {resp === null ? (
          <div className="small">Loading...</div>
        ) : !resp.ok ? (
          <div className="error">{resp.error}</div>
        ) : resp.mode === "list" ? (
          <div className="grid" style={{ gap: 8 }}>
            <div className="small">
              عدد الأسئلة في الملف: <span className="badge">{resp.total}</span>
            </div>

            {resp.items.map((it, i) => (
              <button
                key={i}
                className="card"
                style={{ textAlign: "right", cursor: "pointer" }}
                onClick={() => {
                  setQ(it.q);
                  ask(it.q);
                }}
              >
                <div style={{ fontWeight: 900 }}>{it.q}</div>
                <div className="small">اضغط للسؤال</div>
              </button>
            ))}
          </div>
        ) : resp.mode === "none" ? (
          <div className="grid" style={{ gap: 10 }}>
            <div className="error">لم أجد إجابة مطابقة. جرّب صياغة أخرى.</div>

            <div className="small" style={{ fontWeight: 900 }}>
              اقتراحات:
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {resp.suggestions.map((s, i) => (
                <button
                  key={i}
                  className="badge"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setQ(s);
                    ask(s);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid" style={{ gap: 10 }}>
            <div className="card" style={{ background: "#fff" }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>
                Q: {resp.answer.q}
              </div>
              <div className="small" style={{ whiteSpace: "pre-wrap" }}>
                {resp.answer.a}
              </div>
            </div>

            <div className="small" style={{ fontWeight: 900 }}>
              اقتراحات مشابهة:
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {resp.suggestions.map((s, i) => (
                <button
                  key={i}
                  className="badge"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setQ(s);
                    ask(s);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
