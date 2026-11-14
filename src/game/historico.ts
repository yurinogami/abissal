import { FUSO_BRASILIA, somarDias } from "./daily";
import { pontosParaMetros } from "./scoring";

export type RegistroDia = { data: string; pontos: number };

/**
 * Dias seguidos jogados. A sequência continua viva se o último dia jogado foi
 * hoje ou ontem (ainda dá tempo de jogar hoje).
 */
export function sequenciaAtual(historico: readonly RegistroDia[], hoje: string): number {
  const dias = new Set(historico.map((r) => r.data));
  let dia = dias.has(hoje) ? hoje : somarDias(hoje, -1);
  let total = 0;
  while (dias.has(dia)) {
    total++;
    dia = somarDias(dia, -1);
  }
  return total;
}

/** Maior profundidade já alcançada no Diário, em metros. */
export function melhorProfundidade(historico: readonly RegistroDia[]): number {
  return historico.reduce((melhor, r) => Math.max(melhor, pontosParaMetros(r.pontos)), 0);
}

/** Milissegundos até a próxima meia-noite de Brasília. */
export function msAteProximoDia(agora: Date = new Date()): number {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: FUSO_BRASILIA,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(agora);
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? 0);
  const decorrido = ((valor("hour") * 60 + valor("minute")) * 60 + valor("second")) * 1000 + agora.getMilliseconds();
  return 86_400_000 - decorrido;
}

/** Formata uma duração como HH:MM:SS (arredondando os segundos para cima). */
export function formatarContagem(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
