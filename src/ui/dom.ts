/** Escapa texto para uso seguro dentro de HTML. */
export function esc(texto: string | number): string {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** querySelector que falha alto se o elemento não existir. */
export function $<T extends Element = HTMLElement>(raiz: ParentNode, seletor: string): T {
  const el = raiz.querySelector<T>(seletor);
  if (!el) throw new Error(`Elemento não encontrado: ${seletor}`);
  return el;
}

export function definirTitulo(parte?: string): void {
  document.title = parte ? `${parte} · Abissal` : "Abissal";
}

/** Formata metros com separador de milhar do pt-BR. */
export function metros(m: number): string {
  return `${m.toLocaleString("pt-BR")} m`;
}

/** "1 pt", "5 pts". */
export function pts(n: number): string {
  return `${n} ${n === 1 ? "pt" : "pts"}`;
}

export function prefereMenosMovimento(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
