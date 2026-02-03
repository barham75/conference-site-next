import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* يمين: شعار الجامعة */}
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
          <Link href="/" aria-label="Home">
            <Image src="/jerash.png" alt="Jerash University" width={70} height={70} priority />
          </Link>
        </div>

        {/* الوسط: اسم المؤتمر */}
        <div style={{ flex: 3, textAlign: "center", lineHeight: 1.3 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>
            Chemistry Horizons: Innovation for a Sustainable Future
          </div>
          <div className="small" style={{ fontWeight: 800 }}>
            الأفق الكيميائي: ابتكار من أجل مستقبل مستدام
          </div>
        </div>

        {/* يسار: شعار المؤتمر */}
        <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <Link href="/" aria-label="Home">
            <Image src="/conference.png" alt="Conference Logo" width={70} height={70} priority />
          </Link>
        </div>
      </div>
    </header>
  );
}
