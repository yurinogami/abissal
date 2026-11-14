import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Temporizador } from "../src/game/timer";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-20T12:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("Temporizador", () => {
  it("para em 0 e encerra sozinho, chamando aoTerminar uma vez (critério de aceite)", () => {
    const aoTerminar = vi.fn();
    const valores: number[] = [];
    const t = new Temporizador({ duracao: 25, aoTerminar, aoAtualizar: (r) => valores.push(r) });
    t.iniciar();

    vi.advanceTimersByTime(24_900);
    expect(aoTerminar).not.toHaveBeenCalled();
    expect(t.restante()).toBeCloseTo(0.1, 5);

    vi.advanceTimersByTime(100);
    expect(aoTerminar).toHaveBeenCalledTimes(1);
    expect(t.restante()).toBe(0);
    expect(t.rodando).toBe(false);

    vi.advanceTimersByTime(5_000);
    expect(aoTerminar).toHaveBeenCalledTimes(1);
    expect(Math.min(...valores)).toBe(0);
    expect(valores[0]).toBe(25);
  });

  it("parar() impede o fim", () => {
    const aoTerminar = vi.fn();
    const t = new Temporizador({ duracao: 25, aoTerminar });
    t.iniciar();
    vi.advanceTimersByTime(10_000);
    t.parar();
    expect(t.decorrido()).toBe(10);
    vi.advanceTimersByTime(30_000);
    expect(aoTerminar).not.toHaveBeenCalled();
  });

  it("usa o relógio: se a aba travar, o tempo restante continua certo", () => {
    let relogio = 1_000;
    const aoTerminar = vi.fn();
    const t = new Temporizador({ duracao: 25, aoTerminar, agora: () => relogio });
    t.iniciar();
    relogio += 30_000; // 30 s se passaram sem nenhum tique
    vi.advanceTimersByTime(100);
    expect(t.restante()).toBe(0);
    expect(t.decorrido()).toBe(25);
    expect(aoTerminar).toHaveBeenCalledTimes(1);
  });
});
