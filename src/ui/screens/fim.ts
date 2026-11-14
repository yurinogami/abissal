import { numeroDoDia } from "../../game/daily";
import { type Partida, pontosPorPergunta, profundidadeDaPartida } from "../../game/engine";
import { pontosParaMetros, raridade, zonaDaProfundidade } from "../../game/scoring";
import { enderecoDoSite, textoCompartilhamento } from "../../game/share";
import type { Pergunta } from "../../game/tipos";
import { criarLume, FALAS } from "../components/lume";
import { criarMedidor } from "../components/medidorProfundidade";
import { definirProfundidade } from "../components/oceano";
import { copiarTexto, definirTitulo, esc, metros, pts } from "../dom";
import { navegar } from "../router";

/** "Mergulho do dia #12", ou "(prévia)" antes do lançamento. */
function rotuloDiario(numero: number): string {
  return numero >= 1 ? `Mergulho do dia #${numero}` : "Mergulho do dia (prévia)";
}

/** Tela de fim de partida (seção 5.5). */
export function renderizarFim(raiz: HTMLElement, partida: Partida, perguntas: Pergunta[]): void {
  definirTitulo("Resultado");
  const total = profundidadeDaPartida(partida);
  const zona = zonaDaProfundidade(total);
  definirProfundidade(total);

  const resumo = partida.estados
    .map((estado, i) => {
      const p = estado.acerto?.pontos ?? 0;
      const resposta = estado.acerto ? esc(estado.acerto.resposta) : estado.pulou ? "pulou" : "tempo esgotado";
      return `
        <li class="resumo-item raridade-${raridade(p)}">
          <span class="resumo-pergunta">${esc(perguntas[i].pergunta)}</span>
          <span class="resumo-resposta">${resposta}</span>
          <span class="resumo-pontos">${pts(p)} · ${esc(metros(pontosParaMetros(p)))}</span>
        </li>`;
    })
    .join("");

  raiz.innerHTML = `
    <section class="tela tela-fim">
      <h1 tabindex="-1" class="sr-only">Resultado do mergulho</h1>
      <div class="cartao fim-total">
        <p class="rotulo">${partida.modo === "diario" ? rotuloDiario(numeroDoDia(partida.data)) : "Mergulho ilimitado"}</p>
        <p class="destaque-numero">${esc(metros(total))}</p>
        <p class="fim-zona">${esc(zona.nome)} <span>(${esc(zona.nomeCientifico)})</span></p>
        <p class="fim-titulo">${esc(zona.titulo)}</p>
      </div>
      <ol class="resumo">${resumo}</ol>
      <div class="acoes">
        <button type="button" class="botao botao-principal" data-acao="copiar">Copiar resultado</button>
        <p class="copiar-aviso" aria-live="polite"></p>
        <button type="button" class="botao botao-secundario" data-acao="ilimitado">Jogar ilimitado</button>
        <a class="botao botao-secundario" href="#inicio">Voltar ao início</a>
      </div>
    </section>
  `;

  const fala = partida.modo === "diario" ? FALAS.fimDiario(metros(total)) : FALAS.fimIlimitado(metros(total));
  raiz.querySelector(".tela-fim")!.append(criarLume(fala).elemento);
  const medidor = criarMedidor();
  raiz.querySelector(".fim-total")!.after(medidor.elemento);
  requestAnimationFrame(() => requestAnimationFrame(() => medidor.atualizar(total)));

  raiz.querySelector('[data-acao="ilimitado"]')!.addEventListener("click", () => navegar("#ilimitado"));

  const aviso = raiz.querySelector<HTMLElement>(".copiar-aviso")!;
  raiz.querySelector('[data-acao="copiar"]')!.addEventListener("click", async () => {
    const texto = textoCompartilhamento({
      modo: partida.modo,
      numeroDia: numeroDoDia(partida.data),
      pontosPorPergunta: pontosPorPergunta(partida),
      endereco: enderecoDoSite(location.href),
    });
    const ok = await copiarTexto(texto);
    aviso.textContent = ok ? "Copiado! Agora é só colar onde quiser." : "Não deu para copiar. Seu navegador bloqueou a área de transferência.";
  });
}
