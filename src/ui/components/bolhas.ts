/**
 * Bolhas subindo e "neve marinha" descendo, num canvas atrás do conteúdo.
 * Quanto mais fundo, menos bolhas e mais neve. Fica parado (e vazio) com
 * prefers-reduced-motion e pausa quando a aba está escondida.
 */

type Particula = {
  x: number;
  y: number;
  r: number;
  velocidade: number;
  fase: number;
  alfa: number;
};

const MAX_BOLHAS = 40;
const MAX_NEVE = 70;
/** A neve começa a aparecer a partir desta fração de profundidade. */
const INICIO_NEVE = 0.35;

export type Bolhas = {
  definirProfundidade: (fracao: number) => void;
  destruir: () => void;
};

export function iniciarBolhas(container: HTMLElement): Bolhas {
  const canvas = document.createElement("canvas");
  container.append(canvas);
  const ctx = canvas.getContext("2d");
  const movimento = window.matchMedia("(prefers-reduced-motion: reduce)");

  let largura = 0;
  let altura = 0;
  let fracao = 0;
  let bolhas: Particula[] = [];
  let neve: Particula[] = [];
  let quadro = 0;
  let ultimo = 0;

  const aleatorio = (min: number, max: number) => min + Math.random() * (max - min);

  const novaBolha = (emQualquerAltura: boolean): Particula => ({
    x: aleatorio(0, largura),
    y: emQualquerAltura ? aleatorio(0, altura) : altura + 10,
    r: aleatorio(1.5, 4.5),
    velocidade: aleatorio(18, 48),
    fase: aleatorio(0, Math.PI * 2),
    alfa: aleatorio(0.15, 0.4),
  });

  const novaNeve = (emQualquerAltura: boolean): Particula => ({
    x: aleatorio(0, largura),
    y: emQualquerAltura ? aleatorio(0, altura) : -5,
    r: aleatorio(0.6, 1.8),
    velocidade: aleatorio(4, 14),
    fase: aleatorio(0, Math.PI * 2),
    alfa: aleatorio(0.15, 0.45),
  });

  function quantidades(): { nBolhas: number; nNeve: number } {
    const escala = Math.min(1, (largura * altura) / (1280 * 800));
    const nBolhas = Math.round(MAX_BOLHAS * escala * (1 - fracao * 0.7));
    const neveRel = Math.max(0, (fracao - INICIO_NEVE) / (1 - INICIO_NEVE));
    const nNeve = Math.round(MAX_NEVE * escala * neveRel);
    return { nBolhas: Math.max(6, nBolhas), nNeve };
  }

  function ajustarQuantidades(): void {
    const { nBolhas, nNeve } = quantidades();
    while (bolhas.length < nBolhas) bolhas.push(novaBolha(true));
    bolhas.length = Math.min(bolhas.length, nBolhas);
    while (neve.length < nNeve) neve.push(novaNeve(true));
    neve.length = Math.min(neve.length, nNeve);
  }

  function redimensionar(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    largura = container.clientWidth;
    altura = container.clientHeight;
    canvas.width = Math.round(largura * dpr);
    canvas.height = Math.round(altura * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    bolhas = [];
    neve = [];
    ajustarQuantidades();
  }

  function desenhar(t: number): void {
    if (!ctx) return;
    const dt = Math.min(0.05, (t - ultimo) / 1000 || 0);
    ultimo = t;
    ctx.clearRect(0, 0, largura, altura);

    for (let i = 0; i < bolhas.length; i++) {
      const b = bolhas[i];
      b.y -= b.velocidade * dt;
      b.fase += dt * 1.5;
      if (b.y < -10) bolhas[i] = novaBolha(false);
      const x = b.x + Math.sin(b.fase) * 6;
      ctx.beginPath();
      ctx.arc(x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(232, 244, 248, ${b.alfa})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (let i = 0; i < neve.length; i++) {
      const n = neve[i];
      n.y += n.velocidade * dt;
      n.fase += dt * 0.6;
      if (n.y > altura + 5) neve[i] = novaNeve(false);
      ctx.beginPath();
      ctx.arc(n.x + Math.sin(n.fase) * 10, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(232, 244, 248, ${n.alfa})`;
      ctx.fill();
    }
  }

  function laco(t: number): void {
    desenhar(t);
    quadro = requestAnimationFrame(laco);
  }

  function parar(): void {
    cancelAnimationFrame(quadro);
    quadro = 0;
  }

  function atualizarEstado(): void {
    const deveRodar = !movimento.matches && document.visibilityState === "visible";
    if (deveRodar && !quadro) {
      ultimo = performance.now();
      quadro = requestAnimationFrame(laco);
    } else if (!deveRodar) {
      parar();
      if (movimento.matches) ctx?.clearRect(0, 0, largura, altura);
    }
  }

  redimensionar();
  atualizarEstado();
  window.addEventListener("resize", redimensionar);
  document.addEventListener("visibilitychange", atualizarEstado);
  movimento.addEventListener("change", atualizarEstado);

  return {
    definirProfundidade(novaFracao) {
      fracao = Math.min(1, Math.max(0, novaFracao));
      ajustarQuantidades();
    },
    destruir() {
      parar();
      window.removeEventListener("resize", redimensionar);
      document.removeEventListener("visibilitychange", atualizarEstado);
      movimento.removeEventListener("change", atualizarEstado);
      canvas.remove();
    },
  };
}
