import { describe, expect, it } from "vitest";
import { BANCO } from "../src/data/banco";
import { checarResposta, levenshtein, normalizar, toleranciaPara } from "../src/game/validate";

const pergunta = (id: string) => {
  const q = BANCO.find((p) => p.id === id);
  if (!q) throw new Error(`pergunta ${id} não encontrada`);
  return q;
};

/** Devolve o texto da resposta aceita, ou null se a tentativa não foi aceita. */
const aceita = (id: string, tentativa: string) => {
  const res = checarResposta(pergunta(id), tentativa);
  return res.tipo === "acerto" ? res.resposta.r : null;
};

describe("normalizar", () => {
  it("passa para minúsculas e remove acentos", () => {
    expect(normalizar("SÃO PAULO")).toBe("sao paulo");
    expect(normalizar("Maçã")).toBe("maca");
    expect(normalizar("Reykjavík")).toBe("reykjavik");
  });

  it("troca hífens e pontuação por espaço e junta espaços", () => {
    expect(normalizar("Leão-marinho")).toBe("leao marinho");
    expect(normalizar("  Rio   Grande,  do Sul! ")).toBe("rio grande do sul");
    expect(normalizar("Atlético-MG")).toBe("atletico mg");
  });

  it("remove artigos iniciais", () => {
    expect(normalizar("O Fêmur")).toBe("femur");
    expect(normalizar("a Bahia")).toBe("bahia");
    expect(normalizar("os Andes")).toBe("andes");
    expect(normalizar("as Guianas")).toBe("guianas");
    expect(normalizar("um violão")).toBe("violao");
    expect(normalizar("uma maçã")).toBe("maca");
  });

  it("não remove artigo quando a palavra é só a letra", () => {
    expect(normalizar("O")).toBe("o");
    expect(normalizar("Amapá")).toBe("amapa");
    expect(normalizar("Ossos")).toBe("ossos");
  });

  it("diferencia C, C++ e C#", () => {
    expect(normalizar("C")).toBe("c");
    expect(normalizar("C++")).toBe("c plus plus");
    expect(normalizar("C#")).toBe("c sharp");
  });

  it("devolve vazio para texto sem letras", () => {
    expect(normalizar("   ")).toBe("");
    expect(normalizar("?!")).toBe("");
  });
});

describe("levenshtein", () => {
  it("é zero para textos iguais", () => {
    expect(levenshtein("netuno", "netuno")).toBe(0);
  });

  it("conta inserções, remoções e trocas", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
    expect(levenshtein("paulo", "paolo")).toBe(1);
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("flaw", "lawn")).toBe(2);
  });

  it("é simétrica", () => {
    expect(levenshtein("cachalote", "caxalote")).toBe(levenshtein("caxalote", "cachalote"));
  });
});

describe("toleranciaPara", () => {
  it("segue as faixas de tamanho", () => {
    expect(toleranciaPara("peru")).toBe(0);
    expect(toleranciaPara("marte")).toBe(1);
    expect(toleranciaPara("sao paulo")).toBe(1); // 8 letras, espaço não conta
    expect(toleranciaPara("jequitinhonha")).toBe(2);
  });
});

