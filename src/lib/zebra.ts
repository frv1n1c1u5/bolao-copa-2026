import { STAGE_ORDER } from "./format";

/** Times elegíveis como zebra — azarões credíveis mas não favoritos tradicionais. */
export const ZEBRA_TEAMS = [
  { code: "JPN", reason: "Venceu Alemanha e Espanha na fase de grupos em 2022" },
  { code: "KOR", reason: "Semifinalista em 2002, força no mata-mata" },
  { code: "MAR", reason: "1ª seleção africana a chegar nas semis (2022)" },
  { code: "USA", reason: "País-sede com geração em ascensão rápida" },
  { code: "CAN", reason: "País-sede, primeira Copa, geração de Davies e Larin" },
  { code: "MEX", reason: "País-sede querendo quebrar o tabu do 5º jogo" },
  { code: "AUS", reason: "Quartas em 2022, Socceroos em boa fase" },
  { code: "TUR", reason: "3º lugar em 2002, gerações novas e talentosas" },
  { code: "SEN", reason: "Campeão da CAN, fisicamente dominante" },
  { code: "GHA", reason: "Quase quartas em 2010, geração renovada" },
  { code: "ECU", reason: "Sólido na CONMEBOL, abriu a Copa de 2022" },
  { code: "PAR", reason: "Quartas de final em 2010, imprevisível no mata-mata" },
  { code: "NOR", reason: "Haaland, nunca foi à Copa mas pode chegar longe" },
  { code: "SUI", reason: "Quartas em 2022, sempre surpreende" },
  { code: "CPV", reason: "Seleção em ascensão, organizada e com perfil de surpresa" },
  { code: "KSA", reason: "Venceu a Argentina na fase de grupos em 2022" },
  { code: "CIV", reason: "Potência africana, elenco de alto nível europeu" },
] as const;

export const ZEBRA_CODES = new Set<string>(ZEBRA_TEAMS.map((z) => z.code));

/**
 * Retorna o índice da fase mais avançada que um time disputou,
 * baseado nos jogos finalizados. Quanto maior o número, mais longe chegou.
 * Retorna -1 se o time ainda não jogou nenhum jogo finalizado.
 */
export function getTeamStageIndex(
  teamCode: string,
  finishedMatches: { homeCode: string | null; awayCode: string | null; stage: string }[]
): number {
  let best = -1;
  for (const m of finishedMatches) {
    if (m.homeCode !== teamCode && m.awayCode !== teamCode) continue;
    const idx = STAGE_ORDER.indexOf(m.stage);
    if (idx > best) best = idx;
  }
  return best;
}
