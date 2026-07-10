"use client";

import { useState } from "react";
import type { FocusEvent, InputHTMLAttributes } from "react";

// Маска российского номера: +7 (9XX) XXX-XX-XX. Строится по мере ввода цифр,
// нормализует ведущие 7/8, пустое поле → плейсхолдер. Без сторонних зависимостей.
export function formatRuPhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("7") || digits.startsWith("8")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (!digits) return "";
  let out = `+7 (${digits.slice(0, 3)}`;
  if (digits.length >= 3) out += ")";
  if (digits.length > 3) out += ` ${digits.slice(3, 6)}`;
  if (digits.length > 6) out += `-${digits.slice(6, 8)}`;
  if (digits.length > 8) out += `-${digits.slice(8, 10)}`;
  return out;
}

const PREFIX = "+7 (";
// Цифры, которые ввёл пользователь (без кода страны).
const userDigits = (v: string) => v.replace(/\D/g, "").replace(/^7/, "");

// Инпут телефона с маской. Спред пропсов (className/name/placeholder/aria-label)
// проходит насквозь; type/value/onChange/onFocus/onBlur контролирует сам компонент.
//
// Маска показывается ПО КЛИКУ (фокусу), а не с первой цифры: на фокусе пустое
// поле получает префикс «+7 (». Пока поле в фокусе, префикс «липкий» — стереть
// его нельзя (обычное поведение масок). Если ушли, не введя ни одной цифры,
// поле очищается: иначе required пропустил бы «+7 (» и в CRM уехал бы пустой номер.
export function PhoneInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [value, setValue] = useState("");

  const handleFocus = (e: FocusEvent<HTMLInputElement>) => {
    if (!value) setValue(PREFIX);
    props.onFocus?.(e);
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (!userDigits(value)) setValue("");
    props.onBlur?.(e);
  };

  return (
    <input
      {...props}
      type="tel"
      inputMode="tel"
      value={value}
      onChange={(e) => setValue(formatRuPhone(e.target.value) || PREFIX)}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}
