/** Hora de negocio: America/Guayaquil, UTC-5 fijo (sin horario de verano). */
const OFFSET_MS = 5 * 60 * 60 * 1000;

/** Inicio del día de hoy en Ecuador, como Date UTC. */
export function startOfTodayEC(now = new Date()): Date {
  const local = new Date(now.getTime() - OFFSET_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + OFFSET_MS);
}

/** Inicio del mes en curso en Ecuador, como Date UTC. */
export function startOfMonthEC(now = new Date()): Date {
  const local = new Date(now.getTime() - OFFSET_MS);
  local.setUTCDate(1);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + OFFSET_MS);
}
