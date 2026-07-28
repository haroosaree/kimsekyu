import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

const recipient = process.env.CONTACT_RECIPIENT_EMAIL || "kimsekyu@gmail.com";
const expectedAction = "contact";

function escapeHTML(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}

async function verifyTurnstile(token: unknown, request: Request) {
  const hostnames = new Set((process.env.TURNSTILE_HOSTNAMES ?? "").split(",").map((host) => host.trim()).filter(Boolean));
  if (typeof token !== "string" || token.length === 0 || token.length > 2048 || !process.env.TURNSTILE_SECRET || hostnames.size === 0) return false;
  const remoteip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: AbortSignal.timeout(10000), body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: token, ...(remoteip ? { remoteip } : {}) }) });
    const result = await response.json() as { success?: boolean; action?: string; hostname?: string };
    return response.ok && result.success === true && result.action === expectedAction && typeof result.hostname === "string" && hostnames.has(result.hostname);
  } catch { return false; }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!(await verifyTurnstile(body?.token, request))) return NextResponse.json({ message: "보안 인증에 실패했습니다. 다시 시도해 주세요." }, { status: 403 });
  const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  if (!subject || !message || !name || !email || subject.length > 160 || message.length > 5000 || name.length > 120 || email.length > 254 || phone.length > 40) return NextResponse.json({ message: "필수 항목을 확인해 주세요." }, { status: 400 });

  const emailToken = process.env.CLOUDFLARE_EMAIL_API_TOKEN;
  const accountID = process.env.CLOUDFLARE_ACCOUNT_ID;
  const emailFrom = process.env.EMAIL_FROM;
  if (!emailToken || !accountID || !emailFrom) return NextResponse.json({ message: "이메일 서비스가 아직 설정되지 않았습니다." }, { status: 503 });

  const safeSubject = escapeHTML(subject); const safeMessage = escapeHTML(message).replace(/\n/g, "<br>"); const safeName = escapeHTML(name); const safeEmail = escapeHTML(email); const safePhone = escapeHTML(phone || "미입력");
  const emailResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountID)}/email/sending/send`, { method: "POST", headers: { Authorization: `Bearer ${emailToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ to: recipient, from: { address: emailFrom, name: "Kim Sekyu Real Estate" }, reply_to: email, subject: `[문의하기] ${subject}`, html: `<h2>${safeSubject}</h2><p><strong>이름:</strong> ${safeName}<br><strong>이메일:</strong> ${safeEmail}<br><strong>전화번호:</strong> ${safePhone}</p><p>${safeMessage}</p>`, text: `제목: ${subject}\n이름: ${name}\n이메일: ${email}\n전화번호: ${phone || "미입력"}\n\n${message}` }) });
  if (!emailResponse.ok) {
    const providerError = await emailResponse.text().catch(() => "");
    console.error("Cloudflare Email Sending rejected contact message", { status: emailResponse.status, response: providerError.slice(0, 1000) });
    return NextResponse.json({ message: "문의 이메일 전송에 실패했습니다. 잠시 후 다시 시도하시거나 kimsekyu@gmail.com 으로 문의 바랍니다." }, { status: 502 });
  }

  const payload = await getPayload({ config });
  await payload.create({ collection: "questions", data: { subject, message, name, email, phone, publishedAt: new Date().toISOString(), viewCount: 0, status: "new" }, overrideAccess: true });
  return NextResponse.json({ ok: true }, { status: 201 });
}
