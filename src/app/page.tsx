import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type ConfUser = { fullName: string; email: string; org: string };

function readUser(): ConfUser | null {
  const c = cookies().get("conf_user")?.value;
  if (!c) return null;

  try {
    const json = Buffer.from(c, "base64").toString("utf8");
    return JSON.parse(json) as ConfUser;
  } catch {
    return null;
  }
}

const items = [
  { href: "/program", ar: "برنامج المؤتمر", en: "Program" },
  { href: "/poster-vote", ar: "تصويت أفضل بوستر", en: "Best Poster Vote" },
  { href: "/evaluation", ar: "تقييم المؤتمر", en: "Conference Evaluation" },
  { href: "/supporters", ar: "الداعمون", en: "Supporters" },
  { href: "/chatbot", ar: "Chatbot", en: "Chatbot" },
];

export default function HomePage() {
  const user = readUser();

  // إذا ما في تسجيل دخول → إلى صفحة التسجيل
  if (!user) redirect("/register");

  return (
    <main style={{ maxWidth: 980, margin: "30px auto", padding: "0 16px" }}>
      <div
        style={{
          padding: 16,
          borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.08)",
          background: "white",
          marginBottom: 14,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
          Welcome, {user.fullName}
        </h1>

        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,0.1)",
              fontSize: 13,
            }}
          >
            {user.email}
          </span>

          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,0.1)",
              fontSize: 13,
            }}
          >
            {user.org || "—"}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            style={{
              display: "block",
              padding: 16,
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "white",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 16 }}>
              {it.ar} / {it.en}
            </div>
            <div style={{ marginTop: 6, opacity: 0.7, fontSize: 13 }}>
              فتح / Open
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
