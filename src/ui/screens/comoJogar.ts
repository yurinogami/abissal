import { TEMPO_POR_PERGUNTA } from "../../game/engine";
import { definirTitulo } from "../dom";
import type { Tela } from "../router";

export const telaComoJogar: Tela = (raiz) => {
  definirTitulo("Como jogar");
  raiz.innerHTML = `
    <section class="tela tela-como-jogar">
      <h1 tabindex="-1">Como jogar</h1>
      <ol class="regras">
        <li>Todo dia tem <strong>7 perguntas</strong> do tipo “Cite um…”, as mesmas para todo mundo.</li>
        <li>Você tem <strong>${TEMPO_POR_PERGUNTA} segundos</strong> por pergunta e pode tentar quantas vezes quiser. Errar não tira pontos.</li>
        <li>A pergunta acaba no <strong>primeiro acerto</strong>, quando o tempo acaba ou quando você pula.</li>
        <li>Respostas óbvias valem pouco; <strong>respostas raras valem até 10 pontos</strong>.</li>
        <li>Cada ponto vale <strong>10 metros</strong> de profundidade. Até onde você consegue descer?</li>
      </ol>

      <div class="cartao exemplo">
        <p class="rotulo">Exemplo</p>
        <p class="exemplo-pergunta">“Cite um planeta do Sistema Solar.”</p>
        <ul>
          <li>“Terra” vale 1 ponto (10 m).</li>
          <li>“Netuno” vale 5 pontos (50 m).</li>
        </ul>
      </div>

      <p class="dica">Acentos, maiúsculas e pequenos erros de digitação não atrapalham.
        No teclado: <kbd>Enter</kbd> responde e avança, <kbd>Esc</kbd> duas vezes pula.</p>

      <a class="botao botao-principal" href="#inicio">Voltar ao início</a>
    </section>
  `;
};
