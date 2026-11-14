import type { EstadoPergunta } from "../../game/engine";
import { maisRaras, pontosParaMetros, raridade } from "../../game/scoring";
import type { Pergunta } from "../../game/tipos";
import { esc, metros, pts } from "../dom";

/** HTML da revelação mostrada entre uma pergunta e outra (seção 5.4). */
export function htmlRevelacao(pergunta: Pergunta, estado: EstadoPergunta, ultima: boolean): string {
  let resultado: string;
  if (estado.acerto) {
    const { resposta, pontos } = estado.acerto;
    const posicao = ((pontos - 1) / 9) * 100;
    resultado = `
      <p class="revelacao-resposta">“${esc(resposta)}”</p>
      <p class="revelacao-pontos raridade-${raridade(pontos)}">
        +${pontos} ${pontos === 1 ? "ponto" : "pontos"} · +${esc(metros(pontosParaMetros(pontos)))}
      </p>
      <div class="raridade" role="img" aria-label="Raridade ${pontos} de 10">
        <span>Comum</span>
        <div class="raridade-barra"><span class="raridade-marcador" style="left: ${posicao}%"></span></div>
        <span>Rara</span>
      </div>`;
  } else if (estado.pulou) {
    resultado = `<p class="revelacao-resposta">Você pulou esta.</p><p class="revelacao-pontos raridade-erro">0 pontos</p>`;
  } else {
    resultado = `<p class="revelacao-resposta">O tempo acabou.</p><p class="revelacao-pontos raridade-erro">0 pontos</p>`;
  }

  const raras = maisRaras(pergunta, 3)
    .map((r) => `<li><span>${esc(r.r)}</span><span class="raras-pontos">${pts(r.p)} · ${esc(metros(pontosParaMetros(r.p)))}</span></li>`)
    .join("");

  return `
    <section class="revelacao" aria-labelledby="revelacao-titulo">
      <h2 id="revelacao-titulo" class="sr-only">Resultado da pergunta</h2>
      <p class="pergunta-texto pequena">${esc(pergunta.pergunta)}</p>
      ${resultado}
      <div class="cartao raras">
        <p class="rotulo">Quem desceu mais fundo respondeu:</p>
        <ul>${raras}</ul>
      </div>
      <button type="button" class="botao botao-principal" data-acao="proxima">
        ${ultima ? "Ver resultado" : "Próxima pergunta"}
      </button>
    </section>`;
}
