import { esc } from "../dom";

/** Falas do Lume (seção 2 do plano). */
export const FALAS = {
  inicio: "Pronto pra descer? Respira fundo.",
  comum: "Boa! Mas dá pra ir mais fundo.",
  media: "Bela descida! Essa não é qualquer um que lembra.",
  rara: "Uau, isso aqui quase ninguém lembra!",
  erro: "Hmm, essa não está no meu mapa. Tenta outra.",
  repetida: "Você já tentou essa.",
  tempo: "O oxigênio acabou nessa. Bora pra próxima.",
  pulo: "Tudo bem, segue o mergulho.",
  fimDiario: (profundidade: string) => `Você chegou a ${profundidade}. Volta amanhã!`,
  fimIlimitado: (profundidade: string) => `Você chegou a ${profundidade}. Mais um mergulho?`,
} as const;

export type Humor = "neutro" | "feliz" | "uau" | "triste";

export type Lume = {
  elemento: HTMLElement;
  falar: (texto: string, humor?: Humor) => void;
};

/**
 * O Lume, peixe-lanterna que comenta o jogo. Nesta fase é só um balão de fala;
 * o desenho em SVG chega na Fase 3.
 */
export function criarLume(textoInicial: string = FALAS.inicio): Lume {
  const elemento = document.createElement("aside");
  elemento.className = "lume";
  elemento.dataset.humor = "neutro";
  elemento.innerHTML = `
    <div class="lume-avatar" aria-hidden="true">🐟</div>
    <p class="lume-fala"><span class="sr-only">Lume diz: </span><span class="lume-texto">${esc(textoInicial)}</span></p>
  `;
  const texto = elemento.querySelector<HTMLElement>(".lume-texto")!;

  return {
    elemento,
    falar(novoTexto, humor = "neutro") {
      texto.textContent = novoTexto;
      elemento.dataset.humor = humor;
    },
  };
}