describe("checarResposta", () => {
  it("aceita as variações de São Paulo e rejeita o Distrito Federal (critério de aceite)", () => {
    expect(aceita("estados", "são paulo")).toBe("São Paulo");
    expect(aceita("estados", "Sao Paulo")).toBe("São Paulo");
    expect(aceita("estados", "SP")).toBe("São Paulo");
    expect(aceita("estados", "sao paolo")).toBe("São Paulo");
    expect(aceita("estados", "Distrito Federal")).toBeNull();
    expect(aceita("estados", "DF")).toBeNull();
  });

  it("dá fala especial para o DF e para HTML/CSS", () => {
    expect(checarResposta(pergunta("estados"), "distrito federal")).toMatchObject({ tipo: "erro", mensagem: expect.any(String) });
    expect(checarResposta(pergunta("linguagens-programacao"), "HTML")).toMatchObject({ tipo: "erro", mensagem: expect.any(String) });
    expect(checarResposta(pergunta("linguagens-programacao"), "css")).toMatchObject({ tipo: "erro", mensagem: expect.any(String) });
  });

  it("marca se o acerto foi exato ou com tolerância", () => {
    expect(checarResposta(pergunta("planetas"), "Netuno")).toMatchObject({ tipo: "acerto", exato: true });
    expect(checarResposta(pergunta("planetas"), "Netunno")).toMatchObject({ tipo: "acerto", exato: false });
  });

  it("aceita aliases", () => {
    expect(aceita("planetas", "neptuno")).toBe("Netuno");
    expect(aceita("ossos", "perônio")).toBe("Fíbula");
    expect(aceita("campeoes-brasileirao", "galo")).toBe("Atlético-MG");
    expect(aceita("cores-arco-iris", "índigo")).toBe("Anil");
  });

  it("não aplica tolerância abaixo de 5 letras", () => {
    expect(aceita("paises-america-do-sul", "Peru")).toBe("Peru");
    expect(aceita("paises-america-do-sul", "Perl")).toBeNull();
    expect(aceita("linguagens-programacao", "Perl")).toBe("Perl");
    expect(aceita("linguagens-programacao", "Peru")).toBeNull();
    expect(aceita("planetas", "Marre")).toBe("Marte"); // 5 letras: tolera 1
  });

  it("tolera 1 erro de 5 a 8 letras e 2 erros com 9 ou mais", () => {
    expect(aceita("planetas", "Saturmo")).toBe("Saturno");
    expect(aceita("planetas", "Satrmu")).toBeNull(); // 2 erros em 7 letras
    expect(aceita("rios-brasileiros", "Jequitinonha")).toBe("Jequitinhonha");
    expect(aceita("rios-brasileiros", "Jequtinonha")).toBe("Jequitinhonha"); // 2 erros
    expect(aceita("rios-brasileiros", "Jekitinoa")).toBeNull();
  });

  it("considera erro quando duas respostas empatam na tolerância", () => {
    // "violap" está a 1 de "viola" e a 1 de "violao".
    expect(aceita("instrumentos-corda", "violap")).toBeNull();
    expect(aceita("instrumentos-corda", "viola")).toBe("Viola");
    expect(aceita("instrumentos-corda", "violao")).toBe("Violão");
  });

  it("diferencia C, C++ e C#", () => {
    expect(aceita("linguagens-programacao", "C")).toBe("C");
    expect(aceita("linguagens-programacao", "c++")).toBe("C++");
    expect(aceita("linguagens-programacao", "C#")).toBe("C#");
    expect(aceita("linguagens-programacao", "csharp")).toBe("C#");
  });

  it("aceita símbolos de uma letra só de forma exata", () => {
    expect(aceita("elementos-uma-letra", "O")).toBe("Oxigênio");
    expect(aceita("elementos-uma-letra", "W")).toBe("Tungstênio");
    expect(aceita("elementos-uma-letra", "X")).toBeNull();
  });

  it("aceita qualquer 'baleia ...' como Baleia", () => {
    expect(aceita("mamiferos-marinhos", "baleia azul")).toBe("Baleia");
    expect(aceita("mamiferos-marinhos", "Baleia-jubarte")).toBe("Baleia");
    expect(aceita("mamiferos-marinhos", "jubarte")).toBe("Baleia");
    expect(aceita("mamiferos-marinhos", "Orca")).toBe("Orca");
  });

  it("aceita rios com ou sem a palavra 'rio'", () => {
    expect(aceita("rios-brasileiros", "Xingu")).toBe("Xingu");
    expect(aceita("rios-brasileiros", "rio Xingu")).toBe("Xingu");
    expect(aceita("rios-brasileiros", "o Rio São Francisco")).toBe("São Francisco");
    expect(aceita("rios-brasileiros", "rio negro")).toBe("Negro");
    expect(aceita("rios-brasileiros", "negro")).toBe("Negro");
  });

  it("devolve vazio para tentativa em branco", () => {
    expect(checarResposta(pergunta("planetas"), "   ")).toEqual({ tipo: "vazio" });
  });
});

