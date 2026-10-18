"use client";

// ============================================================
//   Отправка заявок с форм в CoMagic. ВАЖНО: виджет приходит из контейнера GTM
//   (из кода убран, см. layout.tsx), поэтому его может не быть — блокировщик
//   рекламы, фильтрующий DNS, сбой GTM. Это единственный канал доставки, так что
//   sendLead возвращает результат, а форма показывает успех только при нём.
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
  // Кастомные поля заявки идут в CoMagic ТОЛЬКО через user_fields. Формат JS API —
  // ОБЪЕКТ { ext_id: value } (НЕ массив [{ext_id,value}] — это формат Data API,
  // сервер его принимает, но в поля не пишет). ext_id — из get.offline_message_user_fields.
  user_fields?: Record<string, string>;
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

/** Чем закончилась отправка. CoMagic — единственный реальный канал доставки. */
export type LeadResult =
  | { ok: true }
  | { ok: false; reason: "no-widget" | "rejected" | "timeout" | "error" };

// CoMagic приходит из контейнера GTM, поэтому его может не быть вовсе:
// блокировщик рекламы, фильтрующий DNS, сбой GTM. Ждём появления до ~3с и
// честно сообщаем вызывающему, дождались или нет.
function waitForComagic(tries = 20): Promise<ComagicApi | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const api = window.Comagic;
  if (api?.addOfflineRequest) return Promise.resolve(api);
  if (tries <= 0) return Promise.resolve(null);
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(waitForComagic(tries - 1)), 150);
  });
}

/**
 * Отправка заявки. Возвращает результат доставки — форма показывает успех
 * только при `ok: true`, иначе предлагает позвонить. Серверный дубль на
 * /api/lead остаётся журналом и на результат не влияет.
 */
export async function sendLead(lead: Lead): Promise<LeadResult> {
  const req: ComagicOfflineRequest = {
    name: lead.name?.trim() || "",
    phone: lead.phone?.trim() || "",
    email: lead.email?.trim() || "",
    message: buildMessage(lead),
  };
  // Согласия — в user_fields (объект { ext_id: value }, формат JS API CoMagic).
  // Ключи = ext_id полей: sopd (согласие на ПД) / mailing (согласие на рассылку).
  const userFields: Record<string, string> = {};
  if (lead.consent !== undefined) userFields.sopd = lead.consent ? "Да" : "Нет";
  if (lead.marketing !== undefined) userFields.mailing = lead.marketing ? "Да" : "Нет";
  if (Object.keys(userFields).length) req.user_fields = userFields;

  // Дубль на сервер — журнал факта заявки, результат отправки не определяет.
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

  const api = await waitForComagic();
  if (!api) {
    console.error("[lead] CoMagic недоступен — заявка не отправлена", { source: lead.source });
    return { ok: false, reason: "no-widget" };
  }

  // addOfflineRequest асинхронный и о результате сообщает колбэком. Без
  // ответа за 10с считаем отправку неудачной: лучше предложить позвонить,
  // чем показать подтверждение заявке, которой нет.
  return new Promise<LeadResult>((resolve) => {
    let settled = false;
    const finish = (result: LeadResult) => {
      if (settled) return;
      settled = true;
      if (!result.ok) console.error("[lead] CoMagic отказал", { reason: result.reason, source: lead.source });
      resolve(result);
    };
    const timer = window.setTimeout(() => finish({ ok: false, reason: "timeout" }), 10_000);
    try {
      api.addOfflineRequest(req, (o) => {
        window.clearTimeout(timer);
        finish(o?.success ? { ok: true } : { ok: false, reason: "rejected" });
      });
    } catch {
      window.clearTimeout(timer);
      finish({ ok: false, reason: "error" });
    }
  });
}
