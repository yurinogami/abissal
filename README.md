# Abissal 🌊

Jogo de trivia diário em português do Brasil, com tema de mergulho no oceano profundo.
Todo dia, 7 perguntas abertas do tipo "Cite um ...". Quanto mais rara a resposta, mais fundo você vai: cada ponto vale 10 metros de profundidade.

## Como rodar

```bash
npm install     # instala as dependências
npm run dev     # servidor de desenvolvimento
npm test        # roda os testes (Vitest)
npm run build   # gera a versão de produção em dist/
```

## Publicação

O site é estático e publicado no Cloudflare Pages a cada merge na `main`
(comando de build `npm run build`, pasta de saída `dist`).

## Perguntas

O banco fica em `src/data/perguntas.json`. Depois do lançamento:

- **Pergunta nova:** coloque `"desde": "AAAA-MM-DD"` com uma data **futura**. Assim ela só entra no sorteio a partir desse dia e nenhum Diário já jogado (nem o de hoje) muda.
- **Tirar uma pergunta:** não apague; coloque `"ate": "AAAA-MM-DD"` com o último dia em que ela pode cair.
- Não mude o `id` de perguntas existentes.
