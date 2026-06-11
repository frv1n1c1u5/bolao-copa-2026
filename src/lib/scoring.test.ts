import { describe, it, expect } from "vitest";
import {
  scorePrediction,
  computeStandings,
  outcome,
  type ParticipantInfo,
} from "./scoring";

describe("scorePrediction", () => {
  it("dá 3 pontos para placar exato", () => {
    expect(scorePrediction({ home: 2, away: 0 }, { home: 2, away: 0 })).toBe(3);
    expect(scorePrediction({ home: 1, away: 1 }, { home: 1, away: 1 })).toBe(3);
    expect(scorePrediction({ home: 0, away: 0 }, { home: 0, away: 0 })).toBe(3);
  });

  it("dá 1 ponto para vencedor certo com placar errado", () => {
    expect(scorePrediction({ home: 1, away: 0 }, { home: 3, away: 1 })).toBe(1);
    expect(scorePrediction({ home: 0, away: 2 }, { home: 1, away: 4 })).toBe(1);
  });

  it("dá 1 ponto para empate certo com placar errado", () => {
    expect(scorePrediction({ home: 0, away: 0 }, { home: 2, away: 2 })).toBe(1);
  });

  it("dá 0 pontos quando erra o resultado", () => {
    expect(scorePrediction({ home: 2, away: 0 }, { home: 0, away: 2 })).toBe(0);
    expect(scorePrediction({ home: 1, away: 1 }, { home: 1, away: 0 })).toBe(0);
    expect(scorePrediction({ home: 0, away: 1 }, { home: 1, away: 1 })).toBe(0);
  });

  it("placar invertido do exato conta como erro (lados importam)", () => {
    expect(scorePrediction({ home: 1, away: 2 }, { home: 2, away: 1 })).toBe(0);
  });
});

describe("outcome", () => {
  it("identifica vitória, derrota e empate", () => {
    expect(outcome({ home: 1, away: 0 })).toBe("home");
    expect(outcome({ home: 0, away: 3 })).toBe("away");
    expect(outcome({ home: 2, away: 2 })).toBe("draw");
  });
});

const p = (
  id: number,
  name: string,
  champion: string | null = null,
  extraPoints = 0
): ParticipantInfo => ({ id, name, avatar: "⚽", championTeamCode: champion, extraPoints });

describe("computeStandings", () => {
  it("soma pontos de vários jogos", () => {
    const standings = computeStandings(
      [p(1, "Ana")],
      [
        { participantId: 1, matchNum: 1, homeScore: 2, awayScore: 0 }, // exato: 3
        { participantId: 1, matchNum: 2, homeScore: 1, awayScore: 0 }, // resultado: 1
        { participantId: 1, matchNum: 3, homeScore: 0, awayScore: 0 }, // erro: 0
      ],
      [
        { num: 1, homeScore: 2, awayScore: 0 },
        { num: 2, homeScore: 3, awayScore: 1 },
        { num: 3, homeScore: 1, awayScore: 0 },
      ],
      null
    );
    expect(standings[0].points).toBe(4);
    expect(standings[0].exactCount).toBe(1);
    expect(standings[0].resultCount).toBe(1);
  });

  it("ignora jogos sem resultado", () => {
    const standings = computeStandings(
      [p(1, "Ana")],
      [{ participantId: 1, matchNum: 99, homeScore: 1, awayScore: 0 }],
      [],
      null
    );
    expect(standings[0].points).toBe(0);
  });

  it("dá +5 para quem acertou o campeão, só quando definido", () => {
    const before = computeStandings([p(1, "Ana", "BRA")], [], [], null);
    expect(before[0].points).toBe(0);

    const after = computeStandings(
      [p(1, "Ana", "BRA"), p(2, "Beto", "ARG")],
      [],
      [],
      "BRA"
    );
    const ana = after.find((t) => t.name === "Ana")!;
    const beto = after.find((t) => t.name === "Beto")!;
    expect(ana.points).toBe(5);
    expect(ana.championHit).toBe(true);
    expect(beto.points).toBe(0);
  });

  it("soma pontos extras (artilheiro etc.)", () => {
    const standings = computeStandings([p(1, "Ana", null, 3)], [], [], null);
    expect(standings[0].points).toBe(3);
  });

  it("desempata por placares exatos antes de resultados", () => {
    // Ana: 1 exato (3 pts) | Beto: 3 resultados (3 pts)
    const standings = computeStandings(
      [p(1, "Ana"), p(2, "Beto")],
      [
        { participantId: 1, matchNum: 1, homeScore: 2, awayScore: 0 },
        { participantId: 2, matchNum: 1, homeScore: 1, awayScore: 0 },
        { participantId: 2, matchNum: 2, homeScore: 1, awayScore: 0 },
        { participantId: 2, matchNum: 3, homeScore: 1, awayScore: 0 },
      ],
      [
        { num: 1, homeScore: 2, awayScore: 0 },
        { num: 2, homeScore: 2, awayScore: 0 },
        { num: 3, homeScore: 2, awayScore: 0 },
      ],
      null
    );
    expect(standings[0].name).toBe("Ana");
    expect(standings[0].rank).toBe(1);
    expect(standings[1].name).toBe("Beto");
    expect(standings[1].rank).toBe(2);
  });

  it("desempata pelo campeão como último critério", () => {
    // Ana compensa com 5 pts de extras; Beto tem +5 do campeão.
    // Mesmos pontos, exatos e resultados — Beto fica na frente pelo critério 4.
    const standings = computeStandings(
      [p(1, "Ana", "ARG", 5), p(2, "Beto", "BRA")],
      [],
      [],
      "BRA"
    );
    expect(standings[0].name).toBe("Beto");
    expect(standings[0].rank).toBe(1);
    expect(standings[1].name).toBe("Ana");
    expect(standings[1].rank).toBe(2);
  });

  it("empate persistente compartilha posição", () => {
    const standings = computeStandings(
      [p(1, "Ana"), p(2, "Beto"), p(3, "Caio")],
      [
        { participantId: 1, matchNum: 1, homeScore: 2, awayScore: 0 },
        { participantId: 2, matchNum: 1, homeScore: 2, awayScore: 0 },
      ],
      [{ num: 1, homeScore: 2, awayScore: 0 }],
      null
    );
    expect(standings[0].rank).toBe(1);
    expect(standings[1].rank).toBe(1);
    expect(standings[2].rank).toBe(3);
    expect(standings[2].name).toBe("Caio");
  });
});
