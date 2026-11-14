import { BANCO } from "../../data/banco";
import { dataHojeBrasilia, perguntasAleatorias, perguntasDoDia } from "../../game/daily";
import {
  avancar,
  criarPartida,
  esgotarTempo,
  type EstadoPergunta,
  estadoAtual,
  type Modo,
  type Partida,
  PERGUNTAS_POR_PARTIDA,
  perguntaEncerrada,
  profundidadeDaPartida,
  pular,
  TEMPO_POR_PERGUNTA,
  tentar,
} from "../../game/engine";
import { raridade } from "../../game/scoring";
import type { Pergunta } from "../../game/tipos";
import { type Cronometro, criarCronometro } from "../components/cronometro";
import { criarLume, FALAS, type Humor, type Lume } from "../components/lume";
import { criarMedidor } from "../components/medidorProfundidade";
import { definirProfundidade } from "../components/oceano";
import { $, definirTitulo, esc, metros } from "../dom";
import type { Tela } from "../router";
import { sessao } from "../sessao";
import { renderizarFim } from "./fim";
import { htmlRevelacao } from "./revelacao";

const PERGUNTAS_POR_ID = new Map(BANCO.map((q) => [q.id, q]));
/** Janela para apertar Esc de novo e confirmar o pulo. */
const JANELA_ESC_MS = 2000;
/** Evita que um Enter segurado pule a revelação sem querer. */
const ESPERA_REVELACAO_MS = 300;

function obterPartida(modo: Modo): Partida {
  const hoje = dataHojeBrasilia();
  if (modo === "diario") {
    if (sessao.diario?.data !== hoje) {
      sessao.diario = criarPartida("diario", hoje, perguntasDoDia(BANCO, hoje, PERGUNTAS_POR_PARTIDA));
    }
    return sessao.diario;
  }
  sessao.ilimitado = criarPartida("ilimitado", hoje, perguntasAleatorias(BANCO, PERGUNTAS_POR_PARTIDA));
  return sessao.ilimitado;
}

function falaDaRevelacao(estado: EstadoPergunta): [string, Humor] {
  if (estado.acerto) {
    const tipo = raridade(estado.acerto.pontos);
    if (tipo === "rara") return [FALAS.rara, "uau"];
    if (tipo === "media") return [FALAS.media, "feliz"];
    return [FALAS.comum, "feliz"];
  }
  if (estado.pulou) return [FALAS.pulo, "neutro"];
  return [FALAS.tempo, "triste"];
}

