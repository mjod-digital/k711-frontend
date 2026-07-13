"use client";

import { useState } from "react";
import type { ChangeEvent, FocusEvent, InputHTMLAttributes } from "react";

const NAT_LEN = 10; // цифр в национальном номере (без кода страны)
const PREFIX = "+7 (";

// 10 национальных цифр из отображаемой строки. Убираем ТОЛЬКО один ведущий
// «7» (от литерала «+7»), больше ничего не режем — иначе терялись цифры
// пользователя (прежняя маска резала и ведущую «8», из-за чего, например,
// код 812 превращался в 12, а одиночная «8»/«7» после очистки исчезала).
export function phoneNationalDigits(display: string): string {
  let d = display.replace(/\D/g, "");
  if (d.startsWith("7")) d = d.slice(1);
  return d.slice(0, NAT_LEN);
}

// Номер введён полностью = 10 национальных цифр.
export function isPhoneComplete(display: string): boolean {
  return phoneNationalDigits(display).length === NAT_LEN;
}

// Маска по 10 национальным цифрам: +7 (9XX) XXX-XX-XX.
function formatFromDigits(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, NAT_LEN);
  if (!d) return "";
  let out = `+7 (${d.slice(0, 3)}`;
  if (d.length >= 3) out += ")";
  if (d.length > 3) out += ` ${d.slice(3, 6)}`;
  if (d.length > 6) out += `-${d.slice(6, 8)}`;
  if (d.length > 8) out += `-${d.slice(8, 10)}`;
  return out;
}

// Маска российского номера из отображаемой строки (с учётом кода страны).
export function formatRuPhone(display: string): string {
  return formatFromDigits(phoneNationalDigits(display));
}

type PhoneInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
> & {
  /** Управляемое значение (отформатированная строка). Без него — своё состояние. */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Красная подсветка поля (data-invalid). */
  error?: boolean;
};

// Инпут телефона с маской, без сторонних зависимостей. Может работать как
// управляемый (value + onValueChange) — тогда форма знает значение для валидации,
// — так и сам по себе (обратная совместимость).
//
// Маска показывается ПО ФОКУСУ: пустое поле получает префикс «+7 (». Пока поле
// в фокусе, префикс липкий. Ушли, не введя ни цифры → поле очищается (иначе
// required/валидация пропустили бы пустой «+7 (»).
export function PhoneInput({
  value: controlled,
  onValueChange,
  error,
  onFocus,
  onBlur,
  ...rest
}: PhoneInputProps) {
  const [internal, setInternal] = useState("");
  const isControlled = controlled !== undefined;
  const value = isControlled ? controlled : internal;

  const setValue = (v: string) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    let digits = phoneNationalDigits(raw);
    // Бэкспейс по символу маски (скобке/дефису/пробелу) не меняет цифры, а строку
    // укорачивает → маска тут же вернула бы литерал, и удалить цифру в скобках без
    // ручного переноса курсора было бы нельзя. Ловим этот случай и убираем
    // последнюю цифру, чтобы Backspace «проходил» сквозь литералы маски.
    if (raw.length < value.length && digits.length === phoneNationalDigits(value).length) {
      digits = digits.slice(0, -1);
    }
    setValue(formatFromDigits(digits) || PREFIX);
  };

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    if (!value) setValue(PREFIX);
    onFocus?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (!phoneNationalDigits(value)) setValue("");
    onBlur?.(e);
  };

  return (
    <input
      {...rest}
      type="tel"
      inputMode="tel"
      aria-invalid={error || undefined}
      data-invalid={error ? "true" : undefined}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
