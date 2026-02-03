import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";

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

function cellToText(v: any) {
  if (v == null) return "";
  // ExcelJS قد يرجع objects للـ rich text أو dates
  if (typeof v === "object") {
    if (v.text) return String(v.text);
    if (v.richText && Array.isArray(v.richText)) return v.richText.map((x: any) => x.text || "").join("");
    if (v.result != null) return String(v.result);
  }
  return String(v);
}

export async function GET(req: Request) {
  try {
    // حماية: لازم يكون مسجل (نفس باقي الصفحات)
    const user = getUserFromCookie(req);
    if (!user?.email) {
      return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
    }

    const filePath = path.join(process.cwd(), "data", "program.xlsx");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { ok: false, error: "لم يتم العثور على ملف البرنامج: data/program.xlsx" },
        { status: 404 }
      );
    }

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);

    const ws = wb.worksheets[0];
    if (!ws) {
      return NextResponse.json({ ok: false, error: "لا يوجد Sheets داخل ملف Excel" }, { status: 400 });
    }

    // العناوين من الصف الأول
    const headerRow = ws.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      const h = cellToText(cell.value).trim();
      headers[colNumber - 1] = h || `Column${colNumber}`;
    });

    // البيانات من الصف 2 إلى آخر صف
    const rows: Record<string, string>[] = [];
    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      // تجاهل الصفوف الفارغة
      let nonEmpty = false;

      const obj: Record<string, string> = {};
      for (let c = 1; c <= headers.length; c++) {
        const key = headers[c - 1] || `Column${c}`;
        const value = cellToText(row.getCell(c).value).trim();
        if (value) nonEmpty = true;
        obj[key] = value;
      }

      if (nonEmpty) rows.push(obj);
    }

    // محاولة استخراج "اليوم" إن وُجد عمود Day/اليوم
    const dayKey =
      headers.find((h) => h.toLowerCase() === "day") ||
      headers.find((h) => h.includes("اليوم")) ||
      headers.find((h) => h.toLowerCase().includes("day"));

    const days = dayKey
      ? Array.from(new Set(rows.map((x) => (x[dayKey] || "").trim()).filter(Boolean)))
      : [];

    return NextResponse.json({
      ok: true,
      sheetName: ws.name,
      headers,
      rows,
      dayKey: dayKey || null,
      days,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
