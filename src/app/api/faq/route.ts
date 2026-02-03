import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import mammoth from "mammoth";

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

type QA = { q: string; a: string };

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();
}

function scoreMatch(query: string, text: string) {
  // بحث بسيط وعملي: نقاط على الكلمات المشتركة
  const q = normalize(query);
  const t = normalize(text);
  if (!q || !t) return 0;

  if (t.includes(q)) return 100; // تطابق قوي

  const qWords = new Set(q.split(" ").filter((w) => w.length >= 2));
  const tWords = new Set(t.split(" ").filter((w) => w.length >= 2));

  let hit = 0;
  for (const w of qWords) if (tWords.has(w)) hit++;

  return hit; // كلما زادت الكلمات المشتركة زادت النتيجة
}

function parseQA(rawText: string): QA[] {
  // يدعم:
  // Q: ... A: ...
  // س: ... ج: ...
  // Question: ... Answer: ...
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const qa: QA[] = [];
  let currentQ = "";
  let currentA = "";
  let mode: "none" | "q" | "a" = "none";

  const isQ = (l: string) =>
    /^(q|question|س|سؤال)\s*[:\-]/i.test(l);
  const isA = (l: string) =>
    /^(a|answer|ج|جواب|إجابة)\s*[:\-]/i.test(l);

  const stripTag = (l: string) =>
    l.replace(/^(q|question|س|سؤال|a|answer|ج|جواب|إجابة)\s*[:\-]\s*/i, "").trim();

  function pushIfReady() {
    const q = currentQ.trim();
    const a = currentA.trim();
    if (q && a) qa.push({ q, a });
    currentQ = "";
    currentA = "";
    mode = "none";
  }

  for (const l of lines) {
    if (isQ(l)) {
      // سؤال جديد -> خزّن السابق
      pushIfReady();
      currentQ = stripTag(l);
      mode = "q";
      continue;
    }
    if (isA(l)) {
      currentA = stripTag(l);
      mode = "a";
      continue;
    }

    // تكملة أسطر
    if (mode === "q") currentQ += (currentQ ? " " : "") + l;
    else if (mode === "a") currentA += (currentA ? " " : "") + l;
  }

  pushIfReady();

  // إذا لم نجد أي Q/A بصيغة tags، نرجع فارغ (لتنبيه المستخدم)
  return qa;
}

async function readDocxText(filePath: string) {
  const buf = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer: buf });
  return (result.value || "").trim();
}

export async function GET(req: Request) {
  try {
    // حماية: لازم مسجل
    const user = getUserFromCookie(req);
    if (!user?.email) {
      return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();

    const filePath = path.join(process.cwd(), "data", "faq.docx");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { ok: false, error: "لم يتم العثور على الملف: data/faq.docx" },
        { status: 404 }
      );
    }

    const raw = await readDocxText(filePath);
    if (!raw) {
      return NextResponse.json({ ok: false, error: "ملف Word فارغ." }, { status: 400 });
    }

    const pairs = parseQA(raw);
    if (pairs.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "لم أجد صيغة أسئلة/أجوبة داخل الملف. استخدم تنسيق مثل: س: ... ثم ج: ... أو Q: ... ثم A: ...",
        },
        { status: 400 }
      );
    }

    // إذا ما في سؤال، رجع قائمة مختصرة (أول 10 أسئلة)
    if (!q) {
      return NextResponse.json({
        ok: true,
        mode: "list",
        total: pairs.length,
        items: pairs.slice(0, 10).map((x) => ({ q: x.q })),
      });
    }

    // ابحث أفضل نتائج
    const scored = pairs
      .map((p) => ({
        q: p.q,
        a: p.a,
        s: scoreMatch(q, p.q + " " + p.a),
      }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s);

    if (scored.length === 0) {
      return NextResponse.json({
        ok: true,
        mode: "none",
        answer: null,
        suggestions: pairs.slice(0, 8).map((x) => x.q),
      });
    }

    const best = scored[0];
    const suggestions = scored.slice(0, 5).map((x) => x.q);

    return NextResponse.json({
      ok: true,
      mode: "answer",
      answer: { q: best.q, a: best.a },
      suggestions,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
