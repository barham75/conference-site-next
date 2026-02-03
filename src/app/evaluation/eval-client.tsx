"use client";

import { useEffect, useMemo, useState } from "react";

type User = { fullName: string; email: string; org: string };

const questions = [
  { ar: "التنظيم العام للمؤتمر", en: "Overall organization quality" },
  { ar: "جودة الجلسات العلمية", en: "Quality of scientific sessions" },
  { ar: "وضوح البرنامج والالتزام بالوقت", en: "Program clarity & time management" },
  { ar: "جودة المكان والخدمات اللوجستية", en: "Venue & logistics quality" },
  { ar: "مدى الاستفادة العامة من المؤتمر", en: "Overall satisfaction & benefit" },
];

type Stats = {
  count: number;
  avgScore: number;        // من 100
  avgQuestions: number[];  // 5 عناصر (من 1-5)
};

export default function EvalClient({ user }: { user: User }) {
  const [answers, setAnswers] = useState<number[]>([3, 3, 3, 3, 3]);
  const [loading, setLoading] = useState(false);
  const [savedScore, setSavedScore] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const computedScore = useMemo(() => {
    const sum = answers.reduce((a, b) => a + b, 0); // max 25
    return Math.round((sum / 25) * 100);
  }, [answers]);

  function setAnswer(idx: number, value: number) {
    const copy = [...answers];
    copy[idx] = value;
    setAnswers(copy);
  }

  async function loadStats() {
    setStatsLoading(true);
    try {
      const r = await fetch("/api/evaluation", { cache: "no-store" });
      const d = await r.json();
      if (d?.ok) {
        setStats(d.stats || null);
        if (d?.mine?.answers?.length === 5) {
          setAnswers(d.mine.answers);
          setSavedScore(d.mine.score ?? null);
        }
      }
    } catch {
      // ignore
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setMsg({ type: "err", text: data?.error || "حدث خطأ." });
      } else {
        setSavedScore(data.score);
        setMsg({
          type: "ok",
          text: data.updated
            ? "تم تحديث التقييم بنجاح ✅ / Updated ✅"
            : "تم حفظ التقييم بنجاح ✅ / Saved ✅",
        });

        // حدّث الإحصائيات العامة بعد الحفظ
        await loadStats();
      }
    } catch {
      setMsg({ type: "err", text: "تعذر الاتصال بالسيرفر." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      {/* التقييم العام */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 className="h2" style={{ margin: 0 }}>
            التقييم العام / Overall Rating
          </h2>
          <button className="btn" onClick={loadStats} disabled={statsLoading} style={{ padding: "10px 12px" }}>
            {statsLoading ? "..." : "تحديث / Refresh"}
          </button>
        </div>

        {statsLoading ? (
          <div className="small" style={{ marginTop: 10 }}>Loading...</div>
        ) : !stats ? (
          <div className="error" style={{ marginTop: 10 }}>تعذر تحميل الإحصائيات.</div>
        ) : (
          <div className="grid" style={{ gap: 10, marginTop: 10 }}>
            <div className="small">
              عدد المشاركين في التقييم: <span className="badge">{stats.count}</span>{" "}
              متوسط النتيجة (من 100): <span className="badge">{stats.avgScore}</span>
            </div>

            <div className="tableWrap">
              <table>
                <thead>
                  <tr>
                    <th>السؤال / Question</th>
                    <th>المتوسط (1–5) / Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 800 }}>{q.ar} / {q.en}</td>
                      <td>{stats.avgQuestions?.[i] ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="small">
              * المتوسطات يتم حسابها من جميع التقييمات المحفوظة في ملف Excel.
            </div>
          </div>
        )}
      </div>

      {/* تقييم المستخدم */}
      <div className="card">
        <h1 className="h1">تقييم المؤتمر / Conference Evaluation</h1>
        <div className="small">
          <span className="badge" style={{ marginInlineEnd: 8 }}>{user.email}</span>
          <span className="badge">{user.fullName}</span>
        </div>

        <p className="small" style={{ marginTop: 10 }}>
          اختر درجة لكل سؤال من 1 إلى 5. النتيجة النهائية من 100.
        </p>

        {msg && <div className={msg.type === "ok" ? "success" : "error"}>{msg.text}</div>}

        <form onSubmit={submit} className="grid" style={{ gap: 12, marginTop: 12 }}>
          {questions.map((q, idx) => (
            <div key={idx} className="card" style={{ padding: 12 }}>
              <div style={{ fontWeight: 900 }}>
                {idx + 1}. {q.ar} / {q.en}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <label
                    key={n}
                    className="badge"
                    style={{
                      cursor: "pointer",
                      userSelect: "none",
                      fontWeight: answers[idx] === n ? 900 : 700,
                    }}
                  >
                    <input
                      type="radio"
                      name={`q${idx}`}
                      value={n}
                      checked={answers[idx] === n}
                      onChange={() => setAnswer(idx, n)}
                      style={{ marginInlineEnd: 6 }}
                    />
                    {n}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontWeight: 900 }}>
              نتيجتك الآن / Your score: <span className="badge">{computedScore}</span>
            </div>
            {savedScore !== null && (
              <div className="small" style={{ marginTop: 8 }}>
                آخر نتيجة محفوظة: <span className="badge">{savedScore}</span>
              </div>
            )}
          </div>

          <button className="btn" disabled={loading} style={{ width: 220, margin: "0 auto" }}>
            {loading ? "..." : "حفظ / Save"}
          </button>

          <div className="small" style={{ textAlign: "center" }}>
            يمكنك إعادة التقييم لاحقاً وسيتم تحديثه لنفس البريد.
          </div>
        </form>
      </div>
    </div>
  );
}
