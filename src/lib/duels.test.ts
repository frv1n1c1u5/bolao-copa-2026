import { describe, expect, it } from "vitest";
import { scoreDuelPicks, validateMarkets, validatePicks, type DuelMatchStats } from "./duels";

const stats: DuelMatchStats = {
  home: {
    possession: 53.6,
    totalShots: 15,
    shotsOnTarget: 3,
    corners: 2,
    cards: 2,
  },
  away: {
    possession: 46.4,
    totalShots: 14,
    shotsOnTarget: 3,
    corners: 7,
    cards: 2,
  },
  firstGoalTeam: "away",
  firstHalfGoal: true,
  goalScorerIds: ["299365"],
};

describe("validateMarkets", () => {
  it("exige os mercados obrigatorios", () => {
    expect(() => validateMarkets(["possession", "first_half_goal"])).toThrow();
    expect(validateMarkets(["possession", "total_shots", "first_half_goal"])).toEqual([
      "possession",
      "total_shots",
      "first_half_goal",
    ]);
  });
});

describe("validatePicks", () => {
  it("valida jogador quando o mercado de artilheiro entra no duelo", () => {
    const markets = validateMarkets([
      "possession",
      "total_shots",
      "first_half_goal",
      "goal_scorer",
    ]);
    expect(() =>
      validatePicks(
        markets,
        {
          possession: "home",
          total_shots: "home",
          first_half_goal: "yes",
          goal_scorer: "x",
        },
        [{ id: "299365", name: "Emam Ashour", team: "away" }]
      )
    ).toThrow();
  });
});

describe("scoreDuelPicks", () => {
  it("pontua mercados acertados e permite empate em estatistica", () => {
    const result = scoreDuelPicks(
      ["possession", "total_shots", "shots_on_target", "corners", "first_goal_team", "first_half_goal", "goal_scorer"],
      {
        possession: "home",
        total_shots: "home",
        shots_on_target: "draw",
        corners: "away",
        first_goal_team: "away",
        first_half_goal: "yes",
        goal_scorer: "299365",
      },
      stats
    );

    expect(result.points).toBe(7);
    expect(result.voided).toEqual([]);
  });
});
