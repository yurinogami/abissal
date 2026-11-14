import type { Modo } from "./engine";
import { profundidadeTotal, type Raridade, raridade, zonaDaProfundidade } from "./scoring";

/** Legenda da seção 7: 🟥 errou ou pulou, 🟦 comum, 🟪 média, 🟨 rara. */
export const QUADRADOS: Record<Raridade, string> = {
  erro: "🟥",
  comum: "🟦",
  media: "🟪",
  rara: "🟨",
};

export type DadosCompartilhamento = {
  modo: Modo;
  /** Número do Diário ("#42"); ignorado no Ilimitado. */
  numeroDia?: number;
  pontosPorPergunta: readonly number[];
  /** Endereço do site, sem "https://". */
  endereco: string;
};

/** Texto copiado pelo botão "Copiar resultado" (seção 7). */
export function textoCompartilhamento(d: DadosCompartilhamento): string {
  const metros = profundidadeTotal(d.pontosPorPergunta);
  const zona = zonaDaProfundidade(metros);
  const titulo =
    d.modo !== "diario"
      ? "Abissal · ilimitado 🌊"
      : d.numeroDia !== undefined && d.numeroDia >= 1
        ? `Abissal #${d.numeroDia} 🌊`
        : "Abissal · prévia 🌊";
  return [
    titulo,
    `Mergulhei ${metros} m — ${zona.nome}`,
    "",
    d.pontosPorPergunta.map((p) => QUADRADOS[raridade(p)]).join(""),
    d.pontosPorPergunta.join(" · "),
    "",
    d.endereco,
  ].join("\n");
}

/** Endereço legível do site a partir da URL atual (sem protocolo, hash, barra final ou index.html). */
export function enderecoDoSite(url: string): string {
  const u = new URL(url);
  const caminho = u.pathname.replace(/index\.html$/, "").replace(/\/+$/, "");
  return u.host + caminho;
}
