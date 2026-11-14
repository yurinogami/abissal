import { profundidadeTotal } from "./scoring";
import type { Pergunta, Resposta } from "./tipos";
import { checarResposta, normalizar } from "./validate";

export const TEMPO_POR_PERGUNTA = 25;
export const PERGUNTAS_POR_PARTIDA = 7;

export type Modo = "diario" | "ilimitado";

export type EstadoPergunta = {
  perguntaId: string;
  /** Tentativas erradas, como o jogador digitou. */
  tentativas: string[];
  acerto?: { resposta: string; pontos: number };
  pulou: boolean;
  /** Acabou o tempo (ou a pergunta se perdeu ao recarregar a página). */
  esgotou: boolean;
  /** Tempo usado, em segundos. */
  tempoUsado: number;
};

export type Partida = {
  modo: Modo;
  /** AAAA-MM-DD */
  data: string;
  /** ids das perguntas, na ordem. */
  perguntas: string[];
  /** Índice da pergunta atual (0..n-1). */
  atual: number;
  estados: EstadoPergunta[];
  finalizada: boolean;
};

export type ResultadoTentativa =
  | { tipo: "vazio" }
  | { tipo: "repetida" }
  | { tipo: "encerrada" }
  | { tipo: "erro"; mensagem?: string }
  | { tipo: "acerto"; resposta: Resposta; pontos: number; exato: boolean };

export function criarPartida(modo: Modo, data: string, perguntas: readonly Pergunta[]): Partida {
  return {
    modo,
    data,
    perguntas: perguntas.map((q) => q.id),
    atual: 0,
    estados: perguntas.map((q) => ({
      perguntaId: q.id,
      tentativas: [],
      pulou: false,
      esgotou: false,
      tempoUsado: 0,
    })),
    finalizada: false,
  };
}

export function estadoAtual(partida: Partida): EstadoPergunta {
  return partida.estados[partida.atual];
}

/** A pergunta terminou (acerto, pulo ou tempo esgotado)? */
export function perguntaEncerrada(estado: EstadoPergunta): boolean {
  return Boolean(estado.acerto) || estado.pulou || estado.esgotou;
}

function limitarTempo(segundos: number): number {
  return Math.min(TEMPO_POR_PERGUNTA, Math.max(0, Math.round(segundos * 10) / 10));
}

/**
 * Registra uma tentativa na pergunta atual. A pergunta termina no primeiro acerto;
 * erros não tiram pontos, mas a mesma tentativa errada não pode ser repetida.
 */
export function tentar(
  partida: Partida,
  pergunta: Pergunta,
  texto: string,
  tempoUsado: number,
): ResultadoTentativa {
  const estado = estadoAtual(partida);
  if (partida.finalizada || !estado || perguntaEncerrada(estado)) return { tipo: "encerrada" };
  if (estado.perguntaId !== pergunta.id) throw new Error("Pergunta diferente da atual");

  const normalizada = normalizar(texto);
  if (!normalizada) return { tipo: "vazio" };
  if (estado.tentativas.some((t) => normalizar(t) === normalizada)) return { tipo: "repetida" };

  const res = checarResposta(pergunta, texto);
  if (res.tipo === "vazio") return { tipo: "vazio" };
  if (res.tipo === "erro") {
    estado.tentativas.push(texto.trim());
    return res;
  }
  estado.acerto = { resposta: res.resposta.r, pontos: res.resposta.p };
  estado.tempoUsado = limitarTempo(tempoUsado);
  return { tipo: "acerto", resposta: res.resposta, pontos: res.resposta.p, exato: res.exato };
}

/** Encerra a pergunta atual com 0 pontos. */
export function pular(partida: Partida, tempoUsado: number): void {
  const estado = estadoAtual(partida);
  if (partida.finalizada || !estado || perguntaEncerrada(estado)) return;
  estado.pulou = true;
  estado.tempoUsado = limitarTempo(tempoUsado);
}

/** Encerra a pergunta atual por tempo esgotado, com 0 pontos. */
export function esgotarTempo(partida: Partida): void {
  const estado = estadoAtual(partida);
  if (partida.finalizada || !estado || perguntaEncerrada(estado)) return;
  estado.esgotou = true;
  estado.tempoUsado = TEMPO_POR_PERGUNTA;
}

/** Vai para a próxima pergunta (só depois que a atual terminou). Finaliza após a última. */
export function avancar(partida: Partida): void {
  if (partida.finalizada) return;
  if (!perguntaEncerrada(estadoAtual(partida))) return;
  if (partida.atual >= partida.perguntas.length - 1) {
    partida.finalizada = true;
  } else {
    partida.atual += 1;
  }
}

/** Pontos de cada pergunta (0 para erro, pulo ou pergunta ainda aberta). */
export function pontosPorPergunta(partida: Partida): number[] {
  return partida.estados.map((e) => e.acerto?.pontos ?? 0);
}

/** Profundidade acumulada da partida, em metros. */
export function profundidadeDaPartida(partida: Partida): number {
  return profundidadeTotal(pontosPorPergunta(partida));
}
