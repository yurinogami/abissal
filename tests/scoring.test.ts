import { describe, expect, it } from "vitest";
import { BANCO } from "../src/data/banco";
import {
  maisRaras,
  pontosParaMetros,
  profundidadeMaxima,
  profundidadeTotal,
  raridade,
  somarPontos,
  zonaDaProfundidade,
} from "../src/game/scoring";

describe("pontuação", () => {
  it("cada ponto vale 10 metros", () => {
    expect(pontosParaMetros(0)).toBe(0);
    expect(pontosParaMetros(1)).toBe(10);
    expect(pontosParaMetros(38)).toBe(380);
  });

  it("a profundidade final é a soma dos pontos × 10 (critério de aceite)", () => {
    const pontos = [1, 3, 8, 0, 2, 0, 9];
    expect(somarPontos(pontos)).toBe(23);
    expect(profundidadeTotal(pontos)).toBe(230);
    expect(profundidadeTotal([])).toBe(0);
  });

  it("o máximo teórico do dia é 700 m", () => {
    expect(profundidadeMaxima()).toBe(700);
    expect(profundidadeTotal([10, 10, 10, 10, 10, 10, 10])).toBe(700);
  });
});

describe("zonaDaProfundidade", () => {
  it.each([
    [0, "Zona iluminada", "Banhista"],
    [99, "Zona iluminada", "Banhista"],
    [100, "Zona do crepúsculo", "Mergulhador"],
    [199, "Zona do crepúsculo", "Mergulhador"],
    [200, "Zona da meia-noite", "Explorador"],
    [349, "Zona da meia-noite", "Explorador"],
    [350, "Zona abissal", "Abissal"],
    [499, "Zona abissal", "Abissal"],
    [500, "Fossa", "Lenda das Fossas"],
    [700, "Fossa", "Lenda das Fossas"],
  ])("%i m → %s (%s)", (metros, nome, titulo) => {
    const zona = zonaDaProfundidade(metros);
    expect(zona.nome).toBe(nome);
    expect(zona.titulo).toBe(titulo);
  });
});

describe("raridade", () => {
  it("classifica os pontos nas faixas do compartilhamento", () => {
    expect(raridade(0)).toBe("erro");
    expect([1, 2, 3].map(raridade)).toEqual(["comum", "comum", "comum"]);
    expect([4, 5, 6].map(raridade)).toEqual(["media", "media", "media"]);
    expect([7, 8, 9, 10].map(raridade)).toEqual(["rara", "rara", "rara", "rara"]);
  });
});

describe("maisRaras", () => {
  it("devolve as 3 respostas com mais pontos", () => {
    const planetas = BANCO.find((q) => q.id === "planetas")!;
    const raras = maisRaras(planetas);
    expect(raras).toHaveLength(3);
    expect(raras.map((r) => r.r)).toEqual(["Urano", "Netuno", "Mercúrio"]);
  });

  it("não altera a ordem do banco", () => {
    const planetas = BANCO.find((q) => q.id === "planetas")!;
    const antes = planetas.respostas.map((r) => r.r);
    maisRaras(planetas);
    expect(planetas.respostas.map((r) => r.r)).toEqual(antes);
  });
});
