import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

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

async function isRegisteredInSupabase(email: string) {
  const { data, error } = await supabaseAdmin
    .from("registrations")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

function validateAnswers(answers: any): answers is number[] {
  return (
    Array.isArray(answers) &&
    answers.length === 5 &&
    answers.every((n) => typeof n === "number" && n >= 1 && n <= 5)
  );
}

export async function GET(req: Request) {
  try {
    const user = getUserFromCookie(req);
    const email = user?.email ? String(user.email).trim().toLowerCase() : null;

    // ✅ جلب جميع التقييمات لحساب الإحصائيات
    const { data, error } = await supabaseAdmin
      .from("evaluations")
      .select("email,q1,q2,q3,q4,q5,score100,updated_at");

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const rows = data ?? [];
    const count = rows.length;

    let sumScore = 0;
    const sumQ = [0, 0, 0, 0, 0];

    let mine: null | { answers: number[]; score: number; updatedAt: string } = null;

    for (const r of rows) {
      const q1 = Number((r as any).q1);
      const q2 = Number((r as any).q2);
      const q3 = Number((r as any).q3);
      const q4 = Number((r as any).q4);
      const q5 = Number((r as any).q5);
      const sc = Number((r as any).score100);

      if (
        !Number.isFinite(q1) || !Number.isFinite(q2) || !Number.isFinite(q3) ||
        !Number.isFinite(q4) || !Number.isFinite(q5) || !Number.isFinite(sc)
      ) {
        continue;
      }

      sumScore += sc;
      sumQ[0] += q1;
      sumQ[1] += q2;
      sumQ[2] += q3;
      sumQ[3] += q4;
      sumQ[4] += q5;

      const rowEmail = String((r as any).email || "").trim().toLowerCase();
      if (email && rowEmail === email) {
        mine = {
          answers: [q1, q2, q3, q4, q5],
          score: sc,
          updatedAt: String((r as any).updated_at || ""),
        };
      }
    }

    const avgScore = count ? Math.round((sumScore / count) * 10) / 10 : 0;
    const avgQuestions = sumQ.map((s) => (count ? Math.round((s / count) * 10) / 10 : 0));

    return NextResponse.json({
      ok: true,
      stats: { count, avgScore, avgQuestions },
      mine,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromCookie(req);
    if (!user?.email) {
      return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
    }

    const email = String(user.email).trim().toLowerCase();

    // ✅ لازم يكون مسجل (من Supabase)
    const okReg = await isRegisteredInSupabase(email);
    if (!okReg) {
      return NextResponse.json(
        { ok: false, error: "هذا البريد غير مسجل. الرجاء التسجيل أولاً." },
        { status: 403 }
      );
    }

    const body = (await req.json()) as { answers?: number[] };
    const answers = body.answers;

    if (!validateAnswers(answers)) {
      return NextResponse.json({ ok: false, error: "إجابات غير صحيحة" }, { status: 400 });
    }

    const sum = answers.reduce((a, b) => a + b, 0); // max 25
    const score = Math.round((sum / 25) * 100);
    const now = new Date().toISOString();

    // ✅ upsert: يحدث إذا موجود، يضيف إذا غير موجود
    const { error } = await supabaseAdmin
      .from("evaluations")
      .upsert(
        {
          email,
          q1: answers[0],
          q2: answers[1],
          q3: answers[2],
          q4: answers[3],
          q5: answers[4],
          score100: score,
          updated_at: now,
        },
        { onConflict: "email" }
      );

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // لمعرفة هل كان تحديث أو إضافة (اختياري)
    const { data: existing } = await supabaseAdmin
      .from("evaluations")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    return NextResponse.json({ ok: true, score, updated: Boolean(existing) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
