import { describe, expect, it } from "vitest";
import { enderecoDoSite, textoCompartilhamento } from "../src/game/share";

describe("textoCompartilhamento", () => {
  it("segue o formato da seção 7 (critério de aceite)", () => {
    const texto = textoCompartilhamento({
      modo: "diario",
      numeroDia: 42,
      pontosPorPergunta: [1, 3, 8, 0, 2, 0, 9],
      endereco: "abissal.exemplo.com",
    });
    // 1+3+8+0+2+0+9 = 23 pontos = 230 m (Zona da meia-noite)
    expect(texto).toBe(
      [
        "Abissal #42 🌊",
        "Mergulhei 230 m — Zona da meia-noite",
        "",
        "🟦🟦🟨🟥🟦🟥🟨",
        "1 · 3 · 8 · 0 · 2 · 0 · 9",
        "",
        "abissal.exemplo.com",
      ].join("\n"),
    );
  });

  it("usa as quatro cores da legenda", () => {
    const texto = textoCompartilhamento({ modo: "diario", numeroDia: 1, pontosPorPergunta: [0, 1, 3, 4, 6, 7, 10], endereco: "x" });
    expect(texto.split("\n")[3]).toBe("🟥🟦🟦🟪🟪🟨🟨");
    expect(texto.split("\n")[1]).toBe("Mergulhei 310 m — Zona da meia-noite");
  });

  it("mostra a zona certa nos extremos", () => {
    const fossa = textoCompartilhamento({ modo: "diario", numeroDia: 3, pontosPorPergunta: [10, 10, 10, 10, 10, 10, 10], endereco: "x" });
    expect(fossa.split("\n")[1]).toBe("Mergulhei 700 m — Fossa");
    const zero = textoCompartilhamento({ modo: "diario", numeroDia: 3, pontosPorPergunta: [0, 0, 0, 0, 0, 0, 0], endereco: "x" });
    expect(zero.split("\n")[1]).toBe("Mergulhei 0 m — Zona iluminada");
  });

  it("antes do lançamento, mostra prévia em vez de #0", () => {
    const texto = textoCompartilhamento({ modo: "diario", numeroDia: 0, pontosPorPergunta: [5], endereco: "x" });
    expect(texto.split("\n")[0]).toBe("Abissal · prévia 🌊");
  });

  it("no Ilimitado, não mostra número do dia", () => {
    const texto = textoCompartilhamento({ modo: "ilimitado", pontosPorPergunta: [5], endereco: "x" });
    expect(texto.split("\n")[0]).toBe("Abissal · ilimitado 🌊");
  });
});

describe("enderecoDoSite", () => {
  it("tira protocolo, hash, index.html e barra final", () => {
    expect(enderecoDoSite("https://abissal.exemplo.com/#fim")).toBe("abissal.exemplo.com");
    expect(enderecoDoSite("https://usuario.github.io/abissal/index.html#diario")).toBe("usuario.github.io/abissal");
    expect(enderecoDoSite("http://localhost:5173/")).toBe("localhost:5173");
  });
});
