import type { Pergunta } from "./tipos";

/** Dia 1 do Diário. O número do dia ("Abissal #42") é contado a partir daqui. */
export const DATA_LANCAMENTO = "2026-11-14";

/** Uma pergunta não volta ao Diário antes deste número de dias, se o banco permitir. */
export const DIAS_SEM_REPETIR = 7;

export const FUSO_BRASILIA = "America/Sao_Paulo";

/** Data de hoje no fuso de Brasília, no formato AAAA-MM-DD. */
export function dataHojeBrasilia(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_BRASILIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}

/** Hash cyrb53: transforma um texto em um número inteiro de 53 bits. */
export function hashString(s: string, semente = 0): number {
  let h1 = 0xdeadbeef ^ semente;
  let h2 = 0x41c6ce57 ^ semente;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** Gerador pseudoaleatório determinístico: mesma semente, mesma sequência em [0, 1). */
export function mulberry32(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates: devolve uma cópia embaralhada, sem alterar o original. */
export function embaralhar<T>(itens: readonly T[], aleatorio: () => number = Math.random): T[] {
  const copia = [...itens];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const MS_POR_DIA = 86_400_000;

function paraDiaUTC(data: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  if (!m) throw new Error(`Data inválida: "${data}" (esperado AAAA-MM-DD)`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_POR_DIA;
}

/** Diferença em dias entre duas datas AAAA-MM-DD (b - a). */
export function diasEntre(a: string, b: string): number {
  return paraDiaUTC(b) - paraDiaUTC(a);
}

/** Soma dias a uma data AAAA-MM-DD. */
export function somarDias(data: string, dias: number): string {
  return new Date((paraDiaUTC(data) + dias) * MS_POR_DIA).toISOString().slice(0, 10);
}

/** Número do Diário ("Abissal #N"): o dia do lançamento é o #1. */
export function numeroDoDia(data: string, lancamento = DATA_LANCAMENTO): number {
  return diasEntre(lancamento, data) + 1;
}

/** A pergunta pode cair no Diário nesta data? (respeita `desde` e `ate`) */
export function disponivelEm(pergunta: Pergunta, data: string): boolean {
  if (pergunta.desde && data < pergunta.desde) return false;
  if (pergunta.ate && data > pergunta.ate) return false;
  return true;
}

function sorteioSimples(banco: readonly Pergunta[], data: string, n: number): Pergunta[] {
  const disponiveis = banco.filter((q) => disponivelEm(q, data));
  return embaralhar(disponiveis, mulberry32(hashString(data))).slice(0, n);
}

/**
 * As n perguntas do Diário de uma data. Todo mundo recebe as mesmas.
 *
 * Cada dia embaralha as perguntas disponíveis com uma semente tirada da data.
 * Para não repetir perguntas dos últimos DIAS_SEM_REPETIR dias, o sorteio é
 * refeito em ordem desde o lançamento: primeiro entram as perguntas
 * "descansadas", e só se faltar entram as usadas há mais tempo. Datas antes do
 * lançamento usam só o embaralhamento do dia.
 *
 * Como cada dia só enxerga as perguntas disponíveis naquela data, acrescentar
 * perguntas com `desde` no futuro (ou aposentar com `ate`) não muda nenhum
 * Diário anterior.
 */
export function perguntasDoDia(
  banco: readonly Pergunta[],
  data: string,
  n = 7,
  lancamento = DATA_LANCAMENTO,
): Pergunta[] {
  const alvo = diasEntre(lancamento, data);
  if (alvo < 0) return sorteioSimples(banco, data, n);

  const ultimoUso = new Map<string, number>();
  let escolhidas: Pergunta[] = [];

  for (let dia = 0; dia <= alvo; dia++) {
    const ordem = sorteioSimples(banco, somarDias(lancamento, dia), banco.length);
    const descansadas = ordem.filter((q) => {
      const uso = ultimoUso.get(q.id);
      return uso === undefined || dia - uso > DIAS_SEM_REPETIR;
    });
    escolhidas = descansadas.slice(0, n);

    if (escolhidas.length < n) {
      // Completa com as usadas há mais tempo (sort é estável: empate mantém a ordem sorteada).
      const restantes = ordem
        .filter((q) => !escolhidas.includes(q))
        .sort((a, b) => (ultimoUso.get(a.id) ?? -Infinity) - (ultimoUso.get(b.id) ?? -Infinity));
      escolhidas = [...escolhidas, ...restantes.slice(0, n - escolhidas.length)];
    }

    for (const q of escolhidas) ultimoUso.set(q.id, dia);
  }
  return escolhidas;
}

/** n perguntas aleatórias para o modo Ilimitado (só as já disponíveis hoje). */
export function perguntasAleatorias(
  banco: readonly Pergunta[],
  n = 7,
  aleatorio: () => number = Math.random,
  hoje: string = dataHojeBrasilia(),
): Pergunta[] {
  return embaralhar(
    banco.filter((q) => disponivelEm(q, hoje)),
    aleatorio,
  ).slice(0, n);
}
