export type OpcoesTemporizador = {
  /** Duração em segundos. */
  duracao: number;
  /** Chamado a cada atualização, com os segundos restantes (pode ter fração). */
  aoAtualizar?: (restante: number) => void;
  /** Chamado uma única vez quando o tempo chega a zero. */
  aoTerminar?: () => void;
  /** Intervalo entre atualizações, em ms. */
  intervalo?: number;
  /** Relógio em ms (injetável para testes). */
  agora?: () => number;
};

/**
 * Contagem regressiva baseada no relógio, não na soma de intervalos:
 * se a aba travar por um tempo, o tempo restante continua correto.
 * Para sozinha em 0 e chama aoTerminar uma única vez.
 */
export class Temporizador {
  private readonly duracaoMs: number;
  private readonly agora: () => number;
  private inicio = 0;
  private id: ReturnType<typeof setInterval> | null = null;
  private terminou = false;

  constructor(private readonly opcoes: OpcoesTemporizador) {
    this.duracaoMs = opcoes.duracao * 1000;
    this.agora = opcoes.agora ?? (() => Date.now());
  }

  iniciar(): void {
    this.parar();
    this.inicio = this.agora();
    this.terminou = false;
    this.opcoes.aoAtualizar?.(this.opcoes.duracao);
    this.id = setInterval(() => this.atualizar(), this.opcoes.intervalo ?? 100);
  }

  parar(): void {
    if (this.id !== null) clearInterval(this.id);
    this.id = null;
  }

  get rodando(): boolean {
    return this.id !== null;
  }

  /** Segundos que já passaram (no máximo a duração). */
  decorrido(): number {
    if (this.inicio === 0) return 0;
    return Math.min(this.duracaoMs, this.agora() - this.inicio) / 1000;
  }

  /** Segundos restantes (no mínimo 0). */
  restante(): number {
    return Math.max(0, this.opcoes.duracao - this.decorrido());
  }

  private atualizar(): void {
    const restante = this.restante();
    this.opcoes.aoAtualizar?.(restante);
    if (restante <= 0 && !this.terminou) {
      this.terminou = true;
      this.parar();
      this.opcoes.aoTerminar?.();
    }
  }
}
