"use client";

import { useEffect, useMemo, useState } from "react";

type User = { fullName: string; email: string; org: string };
type ResultRow = { posterId: string; votes: number };

export default function VoteClient({ user }: { user: User }) {
  const posters = useMemo(
    () => Array.from({ length: 30 }, (_, i) => `P${i + 1}`),
    []
  );

  const [posterId, setPosterId] = useState("P1");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const [results, setResults] = useState<ResultRow[]>([]);
  const [total, setTotal] = useState(0);
  const [myVote, setMyVote] = useState<string | null>(null);

  async function loadResults() {
    try {
      const r = await fetch("/api/poster-vote", { cache: "no-store" });
      const d = await r.json();
      if (d?.ok) {
        setResults(d.results || []);
        setTotal(d.total || 0);
      }
    } catch {}
  }

  async function loadMyVote() {
    try {
      const r = await fetch("/api/poster-vote?mine=1", { cache: "no-store" });
      const d = await r.json();
      if (d?.ok) setMyVote(d.vote || null);
    } catch {}
  }

  useEffect(() => {
    loadResults();
    loadMyVote();
  }, []);

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

      const d = await r.json();

      if (!r.ok || !d?.ok) {
        // لو مصوّت سابقاً
        if (d?.alreadyVoted && d?.vote) {
          setMyVote(d.vote);
          setMsg({
            type: "err",
            text: `لا يمكن التصويت أكثر من مرة. لقد صوّتت سابقاً لـ ${d.vote}.`,
          });
        } else {
          setMsg({ type: "err", text: d?.error || "حدث خطأ." });
        }
      } else {
        setMyVote(posterId);
        setMsg({ type: "ok", text: `تم تسجيل صوتك لـ ${posterId} ✅` });
        await loadResults();
      }
    } catch {
      setMsg({ type: "err", text: "تعذر الاتصال بالسيرفر." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h1 className="h1">تصويت أفضل بوستر / Best Poster Vote</h1>
        <div className="small">
          <span className="badge" style={{ marginInlineEnd: 8 }}>
            {user.email}
          </span>
          <span className="badge">{user.fullName}</span>
        </div>

        {myVote && (
          <div className="success" style={{ marginTop: 10 }}>
            لقد صوّتت سابقاً لـ <b>{myVote}</b>.
          </div>
        )}

        {msg && (
          <div
            className={msg.type === "ok" ? "success" : "error"}
            style={{ marginTop: 10 }}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={submitVote} style={{ marginTop: 12 }}>
          <div className="grid grid-2" style={{ alignItems: "end" }}>
            <label className="grid" style={{ gap: 6 }}>
              <div style={{ fontWeight: 900 }}>اختر البوستر / Choose Poster</div>
              <select
                className="select"
                value={posterId}
                onChange={(e) => setPosterId(e.target.value)}
                disabled={!!myVote}
              >
                {posters.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <div className="small">يسمح لكل بريد إلكتروني بصوت واحد فقط.</div>
            </label>

            <button className="btn" disabled={loading || !!myVote}>
              {loading ? "..." : myVote ? "تم التصويت" : "تأكيد التصويت / Vote"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <h2 className="h2" style={{ margin: 0 }}>
            نتائج التصويت / Results
          </h2>
          <span className="badge">Total Votes: {total}</span>
        </div>

        <div className="tableWrap" style={{ marginTop: 10 }}>
          <table>
            <thead>
              <tr>
                <th>Poster</th>
                <th>Votes</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ textAlign: "center" }}>
                    لا يوجد أصوات بعد.
                  </td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr key={r.posterId}>
                    <td style={{ fontWeight: 900 }}>{r.posterId}</td>
                    <td>{r.votes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="small" style={{ marginTop: 8 }}>
          يتم ترتيب النتائج من الأعلى للأقل تلقائياً.
        </div>
      </div>
    </div>
  );
}
