"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type User = { fullName: string; email: string; org: string };
type Item = { nameAr: string; nameEn: string; logo: string };

export default function SupportersClient({ user }: { user: User }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/supporters", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok || !d?.ok) {
        setErr(d?.error || "حدث خطأ.");
        setItems([]);
      } else {
        setItems(d.items || []);
      }
    } catch {
      setErr("تعذر الاتصال بالسيرفر.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h1 className="h1">الداعمون / Supporters</h1>
        <div className="small">
          <span className="badge" style={{ marginInlineEnd: 8 }}>{user.email}</span>
          <span className="badge">{user.fullName}</span>
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={load} disabled={loading} style={{ padding: "10px 12px" }}>
            {loading ? "..." : "تحديث / Refresh"}
          </button>
        </div>

        {loading && <div className="small" style={{ marginTop: 10 }}>Loading...</div>}
        {err && <div className="error" style={{ marginTop: 10 }}>{err}</div>}
      </div>

      {!loading && !err && (
        <div className="card">
          {items.length === 0 ? (
            <div className="small">لا يوجد داعمون حالياً.</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              {items.map((it, idx) => (
                <div key={idx} className="card" style={{ padding: 14 }}>
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: 90,
                      background: "#fff",
                      borderRadius: 12,
                      border: "1px solid #eef2f7",
                      overflow: "hidden",
                    }}
                  >
                    {it.logo ? (
                      <Image
                        src={it.logo}
                        alt={it.nameEn || it.nameAr || "Supporter"}
                        fill
                        style={{ objectFit: "contain" }}
                      />
                    ) : (
                      <div className="small" style={{ padding: 12 }}>No Logo</div>
                    )}
                  </div>

                  <div style={{ marginTop: 10, fontWeight: 900, textAlign: "right" }}>
                    {it.nameAr || "—"}
                  </div>
                  <div className="small" style={{ textAlign: "right" }}>
                    {it.nameEn || ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
