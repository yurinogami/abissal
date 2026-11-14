import { type Partida, profundidadeDaPartida } from "../../game/engine";
import { pontosParaMetros, raridade, zonaDaProfundidade } from "../../game/scoring";
import type { Pergunta } from "../../game/tipos";
import { criarLume, FALAS } from "../components/lume";
import { definirTitulo, esc, metros } from "../dom";
import { navegar } from "../router";

/** Tela de fim de partida (seção 5.5). */
export function renderizarFim(raiz: HTMLElement, partida: Partida, perguntas: Pergunta[]): void {
  definirTitulo("Resultado");
  const total = profundidadeDaPartida(partida);
  const zona = zonaDaProfundidade(total);

  const resumo = partida.estados
    .map((estado, i) => {
      const p = estado.acerto?.pontos ?? 0;
      const resposta = estado.acerto ? esc(estado.acerto.resposta) : estado.pulou ? "pulou" : "tempo esgotado";
      return `
        <li class="resumo-item raridade-${raridade(p)}">
          <span class="resumo-pergunta">${esc(perguntas[i].pergunta)}</span>
          <span class="resumo-resposta">${resposta}</span>
          <span class="resumo-pontos">${p} pts · ${esc(metros(pontosParaMetros(p)))}</span>
        </li>`;
    })
    .join("");

  raiz.innerHTML = `
    <section class="tela tela-fim">
      <h1 tabindex="-1" class="sr-only">Resultado do mergulho</h1>
      <div class="cartao fim-total">
        <p class="rotulo">${partida.modo === "diario" ? "Mergulho do dia" : "Mergulho ilimitado"}</p>
        <p class="destaque-numero">${esc(metros(total))}</p>
        <p class="fim-zona">${esc(zona.nome)} <span>(${esc(zona.nomeCientifico)})</span></p>
        <p class="fim-titulo">${esc(zona.titulo)}</p>
      </div>
      <ol class="resumo">${resumo}</ol>
      <div class="acoes">
        <button type="button" class="botao botao-principal" data-acao="ilimitado">Jogar ilimitado</button>
        <a class="botao botao-secundario" href="#inicio">Voltar ao início</a>
      </div>
    </section>
  `;

  const fala = partida.modo === "diario" ? FALAS.fimDiario(metros(total)) : FALAS.fimIlimitado(metros(total));
  raiz.querySelector(".tela-fim")!.append(criarLume(fala).elemento);
  raiz.querySelector('[data-acao="ilimitado"]')!.addEventListener("click", () => navegar("#ilimitado"));
}
