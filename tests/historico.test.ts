import { describe, expect, it } from "vitest";
import { formatarContagem, melhorProfundidade, msAteProximoDia, sequenciaAtual } from "../src/game/historico";

const h = (...datas: string[]) => datas.map((data, i) => ({ data, pontos: (i + 1) * 5 }));

describe("sequenciaAtual", () => {
  it("conta dias seguidos terminando hoje", () => {
    expect(sequenciaAtual(h("2026-11-18", "2026-11-19", "2026-11-20"), "2026-11-20")).toBe(3);
  });

  it("continua viva se o último dia foi ontem", () => {
    expect(sequenciaAtual(h("2026-11-18", "2026-11-19"), "2026-11-20")).toBe(2);
  });

  it("zera se pulou um dia", () => {
    expect(sequenciaAtual(h("2026-11-17", "2026-11-18"), "2026-11-20")).toBe(0);
    expect(sequenciaAtual(h("2026-11-16", "2026-11-18", "2026-11-19", "2026-11-20"), "2026-11-20")).toBe(3);
  });

  it("atravessa a virada do mês e do ano", () => {
    expect(sequenciaAtual(h("2026-12-30", "2026-12-31", "2027-01-01"), "2027-01-01")).toBe(3);
  });

  it("é zero sem histórico", () => {
    expect(sequenciaAtual([], "2026-11-20")).toBe(0);
  });
});

describe("melhorProfundidade", () => {
  it("devolve a maior profundidade em metros", () => {
    expect(melhorProfundidade([{ data: "a", pontos: 12 }, { data: "b", pontos: 38 }, { data: "c", pontos: 7 }])).toBe(380);
    expect(melhorProfundidade([])).toBe(0);
  });
});

describe("msAteProximoDia", () => {
  it("conta até a meia-noite de Brasília (UTC-3)", () => {
    // 21:00 em Brasília = 00:00 UTC do dia seguinte → faltam 3 h.
    expect(msAteProximoDia(new Date("2026-11-21T00:00:00Z"))).toBe(3 * 3600 * 1000);
    // 23:59:59 em Brasília → falta 1 s.
    expect(msAteProximoDia(new Date("2026-11-21T02:59:59Z"))).toBe(1000);
    // Meia-noite exata em Brasília → falta um dia inteiro.
    expect(msAteProximoDia(new Date("2026-11-21T03:00:00Z"))).toBe(86_400_000);
  });
});

describe("formatarContagem", () => {
  it("formata como HH:MM:SS", () => {
    expect(formatarContagem((3 * 3600 + 12 * 60 + 45) * 1000)).toBe("03:12:45");
    expect(formatarContagem(1)).toBe("00:00:01");
    expect(formatarContagem(0)).toBe("00:00:00");
    expect(formatarContagem(-5)).toBe("00:00:00");
  });
});
