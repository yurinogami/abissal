import { dataHojeBrasilia } from "../../game/daily";
import { profundidadeDaPartida } from "../../game/engine";
import { formatarContagem, melhorProfundidade, msAteProximoDia, sequenciaAtual } from "../../game/historico";
import { zonaDaProfundidade } from "../../game/scoring";
import { criarLume, FALAS } from "../components/lume";
import { definirProfundidade } from "../components/oceano";
import { definirTitulo, esc, metros } from "../dom";
import { navegar, type Tela } from "../router";
import { diarioDeHoje, historico } from "../sessao";

export const telaInicio: Tela = (raiz) => {
  definirTitulo();
  definirProfundidade(0);
  const hoje = dataHojeBrasilia();
  const diario = diarioDeHoje();
  const registros = historico();
  const sequencia = sequenciaAtual(registros, hoje);
  const melhor = melhorProfundidade(registros);

  let blocoDiario: string;
  if (diario?.finalizada) {
    const m = profundidadeDaPartida(diario);
    const zona = zonaDaProfundidade(m);
    blocoDiario = `
      <div class="cartao resultado-dia">
        <p class="rotulo">Mergulho de hoje</p>
        <p class="destaque-numero">${esc(metros(m))}</p>
        <p>${esc(zona.nome)} · ${esc(zona.titulo)}</p>
        <p class="contador">Próximo mergulho em <span class="contador-tempo">${formatarContagem(msAteProximoDia())}</span></p>
        <a class="botao botao-secundario" href="#diario">Ver resultado</a>
      </div>`;
  } else {
    const rotulo = diario ? "Continuar mergulho do dia" : "Mergulho do dia";
    blocoDiario = `<a class="botao botao-principal" href="#diario">${rotulo}</a>`;
  }

  const blocoEstatisticas = registros.length
    ? `
      <dl class="estatisticas">
        <div><dt>Sequência</dt><dd>${sequencia} ${sequencia === 1 ? "dia" : "dias"}</dd></div>
        <div><dt>Melhor mergulho</dt><dd>${esc(metros(melhor))}</dd></div>
      </dl>`
    : "";

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
      ${blocoEstatisticas}
    </section>
  `;
  raiz.querySelector(".tela-inicio")!.append(criarLume(FALAS.inicio).elemento);

  // Contador até a meia-noite de Brasília; na virada, recarrega a tela com o novo dia.
  const tempo = raiz.querySelector<HTMLElement>(".contador-tempo");
  if (!tempo) return;
  const id = setInterval(() => {
    const restante = msAteProximoDia();
    if (dataHojeBrasilia() !== hoje) {
      clearInterval(id);
      navegar("#inicio");
      return;
    }
    tempo.textContent = formatarContagem(restante);
  }, 1000);
  return () => clearInterval(id);
};
