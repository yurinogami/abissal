/** Uma resposta aceita para uma pergunta. */
export type Resposta = {
  /** Resposta exibida. */
  r: string;
  /** Pontos de 1 (muito comum) a 10 (muito rara). */
  p: number;
  /** Outras formas aceitas. */
  alias?: string[];
  /** Aceita qualquer tentativa que comece com esta palavra (ex.: "baleia" aceita "baleia azul"). */
  prefixo?: string;
};

export type Pergunta = {
  id: string;
  pergunta: string;
  categoria: string;
  respostas: Resposta[];
  /** Palavra inicial opcional na tentativa (ex.: "rio" em "rio Xingu"). */
  ignorarPrefixo?: string;
  /** Falas especiais do Lume para tentativas erradas conhecidas (chave = texto da tentativa). */
  mensagens?: Record<string, string>;
};
