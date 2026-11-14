import { beforeEach, describe, expect, it } from "vitest";
import { BANCO } from "../src/data/banco";
import {
  avancar,
  criarPartida,
  esgotarTempo,
  estadoAtual,
  type Partida,
  perguntaEncerrada,
  pontosPorPergunta,
  profundidadeDaPartida,
  pular,
  TEMPO_POR_PERGUNTA,
  tentar,
} from "../src/game/engine";
import type { Pergunta } from "../src/game/tipos";

const porId = (id: string): Pergunta => BANCO.find((q) => q.id === id)!;
const perguntas = ["planetas", "estados", "oceanos"].map(porId);

let partida: Partida;
beforeEach(() => {
  partida = criarPartida("diario", "2026-11-20", perguntas);
});

describe("criarPartida", () => {
  it("começa na primeira pergunta, sem pontos", () => {
    expect(partida.atual).toBe(0);
    expect(partida.perguntas).toEqual(["planetas", "estados", "oceanos"]);
    expect(partida.finalizada).toBe(false);
    expect(pontosPorPergunta(partida)).toEqual([0, 0, 0]);
  });
});

describe("tentar", () => {
  it("encerra a pergunta no primeiro acerto e guarda os pontos", () => {
    const r = tentar(partida, perguntas[0], "Netuno", 7.34);
    expect(r).toMatchObject({ tipo: "acerto", pontos: 5 });
    expect(estadoAtual(partida).acerto).toEqual({ resposta: "Netuno", pontos: 5 });
    expect(estadoAtual(partida).tempoUsado).toBe(7.3);
    expect(perguntaEncerrada(estadoAtual(partida))).toBe(true);
    expect(tentar(partida, perguntas[0], "Terra", 8)).toEqual({ tipo: "encerrada" });
  });

  it("guarda tentativas erradas sem tirar pontos", () => {
    expect(tentar(partida, perguntas[0], "Plutão", 2)).toEqual({ tipo: "erro" });
    expect(tentar(partida, perguntas[0], "Lua", 3)).toEqual({ tipo: "erro" });
    expect(estadoAtual(partida).tentativas).toEqual(["Plutão", "Lua"]);
    expect(perguntaEncerrada(estadoAtual(partida))).toBe(false);
    expect(tentar(partida, perguntas[0], "Marte", 4)).toMatchObject({ tipo: "acerto", pontos: 1 });
  });

  it("não deixa repetir a mesma tentativa errada (mesmo com outra grafia)", () => {
    tentar(partida, perguntas[0], "Plutão", 2);
    expect(tentar(partida, perguntas[0], "plutao", 3)).toEqual({ tipo: "repetida" });
    expect(estadoAtual(partida).tentativas).toHaveLength(1);
  });

  it("ignora tentativas em branco", () => {
    expect(tentar(partida, perguntas[0], "   ", 1)).toEqual({ tipo: "vazio" });
    expect(estadoAtual(partida).tentativas).toHaveLength(0);
  });

  it("repassa a fala especial do Lume", () => {
    avancar(partida); // não avança: pergunta aberta
    expect(partida.atual).toBe(0);
    pular(partida, 1);
    avancar(partida);
    expect(tentar(partida, perguntas[1], "Distrito Federal", 2)).toMatchObject({ tipo: "erro", mensagem: expect.any(String) });
  });
});

describe("pular e esgotarTempo", () => {
  it("pular encerra com 0 pontos", () => {
    pular(partida, 3);
    expect(estadoAtual(partida)).toMatchObject({ pulou: true, tempoUsado: 3 });
    expect(pontosPorPergunta(partida)[0]).toBe(0);
  });

  it("tempo esgotado encerra com 0 pontos e tempo cheio", () => {
    esgotarTempo(partida);
    expect(estadoAtual(partida)).toMatchObject({ esgotou: true, tempoUsado: TEMPO_POR_PERGUNTA });
    expect(tentar(partida, perguntas[0], "Terra", 26)).toEqual({ tipo: "encerrada" });
  });

  it("não muda uma pergunta já respondida", () => {
    tentar(partida, perguntas[0], "Terra", 2);
    pular(partida, 3);
    esgotarTempo(partida);
    expect(estadoAtual(partida)).toMatchObject({ pulou: false, esgotou: false, acerto: { pontos: 1 } });
  });
});

describe("avancar", () => {
  it("só avança depois que a pergunta termina e finaliza após a última", () => {
    tentar(partida, perguntas[0], "Urano", 5);
    avancar(partida);
    expect(partida.atual).toBe(1);

    tentar(partida, perguntas[1], "Roraima", 9);
    avancar(partida);
    expect(partida.atual).toBe(2);

    esgotarTempo(partida);
    avancar(partida);
    expect(partida.finalizada).toBe(true);
    expect(partida.atual).toBe(2);
  });

  it("a profundidade da partida é a soma dos pontos × 10", () => {
    tentar(partida, perguntas[0], "Urano", 5); // 5
    avancar(partida);
    tentar(partida, perguntas[1], "Roraima", 9); // 9
    avancar(partida);
    pular(partida, 1); // 0
    avancar(partida);
    expect(pontosPorPergunta(partida)).toEqual([5, 9, 0]);
    expect(profundidadeDaPartida(partida)).toBe(140);
  });
});
