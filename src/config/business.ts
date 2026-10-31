/** Datos fijos de la tienda que usa el servidor (WhatsApp de pedidos y sucursales). */
export const STORE_WHATSAPP = "593998738671";

export const BRANCHES = [
  { id: "quito-norte", name: "Quito Norte" },
  { id: "quito-sur", name: "Quito Sur" },
  { id: "valle-chillos", name: "Valle de los Chillos" },
  { id: "ambato", name: "Ambato" },
  { id: "guayaquil", name: "Guayaquil" },
] as const;

export type BranchId = (typeof BRANCHES)[number]["id"];

export const SEGMENTS = ["autos", "vans-buses", "camiones", "maquinaria"] as const;
export type Segment = (typeof SEGMENTS)[number];

export const CATEGORIES = ["radiador", "intercooler", "parte", "accesorio"] as const;
export type Category = (typeof CATEGORIES)[number];
