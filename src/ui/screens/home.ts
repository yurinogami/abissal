import { dataHojeBrasilia } from "../../game/daily";
import { profundidadeDaPartida } from "../../game/engine";
import { zonaDaProfundidade } from "../../game/scoring";
import { criarLume, FALAS } from "../components/lume";
import { definirProfundidade } from "../components/oceano";
import { definirTitulo, esc, metros } from "../dom";
import type { Tela } from "../router";
import { sessao } from "../sessao";

export const telaInicio: Tela = (raiz) => {
  definirTitulo();
  definirProfundidade(0);
  const hoje = dataHojeBrasilia();
  const diario = sessao.diario?.data === hoje ? sessao.diario : null;

  let blocoDiario: string;
  if (diario?.finalizada) {
    const m = profundidadeDaPartida(diario);
    const zona = zonaDaProfundidade(m);
    blocoDiario = `
      <div class="cartao resultado-dia">
        <p class="rotulo">Mergulho de hoje</p>
        <p class="destaque-numero">${esc(metros(m))}</p>
        <p>${esc(zona.nome)} · ${esc(zona.titulo)}</p>
        <a class="botao botao-secundario" href="#diario">Ver resultado</a>
      </div>`;
  } else {
    const rotulo = diario ? "Continuar mergulho do dia" : "Mergulho do dia";
    blocoDiario = `<a class="botao botao-principal" href="#diario">${rotulo}</a>`;
  }

  raiz.innerHTML = `
    <section class="tela tela-inicio">
      <header class="marca">
        <h1 class="logo" tabindex="-1">Abissal</h1>
        <p class="slogan">Quanto mais rara a resposta, mais fundo você vai.</p>
      </header>
      <div class="acoes">
        ${blocoDiario}
        <a class="botao botao-secundario" href="#ilimitado">Modo ilimitado</a>
        <a class="link" href="#como-jogar">Como jogar</a>
      </div>
    </section>
  `;
  raiz.querySelector(".tela-inicio")!.append(criarLume(FALAS.inicio).elemento);
};
