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
  /**
   * Primeiro dia (AAAA-MM-DD) em que a pergunta pode cair no Diário. Perguntas
   * novas depois do lançamento precisam de uma data futura, para não mudar os
   * Diários que já aconteceram nem o de hoje.
   */
  desde?: string;
  /** Último dia em que a pergunta pode cair no Diário (use em vez de apagar). */
  ate?: string;
};
