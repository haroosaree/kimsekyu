import { NextResponse } from "next/server";
import { runAutoNews } from "../../../../scripts/auto-news-post";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expected = process.env.NEWS_AUTOMATION_SECRET;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || new URL(request.url).searchParams.get("secret");
  if (!expected || supplied !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const force = new URL(request.url).searchParams.get("force") === "true";
  const chicago = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "long", hour: "numeric", hour12: false }).formatToParts(new Date());
  const isMondayAtEight = chicago.some((part) => part.type === "weekday" && part.value === "Monday") && chicago.some((part) => part.type === "hour" && part.value === "08");
  if (!force && !isMondayAtEight) return NextResponse.json({ ok: true, skipped: "outside Monday 8:00 AM America/Chicago window" });
  const result = await runAutoNews();
  return NextResponse.json({ ok: true, result });
}
