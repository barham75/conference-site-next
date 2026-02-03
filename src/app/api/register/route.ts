import { NextResponse } from "next/server";

function jsonResponse(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function makeUserCookie(user: { fullName: string; email: string; org: string }) {
  const json = JSON.stringify(user);
  const b64 = Buffer.from(json, "utf8").toString("base64");
  const value = encodeURIComponent(b64);

  // Cookie صالح 30 يوم
  const maxAge = 60 * 60 * 24 * 30;

  return `conf_user=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export async function POST(req: Request) {
  try {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
      return jsonResponse({ ok: false, error: "Missing GOOGLE_SCRIPT_URL in env" }, 500);
    }

    const body = (await req.json()) as {
      fullName?: string;
      email?: string;
      phone?: string;
      org?: string;
    };

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const org = String(body.org || "").trim();

    if (!fullName) return jsonResponse({ ok: false, error: "الاسم الكامل مطلوب" }, 400);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return jsonResponse({ ok: false, error: "يرجى إدخال بريد إلكتروني صحيح" }, 400);

    // أرسل البيانات إلى Google Apps Script (يحفظها في Google Sheet)
    const r = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // تأكد أن أسماء الحقول نفس كود Apps Script
      body: JSON.stringify({ fullName, email, phone, org }),
      cache: "no-store",
    });

    const text = await r.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      // إذا رجع نص غير JSON
      data = { ok: false, error: text };
    }

    if (!r.ok || !data?.ok) {
      return jsonResponse(
        { ok: false, error: data?.error || "فشل حفظ البيانات في Google Sheet" },
        500
      );
    }

    // ضع Cookie لتسجيل الدخول (يستخدمه poster-vote / evaluation)
    const res = jsonResponse({ ok: true });
    res.headers.set("Set-Cookie", makeUserCookie({ fullName, email, org }));

    return res;
  } catch (e: any) {
    return jsonResponse({ ok: false, error: e?.message || "Server error" }, 500);
  }
}

// (اختياري) GET يرجع المستخدم المسجّل من Cookie
export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/conf_user=([^;]+)/);
  if (!match) return jsonResponse({ ok: true, user: null });

  try {
    const b64 = decodeURIComponent(match[1]);
    const json = Buffer.from(b64, "base64").toString("utf8");
    const user = JSON.parse(json);
    return jsonResponse({ ok: true, user });
  } catch {
    return jsonResponse({ ok: true, user: null });
  }
}
