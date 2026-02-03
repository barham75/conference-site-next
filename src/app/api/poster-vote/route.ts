import { NextResponse } from "next/server";

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

export async function POST(req: Request) {
  try {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (!scriptUrl) {
      return NextResponse.json({ ok: false, error: "Missing GOOGLE_SCRIPT_URL" }, { status: 500 });
    }

    const user = getUserFromCookie(req);
    if (!user?.email) {
      return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
    }
    const email = String(user.email).trim().toLowerCase();

    const body = (await req.json()) as { posterId?: string };
    const posterId = String(body.posterId || "").trim();
    if (!posterId) {
      return NextResponse.json({ ok: false, error: "PosterId required" }, { status: 400 });
    }

    const r = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "posterVote", email, posterId }),
      cache: "no-store",
    });

    const text = await r.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { ok: false, error: text }; }

    if (!r.ok || !data?.ok) {
      return NextResponse.json({ ok: false, error: data?.error || "Vote failed" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
