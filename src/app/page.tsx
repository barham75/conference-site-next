import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function readUser() {
  const c = cookies().get("conf_user")?.value;
  if (!c) return null;
  try {
    const json = Buffer.from(c, "base64").toString("utf8");
    return JSON.parse(json) as { fullName: string; email: string; org: string };
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
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h1 className="h1" style={{ marginBottom: 6 }}>
          Welcome, {user.fullName}
        </h1>
        <div className="small">
          <span className="badge" style={{ marginInlineEnd: 8 }}>{user.email}</span>
          <span className="badge">{user.org}</span>
        </div>
      </div>

      <div className="grid grid-2">
        {items.map((it) => (
          <Link key={it.href} href={it.href} className="card">
            <div style={{ fontWeight: 900, fontSize: 16 }}>
              {it.ar} / {it.en}
            </div>
            <div className="small" style={{ marginTop: 6 }}>فتح / Open</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
