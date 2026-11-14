import type { Pergunta, Resposta } from "./tipos";

export const METROS_POR_PONTO = 10;
export const PONTOS_MAXIMOS_POR_PERGUNTA = 10;

export type Zona = {
  /** Profundidade mínima da zona, em metros. */
  minimo: number;
  nome: string;
  nomeCientifico: string;
  /** Título do jogador ao terminar nessa zona. */
  titulo: string;
};

/** Faixas de profundidade (seção 3.3), da mais rasa para a mais funda. */
export const ZONAS: readonly Zona[] = [
  { minimo: 0, nome: "Zona iluminada", nomeCientifico: "epipelágica", titulo: "Banhista" },
  { minimo: 100, nome: "Zona do crepúsculo", nomeCientifico: "mesopelágica", titulo: "Mergulhador" },
  { minimo: 200, nome: "Zona da meia-noite", nomeCientifico: "batipelágica", titulo: "Explorador" },
  { minimo: 350, nome: "Zona abissal", nomeCientifico: "abissopelágica", titulo: "Abissal" },
  { minimo: 500, nome: "Fossa", nomeCientifico: "hadopelágica", titulo: "Lenda das Fossas" },
];

/** Converte pontos em metros de profundidade. */
export function pontosParaMetros(pontos: number): number {
  return pontos * METROS_POR_PONTO;
}

/** Soma os pontos de cada pergunta (0 para erro ou pulo). */
export function somarPontos(pontosPorPergunta: readonly number[]): number {
  return pontosPorPergunta.reduce((total, p) => total + p, 0);
}

/** Profundidade final em metros: soma dos pontos × 10. */
export function profundidadeTotal(pontosPorPergunta: readonly number[]): number {
  return pontosParaMetros(somarPontos(pontosPorPergunta));
}

/** Profundidade máxima possível para n perguntas (700 m para 7). */
export function profundidadeMaxima(n = 7): number {
  return pontosParaMetros(n * PONTOS_MAXIMOS_POR_PERGUNTA);
}

/** Zona correspondente a uma profundidade em metros. */
export function zonaDaProfundidade(metros: number): Zona {
  let zona = ZONAS[0];
  for (const z of ZONAS) if (metros >= z.minimo) zona = z;
  return zona;
}

/**
 * Posição de 0 (superfície) a 1 (fossa) para pintar o fundo. Cada zona ocupa
 * um quarto do degradê, então o início de cada zona cai numa cor do plano.
 */
export function fracaoProfundidade(metros: number): number {
  const m = Math.max(0, metros);
  for (let i = 0; i < ZONAS.length - 1; i++) {
    const inicio = ZONAS[i].minimo;
    const fim = ZONAS[i + 1].minimo;
    if (m < fim) return (i + (m - inicio) / (fim - inicio)) / (ZONAS.length - 1);
  }
  return 1;
}

export type Raridade ="erro" | "comum" | "media" | "rara";

/** Classifica os pontos de uma pergunta: 0 erro/pulo, 1–3 comum, 4–6 média, 7–10 rara. */
export function raridade(pontos: number): Raridade {
  if (pontos <= 0) return "erro";
  if (pontos <= 3) return "comum";
  if (pontos <= 6) return "media";
  return "rara";
}

/** As respostas mais raras de uma pergunta (mais pontos primeiro; empate mantém a ordem do banco). */
export function maisRaras(pergunta: Pergunta, quantidade = 3): Resposta[] {
  return [...pergunta.respostas].sort((a, b) => b.p - a.p).slice(0, quantidade);
}
