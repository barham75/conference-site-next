"use client";

import { useEffect, useMemo, useState } from "react";

type User = { fullName: string; email: string; org: string };

type ApiData = {
  ok: boolean;
  error?: string;
  sheetName?: string;
  headers?: string[];
  rows?: Record<string, string>[];
  dayKey?: string | null;
  days?: string[];
};

export default function ProgramClient({ user }: { user: User }) {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState<string>("");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/program", { cache: "no-store" });
      const d = (await r.json()) as ApiData;
      setData(d);

      if (d?.ok && d.days && d.days.length && !day) {
        setDay(d.days[0]); // أول يوم افتراضي
      }
    } catch {
      setData({ ok: false, error: "تعذر الاتصال بالسيرفر." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    if (!data?.ok) return [];
    const rows = data.rows || [];
    if (!data.dayKey || !day) return rows;
    return rows.filter((r) => (r[data.dayKey!] || "").trim() === day);
  }, [data, day]);

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h1 className="h1">برنامج المؤتمر / Program</h1>
        <div className="small">
          <span className="badge" style={{ marginInlineEnd: 8 }}>{user.email}</span>
          <span className="badge">{user.fullName}</span>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" onClick={load} disabled={loading} style={{ padding: "10px 12px" }}>
            {loading ? "..." : "تحديث / Refresh"}
          </button>

          {data?.ok && data.dayKey && (data.days?.length || 0) > 0 && (
            <label className="small" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 900 }}>اليوم / Day:</span>
              <select className="select" value={day} onChange={(e) => setDay(e.target.value)} style={{ width: 220 }}>
                {data.days!.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {!loading && data?.ok && (
          <div className="small" style={{ marginTop: 10 }}>
            Sheet: <span className="badge">{data.sheetName}</span>{" "}
            Rows: <span className="badge">{filteredRows.length}</span>
          </div>
        )}

        {loading && <div className="small" style={{ marginTop: 12 }}>Loading...</div>}

        {!loading && (!data || !data.ok) && (
          <div className="error" style={{ marginTop: 12 }}>
            {data?.error || "حدث خطأ."}
          </div>
        )}
      </div>

      {!loading && data?.ok && (
        <div className="card">
          <h2 className="h2">الجدول / Table</h2>

          <div className="tableWrap" style={{ marginTop: 10 }}>
            <table>
              <thead>
                <tr>
                  {(data.headers || []).map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={(data.headers || []).length} style={{ textAlign: "center" }}>
                      لا توجد بيانات لعرضها.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, idx) => (
                    <tr key={idx}>
                      {(data.headers || []).map((h) => (
                        <td key={h}>{row[h] || ""}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="small" style={{ marginTop: 8 }}>
            * يتم قراءة أول Sheet من ملف Excel، والصف الأول يعتبر عناوين للأعمدة.
          </div>
        </div>
      )}
    </div>
  );
}
