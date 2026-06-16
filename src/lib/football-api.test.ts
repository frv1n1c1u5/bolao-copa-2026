import { describe, expect, it } from "vitest";
import { analyzeAdvancedMatchData } from "./football-api";

describe("analyzeAdvancedMatchData", () => {
  it("aprova a prova quando ha pelo menos 4 mercados avancados", () => {
    const result = analyzeAdvancedMatchData({
      id: 101,
      status: "FINISHED",
      homeTeam: {
        name: "Brazil",
        lineup: Array.from({ length: 11 }, (_, id) => ({ id })),
        statistics: {
          ball_possession: 58,
          corner_kicks: 6,
          shots: 14,
          shots_on_goal: 7,
        },
      },
      awayTeam: {
        name: "Argentina",
        lineup: Array.from({ length: 11 }, (_, id) => ({ id })),
        statistics: {
          ball_possession: 42,
          corner_kicks: 4,
          shots: 9,
          shots_on_goal: 3,
        },
      },
      score: { halfTime: { home: 1, away: 0 } },
      goals: [{ scorer: { name: "Marta" } }],
      bookings: [{ player: { name: "Silva" }, card: "YELLOW_CARD" }],
    });

    expect(result.viable).toBe(true);
    expect(result.availableMarkets).toBeGreaterThanOrEqual(4);
  });

  it("reprova quando a resposta so tem dados basicos de placar", () => {
    const result = analyzeAdvancedMatchData({
      id: 102,
      status: "SCHEDULED",
      homeTeam: { name: "Brazil" },
      awayTeam: { name: "Argentina" },
      score: { fullTime: { home: null, away: null } },
    });

    expect(result.viable).toBe(false);
    expect(result.availableMarkets).toBe(0);
  });
});