describe("banco de perguntas", () => {
  it("tem ids únicos e pontos entre 1 e 10", () => {
    const ids = BANCO.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of BANCO) {
      expect(q.respostas.length).toBeGreaterThan(0);
      for (const r of q.respostas) {
        expect(Number.isInteger(r.p)).toBe(true);
        expect(r.p).toBeGreaterThanOrEqual(1);
        expect(r.p).toBeLessThanOrEqual(10);
      }
    }
  });

  it("aceita cada resposta e cada alias como a própria resposta (sem ambiguidades)", () => {
    for (const q of BANCO) {
      for (const r of q.respostas) {
        for (const forma of [r.r, ...(r.alias ?? [])]) {
          const res = checarResposta(q, forma);
          expect(res.tipo === "acerto" ? res.resposta.r : null, `${q.id}: "${forma}"`).toBe(r.r);
        }
      }
    }
  });

  it("usa datas válidas em `desde` e `ate`", () => {
    const data = /^\d{4}-\d{2}-\d{2}$/;
    for (const q of BANCO) {
      if (q.desde) expect(q.desde, q.id).toMatch(data);
      if (q.ate) expect(q.ate, q.id).toMatch(data);
      if (q.desde && q.ate) expect(q.desde <= q.ate, q.id).toBe(true);
    }
  });

  it("tem pelo menos 100 perguntas (meta da Fase 5)", () => {
    expect(BANCO.length).toBeGreaterThanOrEqual(100);
  });

  it("nunca aceita uma tentativa que tem fala especial do Lume", () => {
    for (const q of BANCO) {
      for (const [chave, mensagem] of Object.entries(q.mensagens ?? {})) {
        expect(checarResposta(q, chave), `${q.id}: "${chave}"`).toEqual({ tipo: "erro", mensagem });
      }
    }
  });

  it("não aceita erros parecidos com respostas certas", () => {
    expect(aceita("meses-31-dias", "Junho")).toBeNull();
    expect(aceita("meses-31-dias", "Julho")).toBe("Julho");
    expect(aceita("libertadores-brasileiros", "Atlético-PR")).toBeNull();
    expect(aceita("libertadores-brasileiros", "Atlético-GO")).toBeNull();
    expect(aceita("libertadores-brasileiros", "Atlético-MG")).toBe("Atlético-MG");
    expect(aceita("maiores-paises", "Áustria")).toBeNull();
    expect(aceita("continentes", "África do Sul")).toBeNull();
    expect(aceita("halogenios", "Cromo")).toBeNull();
    expect(aceita("elementos-letra-c", "Bromo")).toBeNull();
    expect(aceita("metais-alcalinos", "Cério")).toBeNull();
  });

  it("aceita símbolos químicos nas perguntas de família", () => {
    expect(aceita("metais-alcalinos", "Na")).toBe("Sódio");
    expect(aceita("elementos-letra-c", "Cu")).toBe("Cobre");
    expect(aceita("halogenios", "Cl")).toBe("Cloro");
  });

  it("entende perguntas com prefixo opcional", () => {
    expect(aceita("fases-lua", "lua cheia")).toBe("Cheia");
    expect(aceita("vitaminas", "vitamina C")).toBe("Vitamina C");
    expect(aceita("vitaminas", "C")).toBe("Vitamina C");
    expect(aceita("vitaminas", "B12")).toBe("Vitamina B12");
    expect(aceita("pixar", "Toy Story 3")).toBe("Toy Story");
  });
});
