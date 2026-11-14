/** Uma tela recebe a raiz e pode devolver uma função de limpeza (parar timers etc.). */
export type Tela = (raiz: HTMLElement) => void | (() => void);

export type Rota = "#inicio" | "#diario" | "#ilimitado" | "#como-jogar";

const ROTA_PADRAO: Rota = "#inicio";

let rotas: Record<Rota, Tela> | null = null;
let raiz: HTMLElement | null = null;
let limpar: void | (() => void);

function rotaAtual(): Rota {
  const hash = location.hash as Rota;
  return rotas && hash in rotas ? hash : ROTA_PADRAO;
}

function renderizar(): void {
  if (!rotas || !raiz) return;
  if (typeof limpar === "function") limpar();
  limpar = undefined;

  const rota = rotaAtual();
  if (location.hash !== rota) {
    history.replaceState(null, "", rota);
  }
  raiz.replaceChildren();
  limpar = rotas[rota](raiz);
  window.scrollTo(0, 0);

  // Leva o foco para o título da tela, para leitores de tela anunciarem a mudança,
  // a menos que a própria tela já tenha focado algo (ex.: o campo de resposta).
  if (!raiz.contains(document.activeElement)) {
    raiz.querySelector<HTMLElement>("h1, h2")?.focus({ preventScroll: true });
  }
}

export function iniciarRoteador(elemento: HTMLElement, tabela: Record<Rota, Tela>): void {
  raiz = elemento;
  rotas = tabela;
  window.addEventListener("hashchange", renderizar);
  renderizar();
}

/** Vai para uma rota; se já estiver nela, renderiza de novo (ex.: nova partida ilimitada). */
export function navegar(rota: Rota): void {
  if (location.hash === rota) renderizar();
  else location.hash = rota;
}