export function telaJogo(modo: Modo): Tela {
  return (raiz) => {
    const partida = obterPartida(modo);
    const perguntas: Pergunta[] = partida.perguntas.map((id) => {
      const q = PERGUNTAS_POR_ID.get(id);
      if (!q) throw new Error(`Pergunta ${id} não existe no banco`);
      return q;
    });
    const lume: Lume = criarLume();
    const medidor = criarMedidor();

    /** Coloca o medidor logo depois do topo e atualiza a profundidade. */
    function encaixarMedidor(tela: HTMLElement): void {
      $(tela, ".jogo-topo").after(medidor.elemento);
      // Dois quadros: o navegador pinta a posição antiga antes de animar até a nova.
      requestAnimationFrame(() => requestAnimationFrame(() => medidor.atualizar(profundidadeDaPartida(partida))));
    }

    let cronometro: Cronometro | null = null;
    let limparTeclado: (() => void) | null = null;

    function limparEtapa(): void {
      cronometro?.parar();
      cronometro = null;
      limparTeclado?.();
      limparTeclado = null;
    }

    function htmlTopo(): string {
      return `
        <header class="jogo-topo">
          <span>Pergunta ${partida.atual + 1} de ${partida.perguntas.length}</span>
          <span class="jogo-profundidade"><span class="sr-only">Profundidade: </span>${esc(metros(profundidadeDaPartida(partida)))}</span>
        </header>`;
    }

    function mostrar(): void {
      limparEtapa();
      definirProfundidade(profundidadeDaPartida(partida));
      if (partida.finalizada) {
        renderizarFim(raiz, partida, perguntas);
        return;
      }
      if (perguntaEncerrada(estadoAtual(partida))) mostrarRevelacao();
      else mostrarPergunta();
    }

    function mostrarPergunta(): void {
      const pergunta = perguntas[partida.atual];
      const estado = estadoAtual(partida);
      definirTitulo(`Pergunta ${partida.atual + 1} de ${partida.perguntas.length}`);

      raiz.innerHTML = `
        <section class="tela tela-jogo">
          ${htmlTopo()}
          <div class="slot-cronometro"></div>
          <h1 class="pergunta-texto" tabindex="-1">${esc(pergunta.pergunta)}</h1>
          <form class="resposta-form" novalidate>
            <label for="resposta" class="sr-only">Sua resposta</label>
            <input id="resposta" class="resposta-campo" type="text" maxlength="60"
              autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" />
            <div class="resposta-botoes">
              <button type="submit" class="botao botao-principal">Responder</button>
              <button type="button" class="botao botao-secundario" data-acao="pular">Pular</button>
            </div>
          </form>
          <p class="aviso-esc" hidden>Aperte <kbd>Esc</kbd> de novo para pular.</p>
          <ul class="tentativas" aria-label="Tentativas erradas"></ul>
          <p class="sr-only anuncio" aria-live="assertive"></p>
        </section>`;

      const tela = $(raiz, ".tela-jogo");
      encaixarMedidor(tela);
      const form =$<HTMLFormElement>(tela, ".resposta-form");
      const campo = $<HTMLInputElement>(tela, "#resposta");
      const lista = $(tela, ".tentativas");
      const anuncio = $(tela, ".anuncio");
      const avisoEsc = $(tela, ".aviso-esc");

      const adicionarTentativa = (texto: string) => {
        const li = document.createElement("li");
        li.innerHTML = `<s>${esc(texto)}</s>`;
        lista.prepend(li);
      };
      estado.tentativas.forEach(adicionarTentativa);

      lume.falar(partida.atual === 0 && estado.tentativas.length === 0 ? FALAS.inicio : "Essa é funda. Vai lá!");
      tela.append(lume.elemento);

      cronometro = criarCronometro(TEMPO_POR_PERGUNTA, () => {
        esgotarTempo(partida);
        mostrar();
      });
      $(tela, ".slot-cronometro").append(cronometro.elemento);

      const tremer = () => {
        campo.classList.remove("tremer");
        void campo.offsetWidth; // reinicia a animação
        campo.classList.add("tremer");
      };

      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        if (!cronometro) return;
        const texto = campo.value;
        const r = tentar(partida, pergunta, texto, cronometro.decorrido());
        switch (r.tipo) {
          case "vazio":
            campo.focus();
            return;
          case "repetida":
            lume.falar(FALAS.repetida, "neutro");
            anuncio.textContent = `${texto.trim()}: você já tentou essa.`;
            tremer();
            campo.select();
            return;
          case "erro":
            adicionarTentativa(texto.trim());
            lume.falar(r.mensagem ?? FALAS.erro, "triste");
            anuncio.textContent = `${texto.trim()}: não está na lista.`;
            tremer();
            campo.value = "";
            campo.focus();
            return;
          case "acerto":
          case "encerrada":
            mostrar();
            return;
        }
      });

      $(tela, '[data-acao="pular"]').addEventListener("click", () => {
        pular(partida, cronometro?.decorrido() ?? 0);
        mostrar();
      });

      let escEm = 0;
      const aoTeclar = (ev: KeyboardEvent) => {
        if (ev.key !== "Escape") return;
        ev.preventDefault();
        const agora = Date.now();
        if (agora - escEm <= JANELA_ESC_MS) {
          pular(partida, cronometro?.decorrido() ?? 0);
          mostrar();
          return;
        }
        escEm = agora;
        avisoEsc.hidden = false;
        anuncio.textContent = "Aperte Esc de novo para pular.";
        setTimeout(() => (avisoEsc.hidden = true), JANELA_ESC_MS);
      };
      document.addEventListener("keydown", aoTeclar);
      limparTeclado = () => document.removeEventListener("keydown", aoTeclar);

      cronometro.iniciar();
      campo.focus();
    }

    function mostrarRevelacao(): void {
      const pergunta = perguntas[partida.atual];
      const estado = estadoAtual(partida);
      const ultima = partida.atual === partida.perguntas.length - 1;
      definirTitulo("Revelação");

      raiz.innerHTML = `<section class="tela tela-jogo">${htmlTopo()}${htmlRevelacao(pergunta, estado, ultima)}</section>`;
      const tela = $(raiz, ".tela-jogo");
      encaixarMedidor(tela);
      const [fala, humor] = falaDaRevelacao(estado);
      lume.falar(fala, humor);
      tela.append(lume.elemento);

      const mostradaEm = performance.now();
      const proxima = () => {
        if (performance.now() - mostradaEm < ESPERA_REVELACAO_MS) return;
        avancar(partida);
        mostrar();
      };
      const botao = $<HTMLButtonElement>(tela, '[data-acao="proxima"]');
      botao.addEventListener("click", proxima);

      // Enter avança mesmo se o foco saiu do botão.
      const aoTeclar = (ev: KeyboardEvent) => {
        if (ev.key !== "Enter" || ev.repeat) return;
        const alvo = ev.target;
        if (alvo instanceof Element && alvo.closest("button, a, input, textarea")) return;
        ev.preventDefault();
        proxima();
      };
      document.addEventListener("keydown", aoTeclar);
      limparTeclado = () => document.removeEventListener("keydown", aoTeclar);
      botao.focus();
    }

    mostrar();

    return () => {
      // Sair no meio de uma pergunta conta como pergunta perdida (evita ganhar tempo extra).
      if (cronometro && !partida.finalizada && !perguntaEncerrada(estadoAtual(partida))) {
        esgotarTempo(partida);
      }
      limparEtapa();
    };
  };
}
