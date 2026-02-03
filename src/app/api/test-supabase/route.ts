import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("registrations")
    .select("id")
    .limit(1);

  if (error) {
    return NextResponse.json({
      ok: false,
      note: "إذا لم تنشئ جدول registrations بعد فهذا طبيعي",
      error: error.message,
    });
  }

  return NextResponse.json({ ok: true, sample: data });
}
