import { type NextRequest, NextResponse } from "next/server";

// ============================================================
//   Приём заявок с форм: бронь (страница квартиры / карточка избранного) и
//   Contact. Пока БЕЗ реальной отправки письма — принимаем, валидируем и
//   логируем факт заявки (без PII). Номер квартиры (для брони) уже в payload →
//   его подхватит письмо, когда здесь подключат почту/CRM.
//   TODO: отправка письма (номер квартиры = data.apartmentNumber).
// ============================================================
type LeadPayload = {
  source?: "booking" | "contact";
  name?: string;
  phone?: string;
  email?: string;
  comment?: string;
  apartmentNumber?: number | null;
};

// Лимиты полей (SEC-002): защищают лог/CRM от гигантских payload'ов.
const MAX_BODY_BYTES = 8 * 1024; // 8 КБ на заявку — с запасом
const LIMITS = { name: 120, phone: 32, email: 254, comment: 2000 } as const;

// Простой in-memory rate-limit (SEC-002). Best-effort: на процесс, сбрасывается
// при деплое. Для self-hosted single-origin (blue-green) достаточно как первый
// барьер против спам-флуда; полноценный распределённый лимит — на уровне прокси.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10; // 10 заявок / мин с одного IP
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) {
    hits.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    // Ленивая уборка протухших записей, чтобы Map не рос бесконечно.
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
    }
    return false;
  }
  rec.count += 1;
  return rec.count > RATE_MAX;
}

// Обрезаем управляющие символы (\r \n \t и прочие) — иначе они попадают в лог/CRM
// и позволяют log-injection (SEC-003). Плюс режем по длине.
function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\x00-\x1F\x7F]/g, " ").trim().slice(0, max);
}

function clientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : "").trim() || "unknown";
}

export async function POST(request: NextRequest) {
  // Same-origin: форма постит с этого же сайта (SEC-002, анти-CSRF/анти-бот).
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("host");
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = "";
    }
    if (!originHost || originHost !== host) {
      return NextResponse.json({ message: "forbidden" }, { status: 403 });
    }
  }

  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ message: "too many requests" }, { status: 429 });
  }

  // Ограничение размера тела (SEC-002): и по заголовку, и по факту.
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ message: "payload too large" }, { status: 413 });
  }
  const raw = await request.text().catch(() => "");
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ message: "payload too large" }, { status: 413 });
  }

  let data: LeadPayload | null = null;
  try {
    data = JSON.parse(raw) as LeadPayload;
  } catch {
    data = null;
  }

  const name = clean(data?.name, LIMITS.name);
  const phone = clean(data?.phone, LIMITS.phone);
  if (!name || !phone) {
    return NextResponse.json(
      { message: "name and phone are required" },
      { status: 400 },
    );
  }

  const email = clean(data?.email, LIMITS.email);
  // Мягкая проверка формата e-mail (если указан) — не блокирует заявку без него.
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "invalid email" }, { status: 400 });
  }

  const lead = {
    source: data?.source === "booking" || data?.source === "contact"
      ? data.source
      : "unknown",
    name,
    phone,
    email,
    comment: clean(data?.comment, LIMITS.comment),
    // Для брони — номер квартиры, от которой пришла форма (пойдёт в письмо).
    apartmentNumber:
      typeof data?.apartmentNumber === "number" ? data.apartmentNumber : null,
  };

  // НЕ логируем PII (имя/телефон/email/коммент) — SEC-003. Только факт заявки.
  console.log("[lead] received", {
    source: lead.source,
    hasEmail: Boolean(lead.email),
    apartmentNumber: lead.apartmentNumber,
  });
  // TODO: отправить `lead` в CRM/почту по аутентифицированному каналу.

  return NextResponse.json({ ok: true });
}
