"use client";

import { useEffect, useState } from "react";

export default function EvaluationPage() {
  const [answers, setAnswers] = useState<number[]>([5, 5, 5, 5, 5]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [stats, setStats] = useState<{ count: number; avgScore: number; avgQuestions: number[] } | null>(null);

  async function loadStats() {
    try {
      const r = await fetch("/api/evaluation", { cache: "no-store" });
      const d = await r.json();
      if (r.ok && d?.ok) setStats(d.stats);
    } catch {}
  }

  useEffect(() => {
    loadStats();
  }, []);

  function setQ(i: number, v: number) {
    const next = [...answers];
    next[i] = v;
    setAnswers(next);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const r = await fetch("/api/evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const d = await r.json();
      if (!r.ok || !d?.ok) {
        setMsg({ type: "err", text: d?.error || "فشل إرسال التقييم" });
        setLoading(false);
        return;
      }

      setMsg({ type: "ok", text: `تم حفظ التقييم ✅ (Score: ${d.score}%)` });
      await loadStats();
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Network error" });
    } finally {
      setLoading(false);
    }
  }

  const questions = [
    "التنظيم العام للمؤتمر",
    "جودة المحتوى العلمي",
    "سهولة التسجيل والموقع",
    "التواصل والدعم",
    "التجربة العامة",
  ];

  return (
    <main className="min-h-[70vh] flex items-start justify-center px-4 py-10" dir="rtl">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border p-8">
        <h1 className="text-4xl font-bold text-center mb-8">تقييم المؤتمر</h1>

        <form onSubmit={submit} className="space-y-6">
          {questions.map((q, i) => (
            <div key={i} className="rounded-xl border p-4">
              <div className="font-semibold mb-3">{q}</div>
              <div className="flex gap-3 justify-end flex-wrap">
                {[1, 2, 3, 4, 5].map((v) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`q${i}`}
                      checked={answers[i] === v}
                      onChange={() => setQ(i, v)}
                    />
                    <span>{v}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            disabled={loading}
            className="w-full rounded-xl py-4 font-bold bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
          >
            {loading ? "جارٍ الإرسال..." : "إرسال التقييم"}
          </button>

          {msg && (
            <div
              className={`rounded-xl px-4 py-3 text-center ${
                msg.type === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              {msg.text}
            </div>
          )}
        </form>

        {stats && (
          <div className="mt-8 rounded-2xl border p-6 bg-gray-50">
            <div className="font-bold mb-3">إحصائيات عامة</div>
            <div>عدد التقييمات: {stats.count}</div>
            <div>متوسط النتيجة: {stats.avgScore}%</div>
            <div className="mt-2">
              متوسط الأسئلة: {stats.avgQuestions.join(" / ")}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
