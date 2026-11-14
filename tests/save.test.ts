import { beforeEach, describe, expect, it } from "vitest";
import { BANCO } from "../src/data/banco";
import { avancar, criarPartida, estadoAtual, retomarPartida, tentar } from "../src/game/engine";
import {
  type Armazenamento,
  carregarHistorico,
  carregarPartida,
  registrarDia,
  salvarPartida,
} from "../src/storage/save";

/** localStorage falso em memória. */
function armazenamentoFalso(): Armazenamento & { dados: Map<string, string> } {
  const dados = new Map<string, string>();
  return {
    dados,
    getItem: (k) => dados.get(k) ?? null,
    setItem: (k, v) => void dados.set(k, String(v)),
    removeItem: (k) => void dados.delete(k),
  };
}

/** Armazenamento que falha em tudo (ex.: Safari em aba anônima antiga). */
const armazenamentoQuebrado: Armazenamento = {
  getItem: () => {
    throw new Error("bloqueado");
  },
  setItem: () => {
    throw new Error("cota cheia");
  },
  removeItem: () => {
    throw new Error("bloqueado");
  },
};

const DATA = "2026-11-20";
const perguntas = ["planetas", "estados", "oceanos"].map((id) => BANCO.find((q) => q.id === id)!);
const ids = new Set(BANCO.map((q) => q.id));

let armazenamento: ReturnType<typeof armazenamentoFalso>;
beforeEach(() => {
  armazenamento = armazenamentoFalso();
});

describe("salvar e carregar partida", () => {
  it("guarda o Diário em abissal:partida:<data> e lê de volta igual", () => {
    const partida = criarPartida("diario", DATA, perguntas);
    tentar(partida, perguntas[0], "Plutão", 2);
    tentar(partida, perguntas[0], "Netuno", 5);
    expect(salvarPartida(armazenamento, partida)).toBe(true);
    expect(armazenamento.dados.has(`abissal:partida:${DATA}`)).toBe(true);
    expect(carregarPartida(armazenamento, DATA, ids)).toEqual(partida);
  });

  it("não salva o modo Ilimitado", () => {
    const partida = criarPartida("ilimitado", DATA, perguntas);
    expect(salvarPartida(armazenamento, partida)).toBe(false);
    expect(armazenamento.dados.size).toBe(0);
  });

  it("ignora dados de outro dia, corrompidos ou com perguntas que não existem", () => {
    const partida = criarPartida("diario", DATA, perguntas);
    salvarPartida(armazenamento, partida);
    expect(carregarPartida(armazenamento, "2026-11-21", ids)).toBeNull();

    armazenamento.setItem(`abissal:partida:${DATA}`, "{não é json");
    expect(carregarPartida(armazenamento, DATA, ids)).toBeNull();

    const estranha = { ...partida, perguntas: ["nao-existe", "estados", "oceanos"] };
    armazenamento.setItem(`abissal:partida:${DATA}`, JSON.stringify(estranha));
    expect(carregarPartida(armazenamento, DATA, ids)).toBeNull();

    armazenamento.setItem(`abissal:partida:${DATA}`, JSON.stringify({ ...partida, atual: 9 }));
    expect(carregarPartida(armazenamento, DATA, ids)).toBeNull();
  });

  it("funciona sem localStorage (null ou bloqueado), só não salva", () => {
    const partida = criarPartida("diario", DATA, perguntas);
    expect(salvarPartida(null, partida)).toBe(false);
    expect(carregarPartida(null, DATA)).toBeNull();
    expect(salvarPartida(armazenamentoQuebrado, partida)).toBe(false);
    expect(carregarPartida(armazenamentoQuebrado, DATA)).toBeNull();
    expect(carregarHistorico(armazenamentoQuebrado)).toEqual([]);
    expect(() => registrarDia(armazenamentoQuebrado, { data: DATA, pontos: 3 })).not.toThrow();
  });
});

describe("retomarPartida (recarregar a página)", () => {
  it("considera perdida a pergunta que estava aberta", () => {
    const partida = criarPartida("diario", DATA, perguntas);
    tentar(partida, perguntas[0], "Plutão", 2);
    salvarPartida(armazenamento, partida);

    const recarregada = carregarPartida(armazenamento, DATA, ids)!;
    expect(retomarPartida(recarregada)).toBe(true);
    expect(estadoAtual(recarregada)).toMatchObject({ esgotou: true, tentativas: ["Plutão"] });
    expect(tentar(recarregada, perguntas[0], "Terra", 1)).toEqual({ tipo: "encerrada" });
  });

  it("não mexe em pergunta já respondida nem em partida finalizada", () => {
    const partida = criarPartida("diario", DATA, perguntas);
    tentar(partida, perguntas[0], "Terra", 1);
    expect(retomarPartida(partida)).toBe(false);
    expect(estadoAtual(partida).acerto?.pontos).toBe(1);

    avancar(partida);
    partida.finalizada = true;
    expect(retomarPartida(partida)).toBe(false);
  });

  it("recarregar depois de terminar mostra o resultado, não um jogo novo (critério de aceite)", () => {
    const partida = criarPartida("diario", DATA, perguntas);
    for (let i = 0; i < perguntas.length; i++) {
      tentar(partida, perguntas[i], perguntas[i].respostas[0].r, 3);
      avancar(partida);
    }
    expect(partida.finalizada).toBe(true);
    salvarPartida(armazenamento, partida);
    const recarregada = carregarPartida(armazenamento, DATA, ids)!;
    expect(recarregada.finalizada).toBe(true);
    expect(recarregada.estados.map((e) => e.acerto?.resposta)).toEqual(perguntas.map((q) => q.respostas[0].r));
  });
});

describe("histórico", () => {
  it("registra um dia por data, em ordem, sem duplicar", () => {
    registrarDia(armazenamento, { data: "2026-11-21", pontos: 12 });
    registrarDia(armazenamento, { data: "2026-11-20", pontos: 30 });
    registrarDia(armazenamento, { data: "2026-11-21", pontos: 15 });
    expect(carregarHistorico(armazenamento)).toEqual([
      { data: "2026-11-20", pontos: 30 },
      { data: "2026-11-21", pontos: 15 },
    ]);
  });

  it("descarta entradas inválidas", () => {
    armazenamento.setItem(
      "abissal:historico",
      JSON.stringify([{ data: "2026-11-20", pontos: 3 }, { data: "ontem", pontos: 2 }, { data: "2026-11-21" }, null]),
    );
    expect(carregarHistorico(armazenamento)).toEqual([{ data: "2026-11-20", pontos: 3 }]);
  });
});
