import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fullName = String(body.full_name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim() || null;
    const university = String(body.university ?? "").trim() || null;

    if (!fullName) {
      return NextResponse.json({ ok: false, error: "الاسم مطلوب." }, { status: 400 });
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "يرجى إدخال بريد إلكتروني صحيح." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("registrations")
      .upsert(
        { full_name: fullName, email, phone, university },
        { onConflict: "email" }
      );

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // ✅ نُرجع Response ونضع الكوكي عليه (هذا الأضمن)
    const res = NextResponse.json({ ok: true });

    const payload = { fullName, email, org: university || "" };
    const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");

    res.cookies.set("conf_user", encoded, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // أسبوع
    });

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
