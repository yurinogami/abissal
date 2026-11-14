import type { Pergunta, Resposta } from "./tipos";

const ARTIGOS_INICIAIS = /^(os|as|o|a|umas|uns|uma|um) /;

/**
 * Normaliza um texto para comparação (seção 3.4 do plano):
 * minúsculas, sem acentos, pontuação vira espaço, espaços colapsados
 * e sem artigo inicial.
 *
 * Extensão: "+" e "#" viram " plus " e " sharp " antes de remover a pontuação,
 * para que "C++" e "C#" não se confundam com "C".
 */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\+/g, " plus ")
    .replace(/#/g, " sharp ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(ARTIGOS_INICIAIS, "");
}

/** Distância de edição de Levenshtein (inserção, remoção e troca custam 1). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let anterior = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(anterior[j] + 1, atual[j - 1] + 1, anterior[j - 1] + custo);
    }
    anterior = atual;
  }
  return anterior[b.length];
}

/**
 * Quantos erros de digitação são tolerados para uma forma de resposta:
 * 0 abaixo de 5 letras, 1 de 5 a 8 letras, 2 com 9 ou mais.
 * Espaços não contam como letras.
 */
export function toleranciaPara(formaNormalizada: string): number {
  const letras = formaNormalizada.replace(/ /g, "").length;
  if (letras < 5) return 0;
  if (letras <= 8) return 1;
  return 2;
}

export type ResultadoChecagem =
  | { tipo: "vazio" }
  | { tipo: "acerto"; resposta: Resposta; exato: boolean }
  | { tipo: "erro"; mensagem?: string };

function semPrefixo(texto: string, prefixo?: string): string {
  if (!prefixo) return texto;
  const p = normalizar(prefixo);
  return texto.startsWith(p + " ") ? texto.slice(p.length + 1) : texto;
}

function formasDe(resposta: Resposta, prefixoIgnorado?: string): string[] {
  return [resposta.r, ...(resposta.alias ?? [])]
    .map((f) => semPrefixo(normalizar(f), prefixoIgnorado))
    .filter((f) => f.length > 0);
}

/** Verifica uma tentativa contra as respostas aceitas de uma pergunta. */
export function checarResposta(pergunta: Pergunta, tentativa: string): ResultadoChecagem {
  const alvo = semPrefixo(normalizar(tentativa), pergunta.ignorarPrefixo);
  if (!alvo) return { tipo: "vazio" };

  // 1. Correspondência exata com resposta ou alias.
  for (const resposta of pergunta.respostas) {
    if (formasDe(resposta, pergunta.ignorarPrefixo).includes(alvo)) {
      return { tipo: "acerto", resposta, exato: true };
    }
  }

  // 2. Respostas que aceitam qualquer complemento ("baleia azul").
  for (const resposta of pergunta.respostas) {
    if (!resposta.prefixo) continue;
    const p = normalizar(resposta.prefixo);
    if (alvo === p || alvo.startsWith(p + " ")) {
      return { tipo: "acerto", resposta, exato: true };
    }
  }

  // 3. Erros conhecidos com fala especial.
  if (pergunta.mensagens) {
    for (const [chave, mensagem] of Object.entries(pergunta.mensagens)) {
      if (normalizar(chave) === alvo) return { tipo: "erro", mensagem };
    }
  }

  // 4. Tolerância a erro de digitação; empate entre respostas diferentes = erro.
  let melhorDistancia = Infinity;
  let candidatas: Resposta[] = [];
  for (const resposta of pergunta.respostas) {
    for (const forma of formasDe(resposta, pergunta.ignorarPrefixo)) {
      const limite = toleranciaPara(forma);
      if (limite === 0) continue;
      const d = levenshtein(alvo, forma);
      if (d > limite) continue;
      if (d < melhorDistancia) {
        melhorDistancia = d;
        candidatas = [resposta];
      } else if (d === melhorDistancia && !candidatas.includes(resposta)) {
        candidatas.push(resposta);
      }
    }
  }
  if (candidatas.length === 1) {
    return { tipo: "acerto", resposta: candidatas[0], exato: false };
  }
  return { tipo: "erro" };
}
