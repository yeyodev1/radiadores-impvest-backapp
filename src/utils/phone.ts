/**
 * Teléfonos de Ecuador en formato local: celular "09XXXXXXXX" o fijo "0XXXXXXXX"
 * (provincia 2–7 + 7 dígitos). Acepta espacios, guiones, paréntesis y el
 * prefijo +593/593. Devuelve "" si no es un número válido.
 */
export function normalizeEcPhone(value: unknown): string {
  const raw = String(value ?? "")
    .trim()
    .replace(/[\s().-]/g, "");
  const national = /^\+?593(\d+)$/.exec(raw)?.[1] ?? raw.replace(/^0/, "");
  if (/^9\d{8}$/.test(national)) return `0${national}`;
  if (/^[2-7]\d{7}$/.test(national)) return `0${national}`;
  return "";
}
