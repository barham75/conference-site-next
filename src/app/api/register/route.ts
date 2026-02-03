import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function makeUserCookie(u: { fullName: string; email: string; org: string }) {
  const json = JSON.stringify(u);
  const b64 = Buffer.from(json, "utf8").toString("base64");
  return encodeURIComponent(b64);
}

async function openRegistrationsSheet() {
  const dataDir = path.join(process.cwd(), "data");
  ensureDir(dataDir);

  const filePath = path.join(dataDir, "registrations.xlsx");
  const wb = new ExcelJS.Workbook();

  if (fs.existsSync(filePath)) {
    await wb.xlsx.readFile(filePath);
  }

  let ws = wb.getWorksheet("Registrations");
  if (!ws) {
    ws = wb.addWorksheet("Registrations");
    // مهم: الإيميل بالعمود 2 لأنه مستخدم في isRegistered عندك
    ws.addRow(["FullName", "Email", "Phone", "University", "RegisteredAt"]);
  }

  return { wb, ws, filePath };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      full_name?: string;
      email?: string;
      phone?: string;
      university?: string;
    };

    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const university = String(body.university || "").trim();

    if (!fullName) {
      return NextResponse.json({ ok: false, error: "يرجى إدخال الاسم." }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "يرجى إدخال بريد إلكتروني صحيح." }, { status: 400 });
    }

    const { wb, ws, filePath } = await openRegistrationsSheet();

    // منع تكرار التسجيل بالإيميل
    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const e = String(row.getCell(2).value || "").trim().toLowerCase();
      if (e === email) {
        // حتى لو كان مسجل مسبقًا، نحدّث الكوكي ونعطي ok
        const res = NextResponse.json({ ok: true, already: true });
        const cookieVal = makeUserCookie({ fullName, email, org: university });
        res.headers.append(
          "Set-Cookie",
          `conf_user=${cookieVal}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
        );
        return res;
      }
    }

    ws.addRow([fullName, email, phone, university, new Date().toISOString()]);
    await wb.xlsx.writeFile(filePath);

    const res = NextResponse.json({ ok: true });
    const cookieVal = makeUserCookie({ fullName, email, org: university });
    res.headers.append(
      "Set-Cookie",
      `conf_user=${cookieVal}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`
    );
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
