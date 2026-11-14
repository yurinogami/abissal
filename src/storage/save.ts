import type { EstadoPergunta, Partida } from "../game/engine";

/** O mínimo do localStorage que usamos (permite trocar por um falso nos testes). */
export type Armazenamento = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type RegistroDia = { data: string; pontos: number };

const PREFIXO_PARTIDA = "abissal:partida:";
const CHAVE_HISTORICO = "abissal:historico";
const DATA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Devolve o localStorage, ou null se ele não existir ou estiver bloqueado
 * (aba anônima, cookies desligados etc.). Sem ele o jogo funciona, só não salva.
 */
export function armazenamentoPadrao(): Armazenamento | null {
  try {
    const s = window.localStorage;
    const teste = "abissal:teste";
    s.setItem(teste, "1");
    s.removeItem(teste);
    return s;
  } catch {
    return null;
  }
}

function ler(armazenamento: Armazenamento | null, chave: string): unknown {
  if (!armazenamento) return null;
  try {
    const bruto = armazenamento.getItem(chave);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

function gravar(armazenamento: Armazenamento | null, chave: string, valor: unknown): boolean {
  if (!armazenamento) return false;
  try {
    armazenamento.setItem(chave, JSON.stringify(valor));
    return true;
  } catch {
    return false; // cota cheia ou bloqueado: segue sem salvar
  }
}

const ehNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function ehEstado(v: unknown): v is EstadoPergunta {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  const acertoOk =
    e.acerto === undefined ||
    (typeof e.acerto === "object" &&
      e.acerto !== null &&
      typeof (e.acerto as Record<string, unknown>).resposta === "string" &&
      ehNumero((e.acerto as Record<string, unknown>).pontos));
  return (
    typeof e.perguntaId === "string" &&
    Array.isArray(e.tentativas) &&
    e.tentativas.every((t) => typeof t === "string") &&
    typeof e.pulou === "boolean" &&
    typeof e.esgotou === "boolean" &&
    ehNumero(e.tempoUsado) &&
    acertoOk
  );
}

/** Confere se um valor lido do armazenamento é uma partida do Diário íntegra. */
export function ehPartidaValida(v: unknown, data: string, idsValidos?: ReadonlySet<string>): v is Partida {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  if (p.modo !== "diario" || p.data !== data) return false;
  if (!Array.isArray(p.perguntas) || !p.perguntas.every((id) => typeof id === "string")) return false;
  if (idsValidos && !p.perguntas.every((id) => idsValidos.has(id as string))) return false;
  if (!Array.isArray(p.estados) || p.estados.length !== p.perguntas.length) return false;
  if (!p.estados.every(ehEstado)) return false;
  if (!p.estados.every((e, i) => (e as EstadoPergunta).perguntaId === p.perguntas[i])) return false;
  if (!Number.isInteger(p.atual) || (p.atual as number) < 0 || (p.atual as number) >= p.perguntas.length) return false;
  return typeof p.finalizada === "boolean";
}

export function salvarPartida(armazenamento: Armazenamento | null, partida: Partida): boolean {
  if (partida.modo !== "diario") return false;
  return gravar(armazenamento, PREFIXO_PARTIDA + partida.data, partida);
}

export function carregarPartida(
  armazenamento: Armazenamento | null,
  data: string,
  idsValidos?: ReadonlySet<string>,
): Partida | null {
  const v = ler(armazenamento, PREFIXO_PARTIDA + data);
  return ehPartidaValida(v, data, idsValidos) ? v : null;
}

export function carregarHistorico(armazenamento: Armazenamento | null): RegistroDia[] {
  const v = ler(armazenamento, CHAVE_HISTORICO);
  if (!Array.isArray(v)) return [];
  return v.filter(
    (r): r is RegistroDia =>
      !!r && typeof r === "object" && typeof r.data === "string" && DATA_VALIDA.test(r.data) && ehNumero(r.pontos),
  );
}

/** Registra (ou atualiza) o resultado de um dia no histórico. */
export function registrarDia(armazenamento: Armazenamento | null, registro: RegistroDia): RegistroDia[] {
  const historico = carregarHistorico(armazenamento).filter((r) => r.data !== registro.data);
  historico.push(registro);
  historico.sort((a, b) => a.data.localeCompare(b.data));
  gravar(armazenamento, CHAVE_HISTORICO, historico);
  return historico;
}
