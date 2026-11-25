# Studio CM

Site do Studio CM (estúdio de beleza) com agendamento integrado ao Google Calendar. Visão geral, arquitetura e como rodar estão no `README.md`.

## Estrutura

- `src/` front-end em React 19 + TypeScript + Vite + Tailwind CSS v4
  - `src/pages/` páginas (Home, Serviços, Galeria, Agendamento e as páginas da Carol e da Malu)
  - `src/components/` componentes compartilhados
  - `src/data/` conteúdo estático (serviços, fotos de trabalhos)
  - `src/assets/equipe/` e `src/assets/trabalhos/` imagens usadas no site
- `server/` API em Node.js + Express 5
  - `server/src/server.ts` rotas, disponibilidade, pré-reservas e rotina de expiração
  - `server/src/catalog.ts` serviços, durações e jornada de cada profissional
  - `server/src/protection.ts` rate limit e validação; testes em `protection.test.ts`
- `.figma/make/` configuração usada pelo `vite.config.ts` (o projeto começou no Figma Make); não remover sem ajustar o Vite

## Comandos

```bash
npm run dev              # front-end
npm run build            # build do front-end
cd server && npm run dev # API
cd server && npm test    # testes da API
```

O CI (`.github/workflows/ci.yml`) roda o build do front-end, `tsc --noEmit` e os testes da API.

## Convenções

- O Google Calendar de cada profissional é a fonte da verdade da agenda. Regras de disponibilidade ficam no servidor, nunca no navegador.
- Nunca versionar `.env`, chaves de conta de serviço ou dados de clientes.
- Imagens novas vão em `src/assets/`, com nomes descritivos em minúsculas e hífens. Elas são blobs normais no Git (sem LFS), porque a Vercel faz o build sem Git LFS.
- Textos de interface em português do Brasil.
