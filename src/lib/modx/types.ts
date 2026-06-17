/**
 * Базовый ресурс MODX (поля modResource).
 * Набор полей зависит от твоего REST-коннектора — дополняй по факту.
 */
export type ModxResource = {
  id: number;
  pagetitle: string;
  longtitle?: string;
  alias: string;
  uri?: string;
  content?: string;
  introtext?: string;
  menutitle?: string;
  published: boolean;
  parent: number;
  template?: number;
  /** Template Variables (TV) — если коннектор их отдаёт. */
  tv?: Record<string, unknown>;
};

/** Ответ-список из MODX REST (processor getlist обычно отдаёт { total, results }). */
export type ModxListResponse<T> = {
  total: number;
  results: T[];
};
