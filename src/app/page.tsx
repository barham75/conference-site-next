import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type UserCookie = { fullName: string; email: string; org: string };

function readUser(): UserCookie | null {
  const c = cookies().get("conf_user")?.value;
  if (!c) return null;

  try {
    const json = Buffer.from(decodeURIComponent(c), "base64").toString("utf8");
    return JSON.parse(json) as UserCookie;
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
  if (!user) redirect("/register");

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "24px 16px" }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 16,
          padding: 16,
          marginBottom: 14,
          boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
          مرحبًا، {user.fullName}
        </h1>
        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background: "#eef6ff",
              border: "1px solid rgba(0,0,0,0.06)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {user.email}
          </span>
          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              background: "#f3fff3",
              border: "1px solid rgba(0,0,0,0.06)",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {user.org}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            style={{
              textDecoration: "none",
              color: "inherit",
              background: "#fff",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 16,
              padding: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 16 }}>
              {it.ar} / {it.en}
            </div>
            <div style={{ opacity: 0.7, marginTop: 6, fontSize: 13 }}>
              فتح / Open
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
