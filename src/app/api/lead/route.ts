import { type NextRequest, NextResponse } from "next/server";

// ============================================================
//   Приём заявок с форм: бронь (страница квартиры / карточка избранного) и
//   Contact. Пока БЕЗ реальной отправки письма — принимаем, валидируем и
//   логируем. Номер квартиры (для брони) уже в payload → его подхватит письмо,
//   когда здесь подключат почту/CRM.
//   TODO: отправка письма (номер квартиры = data.apartmentNumber).
// ============================================================
type LeadPayload = {
  source?: "booking" | "contact";
  name?: string;
  phone?: string;
  comment?: string;
  apartmentNumber?: number | null;
};

export async function POST(request: NextRequest) {
  const data = (await request.json().catch(() => null)) as LeadPayload | null;

  if (!data?.name || !data?.phone) {
    return NextResponse.json(
      { message: "name and phone are required" },
      { status: 400 },
    );
  }

  const lead = {
    source: data.source ?? "unknown",
    name: data.name,
    phone: data.phone,
    comment: data.comment ?? "",
    // Для брони — номер квартиры, от которой пришла форма (пойдёт в письмо).
    apartmentNumber: data.apartmentNumber ?? null,
  };

  console.log("[lead]", lead);

  return NextResponse.json({ ok: true });
}
