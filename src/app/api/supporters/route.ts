import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

function getUserFromCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/conf_user=([^;]+)/);
  if (!match) return null;

  try {
    const b64 = decodeURIComponent(match[1]);
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json) as { fullName: string; email: string; org: string };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    // حماية: لازم مسجل
    const user = getUserFromCookie(req);
    if (!user?.email) {
      return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
    }

    const filePath = path.join(process.cwd(), "data", "supporters.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { ok: false, error: "لم يتم العثور على الملف: data/supporters.json" },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const items = JSON.parse(raw);

    if (!Array.isArray(items)) {
      return NextResponse.json({ ok: false, error: "صيغة الملف غير صحيحة (يجب أن تكون Array)" }, { status: 400 });
    }

    // تنظيف بسيط
    const cleaned = items
      .map((x) => ({
        nameAr: String(x?.nameAr || "").trim(),
        nameEn: String(x?.nameEn || "").trim(),
        logo: String(x?.logo || "").trim(),
      }))
      .filter((x) => x.nameAr || x.nameEn);

    return NextResponse.json({ ok: true, items: cleaned });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
