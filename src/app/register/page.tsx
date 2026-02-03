"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [university, setUniversity] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setMsg({ type: "err", text: "يرجى إدخال الاسم." });
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMsg({ type: "err", text: "يرجى إدخال بريد إلكتروني صحيح." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ مهم لضمان حفظ الكوكي
        body: JSON.stringify({
          full_name: cleanName,
          email: cleanEmail,
          phone: phone.trim(),
          university: university.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        setMsg({
          type: "err",
          text: data?.error || "حدث خطأ أثناء التسجيل. حاول مرة أخرى.",
        });
        return;
      }

      setMsg({ type: "ok", text: "تم التسجيل بنجاح ✅" });

      // ✅ توجيه للصفحة الرئيسية
      router.replace("/");
    } catch {
      setMsg({ type: "err", text: "تعذر الاتصال بالسيرفر." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ textAlign: "center", marginBottom: 18 }}>التسجيل</h1>

      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>الاسم الكامل *</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="اكتب الاسم"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>البريد الإلكتروني *</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>رقم الهاتف</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07xxxxxxxx"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>الجامعة / المؤسسة</span>
          <input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="مثال: جامعة جرش"
            style={inputStyle}
          />
        </label>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "جارٍ الحفظ..." : "دخول"}
        </button>

        {msg && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: msg.type === "ok" ? "#e7f8ee" : "#fdecec",
              color: "#111",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            {msg.text}
          </div>
        )}
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.2)",
  outline: "none",
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  fontSize: 15,
};
