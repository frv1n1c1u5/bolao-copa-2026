// Datas exibidas sempre no fuso de Brasília.
const TZ = "America/Sao_Paulo";

export function formatKickoff(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(d);
}

export function formatDay(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: TZ,
  }).format(d);
}

export function formatTime(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(d);
}

export function dayKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: TZ,
  }).format(d);
}

export const STAGE_LABELS: Record<string, string> = {
  group: "Fase de grupos",
  r32: "32 avos de final",
  r16: "Oitavas de final",
  qf: "Quartas de final",
  sf: "Semifinais",
  third: "Disputa de 3º lugar",
  final: "Final",
};

export const STAGE_ORDER = ["group", "r32", "r16", "qf", "sf", "third", "final"];

export type Phase = "grupos" | "matamata" | "final";

/** Fase atual baseada na data de hoje. */
export function getCurrentPhase(now = new Date()): Phase {
  const t = now.getTime();
  // Copa 2026: grupos terminam ~2026-06-28, final em 2026-07-19
  const endGroups = new Date("2026-06-28T23:59:00Z").getTime();
  const startFinal = new Date("2026-07-19T00:00:00Z").getTime();
  if (t >= startFinal) return "final";
  if (t >= endGroups) return "matamata";
  return "grupos";
}
