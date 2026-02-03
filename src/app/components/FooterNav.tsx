import Link from "next/link";

const items = [
  { href: "/program", ar: "برنامج المؤتمر", en: "Program" },
  { href: "/poster-vote", ar: "تصويت أفضل بوستر", en: "Best Poster Vote" },
  { href: "/evaluation", ar: "تقييم المؤتمر", en: "Conference Evaluation" },
  { href: "/supporters", ar: "الداعمون", en: "Supporters" },
  { href: "/chatbot", ar: "Chatbot", en: "Chatbot" },
];

export default function FooterNav() {
  return (
    <footer style={{ marginTop: 18, paddingBottom: 16 }}>
      <div className="container">
        <div
          className="card"
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
            padding: 12,
          }}
        >
          {items.map((it) => (
            <Link key={it.href} href={it.href} className="badge" style={{ fontWeight: 800 }}>
              {it.ar} / {it.en}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
