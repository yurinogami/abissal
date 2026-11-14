import { fracaoProfundidade } from "../../game/scoring";
import { type Bolhas, iniciarBolhas } from "./bolhas";

let bolhas: Bolhas | null = null;

/** Liga o fundo animado no elemento .oceano. */
export function iniciarOceano(container: HTMLElement): void {
  bolhas = iniciarBolhas(container);
}

/** Desce (ou sobe) o mar até a profundidade dada, em metros. */
export function definirProfundidade(metros: number): void {
  const fracao = fracaoProfundidade(metros);
  document.documentElement.style.setProperty("--profundidade", fracao.toFixed(4));
  bolhas?.definirProfundidade(fracao);
}
