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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mine = url.searchParams.get("mine") === "1";

    const user = getUserFromCookie(req);
    const email = user?.email?.trim()?.toLowerCase();

    // ✅ تصويت المستخدم الحالي
    if (mine) {
      if (!email) return NextResponse.json({ ok: true, vote: null });

      const { data, error } = await supabaseAdmin
        .from("poster_votes")
        .select("poster_id")
        .eq("email", email)
        .maybeSingle();

      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

      return NextResponse.json({
        ok: true,
        vote: data?.poster_id ? String(data.poster_id).toUpperCase() : null,
      });
    }

    // ✅ النتائج + المجموع
    const { data, error } = await supabaseAdmin
      .from("poster_votes")
      .select("poster_id");

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    const counts = new Map<string, number>();
    let total = 0;

    for (const row of data ?? []) {
      const pid = String((row as any).poster_id || "").trim().toUpperCase();
      if (!pid) continue;
      total++;
      counts.set(pid, (counts.get(pid) || 0) + 1);
    }

    const results = Array.from(counts.entries())
      .map(([posterId, votes]) => ({ posterId, votes }))
      .sort((a, b) => b.votes - a.votes || a.posterId.localeCompare(b.posterId));

    return NextResponse.json({ ok: true, results, total });
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

    // ✅ لازم يكون مسجل في Supabase
    const okReg = await isRegisteredInSupabase(email);
    if (!okReg) {
      return NextResponse.json(
        { ok: false, error: "هذا البريد غير مسجل. الرجاء التسجيل أولاً." },
        { status: 403 }
      );
    }

    const body = (await req.json()) as { posterId: string };
    const posterId = String(body.posterId || "").trim().toUpperCase();

    // عدّل المدى إذا عندك 20 بدل 30… إلخ
    if (!/^P([1-9]|[12]\d|30)$/.test(posterId)) {
      return NextResponse.json({ ok: false, error: "PosterId غير صحيح" }, { status: 400 });
    }

    // ✅ منع تكرار التصويت (email unique)
    const { error } = await supabaseAdmin
      .from("poster_votes")
      .insert({ email, poster_id: posterId });

    if (error) {
      // تعارض unique يعني صوّت سابقًا
      if (String(error.message).toLowerCase().includes("duplicate")) {
        const { data: existing } = await supabaseAdmin
          .from("poster_votes")
          .select("poster_id")
          .eq("email", email)
          .maybeSingle();

        return NextResponse.json(
          {
            ok: false,
            alreadyVoted: true,
            vote: existing?.poster_id ? String(existing.poster_id).toUpperCase() : null,
          },
          { status: 409 }
        );
      }

      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
