import { fracaoProfundidade, ZONAS, zonaDaProfundidade } from "../../game/scoring";
import { esc, metros } from "../dom";

export type Medidor = {
  elemento: HTMLElement;
  atualizar: (metros: number) => void;
};

/**
 * Medidor de profundidade com as marcas das zonas. Vertical à esquerda no
 * desktop, horizontal no topo no celular. É decorativo para leitores de tela:
 * a profundidade já é anunciada no topo da tela.
 */
export function criarMedidor(): Medidor {
  const elemento = document.createElement("div");
  elemento.className = "medidor";
  elemento.setAttribute("aria-hidden", "true");

  const marcas = ZONAS.map(
    (z) => `
      <li class="medidor-marca" style="--pos: ${fracaoProfundidade(z.minimo)}">
        <span class="medidor-marca-metros">${esc(metros(z.minimo))}</span>
        <span class="medidor-marca-zona">${esc(z.nome)}</span>
      </li>`,
  ).join("");

  elemento.innerHTML = `
    <div class="medidor-trilho">
      <div class="medidor-agua"></div>
      <ol class="medidor-marcas">${marcas}</ol>
      <div class="medidor-marcador"><span class="medidor-valor"></span></div>
    </div>
    <p class="medidor-zona"></p>
  `;
  const valor = elemento.querySelector<HTMLElement>(".medidor-valor")!;
  const zonaTexto = elemento.querySelector<HTMLElement>(".medidor-zona")!;

  return {
    elemento,
    atualizar(m) {
      elemento.style.setProperty("--f", fracaoProfundidade(m).toFixed(4));
      valor.textContent = metros(m);
      zonaTexto.textContent = zonaDaProfundidade(m).nome;
    },
  };
}
