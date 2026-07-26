import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (!subject || !message || !name || !email || subject.length > 160 || message.length > 5000) {
    return NextResponse.json({ message: "필수 항목을 확인해 주세요." }, { status: 400 });
  }

  const payload = await getPayload({ config });
  await payload.create({ collection: "questions", data: { subject, message, name, email, phone, publishedAt: new Date().toISOString(), viewCount: 0, status: "new" }, overrideAccess: true });
  return NextResponse.json({ ok: true }, { status: 201 });
}
