import { describe, expect, it } from "vitest";
import { BANCO } from "../src/data/banco";
import {
  dataHojeBrasilia,
  diasEntre,
  embaralhar,
  hashString,
  mulberry32,
  numeroDoDia,
  perguntasAleatorias,
  perguntasDoDia,
  somarDias,
} from "../src/game/daily";
import type { Pergunta } from "../src/game/tipos";

const ids = (qs: Pergunta[]) => qs.map((q) => q.id);

/** Banco fictício com n perguntas, para testar a regra de não repetir. */
const bancoFalso = (n: number): Pergunta[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `q${i}`,
    pergunta: `Pergunta ${i}`,
    categoria: "teste",
    respostas: [{ r: "x", p: 1 }],
  }));

describe("dataHojeBrasilia", () => {
  it("usa o fuso de Brasília (UTC-3), não o UTC", () => {
    // 02:59 UTC do dia 14 ainda é 23:59 do dia 13 em Brasília.
    expect(dataHojeBrasilia(new Date("2026-11-14T02:59:59Z"))).toBe("2026-11-13");
    expect(dataHojeBrasilia(new Date("2026-11-14T03:00:00Z"))).toBe("2026-11-14");
  });

  it("devolve o formato AAAA-MM-DD", () => {
    expect(dataHojeBrasilia(new Date("2027-01-05T15:00:00Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("hashString e mulberry32", () => {
  it("são determinísticos", () => {
    expect(hashString("2026-11-13")).toBe(hashString("2026-11-13"));
    expect(hashString("2026-11-13")).not.toBe(hashString("2026-11-14"));
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("gera números em [0, 1)", () => {
    const rng = mulberry32(hashString("teste"));
    for (let i = 0; i < 1000; i++) {
      const x = rng();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe("embaralhar", () => {
  it("mantém os mesmos itens e não altera o original", () => {
    const original = [1, 2, 3, 4, 5, 6];
    const r = embaralhar(original, mulberry32(1));
    expect([...r].sort()).toEqual(original);
    expect(original).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("datas", () => {
  it("conta e soma dias, inclusive na virada do ano", () => {
    expect(diasEntre("2026-12-31", "2027-01-01")).toBe(1);
    expect(somarDias("2026-12-31", 1)).toBe("2027-01-01");
    expect(somarDias("2028-02-28", 1)).toBe("2028-02-29");
  });

  it("numera o Diário a partir do lançamento", () => {
    expect(numeroDoDia("2026-11-13", "2026-11-13")).toBe(1);
    expect(numeroDoDia("2026-12-24", "2026-11-13")).toBe(42);
  });

  it("rejeita datas mal formatadas", () => {
    expect(() => diasEntre("13/11/2026", "2026-11-13")).toThrow();
  });
});

describe("perguntasDoDia", () => {
  it("devolve 7 perguntas diferentes do banco", () => {
    const qs = perguntasDoDia(BANCO, "2026-11-20");
    expect(qs).toHaveLength(7);
    expect(new Set(ids(qs)).size).toBe(7);
  });

  it("é igual para a mesma data (duas abas no mesmo dia)", () => {
    expect(ids(perguntasDoDia(BANCO, "2026-11-20"))).toEqual(ids(perguntasDoDia(BANCO, "2026-11-20")));
  });

  it("muda na virada da meia-noite de Brasília", () => {
    const antes = dataHojeBrasilia(new Date("2026-11-21T02:59:59Z"));
    const depois = dataHojeBrasilia(new Date("2026-11-21T03:00:00Z"));
    expect(ids(perguntasDoDia(BANCO, antes))).not.toEqual(ids(perguntasDoDia(BANCO, depois)));
  });

  it("não repete perguntas nos últimos 7 dias quando o banco permite", () => {
    const banco = bancoFalso(60); // 8 dias × 7 = 56 ≤ 60
    const lancamento = "2026-01-01";
    const dias = Array.from({ length: 60 }, (_, d) => ids(perguntasDoDia(banco, somarDias(lancamento, d), 7, lancamento)));
    for (let d = 0; d < dias.length; d++) {
      const recentes = new Set(dias.slice(Math.max(0, d - 7), d).flat());
      for (const id of dias[d]) expect(recentes.has(id), `dia ${d}, ${id}`).toBe(false);
    }
  });

  it("com banco pequeno, espaça as repetições ao máximo", () => {
    const banco = bancoFalso(21); // dá para 3 dias sem repetir
    const lancamento = "2026-01-01";
    const dias = Array.from({ length: 30 }, (_, d) => ids(perguntasDoDia(banco, somarDias(lancamento, d), 7, lancamento)));
    for (let d = 0; d < dias.length; d++) {
      expect(new Set(dias[d]).size).toBe(7);
      const ultimos2 = new Set(dias.slice(Math.max(0, d - 2), d).flat());
      for (const id of dias[d]) expect(ultimos2.has(id)).toBe(false);
    }
  });

  it("funciona para datas antes do lançamento", () => {
    expect(perguntasDoDia(BANCO, "2020-01-01")).toHaveLength(7);
  });
});

describe("perguntasAleatorias", () => {
  it("devolve 7 perguntas diferentes", () => {
    const qs = perguntasAleatorias(BANCO, 7, mulberry32(3));
    expect(new Set(ids(qs)).size).toBe(7);
  });
});
