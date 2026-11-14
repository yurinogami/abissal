import type { Partida } from "../game/engine";

/**
 * Estado em memória da aba atual. Na Fase 4, a partida do Diário passa a ser
 * salva no localStorage; por enquanto ela só vive enquanto a aba está aberta.
 */
export const sessao: { diario: Partida | null; ilimitado: Partida | null } = {
  diario: null,
  ilimitado: null,
};
