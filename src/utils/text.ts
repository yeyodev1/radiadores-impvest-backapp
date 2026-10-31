/** Minúsculas y sin tildes: base de la búsqueda tolerante a acentos. */
export function normalizeText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Escapa un texto para usarlo dentro de un RegExp. */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function formatUSD(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
