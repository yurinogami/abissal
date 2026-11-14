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

/**
 * Copia texto para a área de transferência. Usa a API moderna e, se ela não
 * existir ou for negada (HTTP, navegador antigo), cai para o execCommand.
 */
export async function copiarTexto(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // tenta o método antigo abaixo
  }
  const area = document.createElement("textarea");
  area.value = texto;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

/** "1 pt", "5 pts". */
export function pts(n: number): string {
  return `${n} ${n === 1 ? "pt" : "pts"}`;
}

export function prefereMenosMovimento(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
