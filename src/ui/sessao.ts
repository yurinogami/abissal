import { BANCO } from "../data/banco";
import { dataHojeBrasilia, perguntasDoDia } from "../game/daily";
import { criarPartida, type Partida, PERGUNTAS_POR_PARTIDA, pontosPorPergunta, retomarPartida } from "../game/engine";
import type { RegistroDia } from "../game/historico";
import { somarPontos } from "../game/scoring";
import {
  type Armazenamento,
  armazenamentoPadrao,
  carregarHistorico,
  carregarPartida,
  registrarDia,
  salvarPartida,
} from "../storage/save";

const IDS_DO_BANCO = new Set(BANCO.map((q) => q.id));

let armazenamento: Armazenamento | null | undefined;
function arm(): Armazenamento | null {
  if (armazenamento === undefined) armazenamento = armazenamentoPadrao();
  return armazenamento;
}

/** Partidas da aba atual. O Diário também fica salvo no localStorage. */
export const sessao: { diario: Partida | null; ilimitado: Partida | null } = {
  diario: null,
  ilimitado: null,
};

/**
 * O Diário de hoje, se já foi começado (nesta aba ou numa visita anterior).
 * Ao vir do armazenamento, uma pergunta que estava aberta conta como perdida.
 */
export function diarioDeHoje(): Partida | null {
  const hoje = dataHojeBrasilia();
  if (sessao.diario?.data === hoje) return sessao.diario;
  const salva = carregarPartida(arm(), hoje, IDS_DO_BANCO);
  if (!salva) return null;
  if (retomarPartida(salva)) salvarPartida(arm(), salva);
  sessao.diario = salva;
  return salva;
}

/** O Diário de hoje, criando um novo se ainda não existir. */
export function obterOuCriarDiario(): Partida {
  const existente = diarioDeHoje();
  if (existente) return existente;
  const hoje = dataHojeBrasilia();
  sessao.diario = criarPartida("diario", hoje, perguntasDoDia(BANCO, hoje, PERGUNTAS_POR_PARTIDA));
  salvarPartida(arm(), sessao.diario);
  return sessao.diario;
}

/** Salva o Diário e, se ele acabou, registra o resultado no histórico. */
export function persistir(partida: Partida): void {
  if (partida.modo !== "diario") return;
  salvarPartida(arm(), partida);
  if (partida.finalizada) {
    registrarDia(arm(), { data: partida.data, pontos: somarPontos(pontosPorPergunta(partida)) });
  }
}

export function historico(): RegistroDia[] {
  return carregarHistorico(arm());
}
