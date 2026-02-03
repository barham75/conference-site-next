"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function PosterVotePage() {
  const router = useRouter();
  const posters = useMemo(() => Array.from({ length: 20 }, (_, i) => `P${i + 1}`), []);

  const [posterId, setPosterId] = useState(posters[0]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submitVote(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const r = await fetch("/api/poster-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posterId }),
      });

      const data = await r.json();

      if (!r.ok || !data?.ok) {
        setMsg({ type: "err", text: data?.error || "فشل التصويت" });
        setLoading(false);
        return;
      }

      setMsg({ type: "ok", text: "تم التصويت بنجاح ✅" });

      // بعد التصويت يمكنك تحويله لأي صفحة
      // router.push("/evaluation");
      router.refresh();
    } catch (e: any) {
      setMsg({ type: "err", text: e?.message || "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-start justify-center px-4 py-10" dir="rtl">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border p-8">
        <h1 className="text-4xl font-bold text-center mb-8">تصويت أفضل بوستر</h1>

        <form onSubmit={submitVote} className="space-y-6">
          <div>
            <label className="block mb-2 font-semibold">اختر رقم البوستر</label>
            <select
              className="w-full rounded-xl border px-4 py-3"
              value={posterId}
              onChange={(e) => setPosterId(e.target.value)}
            >
              {posters.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl py-4 font-bold bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
          >
            {loading ? "جارٍ الإرسال..." : "إرسال التصويت"}
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

        <div className="mt-6 text-center">
          <button
            className="underline"
            onClick={() => router.push("/register")}
          >
            العودة للتسجيل
          </button>
        </div>
      </div>
    </main>
  );
}
