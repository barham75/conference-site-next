"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [org, setOrg] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!fullName.trim()) {
      setMsg({ type: "err", text: "الاسم الكامل مطلوب." });
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMsg({ type: "err", text: "يرجى إدخال بريد إلكتروني صحيح." });
      return;
    }

    setLoading(true);
    try {
      const r = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: cleanEmail,
          phone: phone.trim(),
          org: org.trim(),
        }),
      });

      const data = await r.json();

      if (!r.ok || !data?.ok) {
        setMsg({ type: "err", text: data?.error || "حدث خطأ أثناء التسجيل." });
        setLoading(false);
        return;
      }

      setMsg({ type: "ok", text: "تم التسجيل بنجاح ✅" });

      // بعد التسجيل: اذهب للصفحة الرئيسية أو لأي صفحة تريد
      // إذا أنت تريدها تفتح صفحة التصويت مثلًا، غيّر الرابط
      router.push("/poster-vote");
      router.refresh();
    } catch (err: any) {
      setMsg({ type: "err", text: err?.message || "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border p-8">
        <h1 className="text-4xl font-bold text-center mb-8">التسجيل</h1>

        <form onSubmit={submit} className="space-y-6" dir="rtl">
          <div>
            <label className="block mb-2 font-semibold">الاسم الكامل *</label>
            <input
              className="w-full rounded-xl border px-4 py-3 outline-none focus:ring"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: محمد برهم"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">البريد الإلكتروني *</label>
            <input
              className="w-full rounded-xl border px-4 py-3 outline-none focus:ring"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              type="email"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">رقم الهاتف</label>
            <input
              className="w-full rounded-xl border px-4 py-3 outline-none focus:ring"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="079xxxxxxx"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">الجامعة / المؤسسة</label>
            <input
              className="w-full rounded-xl border px-4 py-3 outline-none focus:ring"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="Jerash University"
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl py-4 font-bold bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
          >
            {loading ? "جارٍ الحفظ..." : "دخول"}
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
      </div>
    </main>
  );
}
