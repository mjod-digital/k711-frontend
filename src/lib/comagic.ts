"use client";

// ============================================================
//   Отправка заявок с форм в CoMagic (скрипт cs.min.js подключён в layout.tsx).
//   Метод Comagic.addOfflineRequest({name,email,phone,message}, cb) — своих
//   произвольных полей у него нет, поэтому источник, комментарий и данные
//   квартиры собираем в текст message. Дополнительно дублируем заявку на
//   /api/lead (серверный лог / точка для будущей почты-CRM) — «добавляем
//   отправку через комеджик», не убирая прежний канал.
//   Док: https://comagic.github.io/javascript_api/manual/js_api/
// ============================================================

type ComagicOfflineRequest = {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  // Кастомные поля заявки (ext_id из CoMagic, метод get.offline_message_user_fields):
  sopd?: string; // «Согласие о ПД»
  mailing?: string; // «Согласие на рассылки»
};

type ComagicApi = {
  addOfflineRequest: (
    req: ComagicOfflineRequest,
    cb?: (o: { success: boolean; result?: unknown }) => void,
  ) => void;
};

declare global {
  interface Window {
    Comagic?: ComagicApi;
  }
}

export type LeadApartment = {
  number: number;
  area?: number; // м²
  floor?: number;
  bedrooms?: number;
  totalPrice?: number; // ₽
};

export type Lead = {
  source: "contact" | "booking";
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  comment?: string | null;
  apartment?: LeadApartment | null;
  /** Согласие на обработку персональных данных (обязательный чекбокс). */
  consent?: boolean;
  /** Согласие на маркетинговые рассылки (необязательный чекбокс). */
  marketing?: boolean;
};

const SOURCE_LABEL: Record<Lead["source"], string> = {
  contact: "Заявка с сайта",
  booking: "Бронирование резиденции",
};

const rub = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;

function apartmentLine(a: LeadApartment): string {
  const parts = [`№${a.number}`];
  if (a.area != null) parts.push(`${a.area} м²`);
  if (a.floor != null) parts.push(`${a.floor} этаж`);
  if (a.bedrooms != null) parts.push(`${a.bedrooms}-комн.`);
  if (a.totalPrice != null) parts.push(rub(a.totalPrice));
  return parts.join(", ");
}

// Согласия (ПД/рассылка) больше НЕ пишем в текст — они уходят в отдельные
// поля sopd/mailing. В message остаются источник, квартира и комментарий
// (для них выделенных полей в аккаунте нет).
function buildMessage(lead: Lead): string {
  const lines = [SOURCE_LABEL[lead.source]];
  if (lead.apartment) lines.push(`Квартира: ${apartmentLine(lead.apartment)}`);
  if (lead.comment) lines.push(`Комментарий: ${lead.comment}`);
  return lines.join("\n");
}

// CoMagic грузится afterInteractive — к моменту сабмита обычно готов. На всякий
// ждём появления window.Comagic до ~3с, потом сдаёмся (заявка всё равно уйдёт
// в /api/lead). Так первая форма после загрузки страницы не теряется.
function withComagic(cb: (api: ComagicApi) => void, tries = 20): void {
  if (typeof window === "undefined") return;
  const api = window.Comagic;
  if (api?.addOfflineRequest) {
    cb(api);
    return;
  }
  if (tries <= 0) return;
  window.setTimeout(() => withComagic(cb, tries - 1), 150);
}

// Отправка заявки. Fire-and-forget: UI (попап успеха) не ждёт ответа.
export function sendLead(lead: Lead): void {
  const req: ComagicOfflineRequest = {
    name: lead.name?.trim() || "",
    phone: lead.phone?.trim() || "",
    email: lead.email?.trim() || "",
    message: buildMessage(lead),
  };
  // Согласия — в отдельные поля CoMagic по ext_id (sopd / mailing).
  if (lead.consent !== undefined) req.sopd = lead.consent ? "Да" : "Нет";
  if (lead.marketing !== undefined) req.mailing = lead.marketing ? "Да" : "Нет";

  withComagic((api) => {
    try {
      api.addOfflineRequest(req);
    } catch {
      /* не роняем UI, если CoMagic бросил ошибку */
    }
  });

  // Дубль на сервер — как было раньше (лог + будущая почта/CRM).
  void fetch("/api/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: lead.source,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      comment: lead.comment,
      apartmentNumber: lead.apartment?.number ?? null,
      consent: lead.consent ?? null,
      marketing: lead.marketing ?? null,
    }),
  }).catch(() => {});
}
