import { Temporizador } from "../../game/timer";

const SEGUNDOS_ALERTA = 5;
const AVISOS = [10, 5];

export type Cronometro = {
  elemento: HTMLElement;
  iniciar: () => void;
  parar: () => void;
  decorrido: () => number;
};

/**
 * Barra de tempo com o número de segundos. Fica vermelha nos últimos 5 s e
 * avisa leitores de tela só aos 10 s e aos 5 s (não a cada segundo).
 */
export function criarCronometro(duracao: number, aoTerminar: () => void): Cronometro {
  const elemento = document.createElement("div");
  elemento.className = "cronometro";
  elemento.innerHTML = `
    <div class="cronometro-barra" aria-hidden="true"><div class="cronometro-preenchimento"></div></div>
    <span class="cronometro-numero" aria-hidden="true">${duracao}</span>
    <span class="sr-only" aria-live="polite"></span>
  `;
  const preenchimento = elemento.querySelector<HTMLElement>(".cronometro-preenchimento")!;
  const numero = elemento.querySelector<HTMLElement>(".cronometro-numero")!;
  const aviso = elemento.querySelector<HTMLElement>("[aria-live]")!;
  const avisados = new Set<number>();

  const temporizador = new Temporizador({
    duracao,
    aoTerminar,
    aoAtualizar(restante) {
      const inteiro = Math.ceil(restante);
      numero.textContent = String(inteiro);
      preenchimento.style.transform = `scaleX(${restante / duracao})`;
      elemento.classList.toggle("alerta", restante <= SEGUNDOS_ALERTA);
      for (const s of AVISOS) {
        if (inteiro <= s && !avisados.has(s) && restante > 0) {
          avisados.add(s);
          aviso.textContent = `${s} segundos`;
        }
      }
    },
  });

  return {
    elemento,
    iniciar: () => temporizador.iniciar(),
    parar: () => temporizador.parar(),
    decorrido: () => temporizador.decorrido(),
  };
}
