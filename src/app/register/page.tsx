import { NextResponse } from "next/server";

const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbyN-Yrs5f-fTfVt9DRDymmbMb9a1AaH3CENBAj20Vo53ntbmzlhUc97lZYbQHdyDfS3hg/exec";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const payload = {
      fullName: body.full_name,
      email: body.email,
      phone: body.phone,
      university: body.university,
    };

    const r = await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      throw new Error("Failed to save to Google Sheets");
    }

    const res = NextResponse.json({ ok: true });

    // Cookie للدخول
    const cookieValue = Buffer.from(JSON.stringify(payload)).toString("base64");
    res.headers.append(
      "Set-Cookie",
      `conf_user=${cookieValue}; Path=/; Max-Age=2592000; SameSite=Lax`
    );

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
