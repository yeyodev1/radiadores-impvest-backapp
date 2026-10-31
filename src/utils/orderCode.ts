import { randomInt } from "crypto";

// Sin 0/O, 1/I/L: el cliente dicta el código por teléfono o WhatsApp.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/** Código visible del pedido, p. ej. "IV-7K2Q9X". */
export function generateOrderCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `IV-${code}`;
}
