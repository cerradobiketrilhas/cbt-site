# SECURITY BASELINE - 2026-05

Estado de segurança de referência para produção do projeto `cbt-site`.

## 1) Transporte e Headers

- HTTPS obrigatório com redirecionamento HTTP -> HTTPS.
- HSTS: `max-age=63072000; includeSubDomains; preload`.
- `X-Frame-Options: DENY`.
- `X-Content-Type-Options: nosniff`.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- CSP estrita sem `unsafe-inline`, com scripts externos permitidos apenas de origens explícitas.

Arquivos de referência:
- `vercel.json`
- `.htaccess`
- `nginx.conf`

## 2) Frontend e CSP

- Sem scripts inline (`<script>...</script>`) nos HTMLs públicos.
- Sem handlers inline (`onclick=`, etc.).
- Bootstrap seguro centralizado em `script-security-bootstrap.js`.
- Scripts de página carregados por `src` + `defer`.

Arquivos de referência:
- `index.html`
- `inscricao.html`
- `confirmacao.html`
- `doacoes.html`
- `ajudar.html`
- `contato.html`
- `localizacao.html`
- `sobre.html`
- `transparencia.html`
- `script-security-bootstrap.js`

## 3) APIs Serverless

- CORS com allowlist (sem `*` aberto para produção).
- Rate limiting por IP nas rotas públicas/sensíveis.
- Mensagens de erro sanitizadas (sem stack trace para cliente).
- Sem fallback para token secreto hardcoded.

Arquivos de referência:
- `api/_lib/security.js`
- `api/create-preference.js`
- `api/confirm-inscription.js`
- `api/list-inscriptions.js`

## 4) Secrets e Ambiente

- Segredos apenas em variáveis de ambiente (Vercel/`.env.local`).
- `.env` e variantes locais ignorados no git.
- Tokens `TEST-*` não devem estar hardcoded no código de produção.

Arquivos de referência:
- `.gitignore`
- `.env.example`
- `INSCRIPTION_SETUP.md`

## 5) Dependências

- Executar auditoria periódica: `npm audit`.
- Priorizar correções de severidade alta/crítica.
- Revisar advisories moderados com risco contextual.

Arquivo de referência:
- `package.json`

## 6) Checklist rápido pré-deploy

- [ ] HTTPS ativo e redirecionando HTTP.
- [ ] Headers validados em [securityheaders.com](https://securityheaders.com).
- [ ] CSP ativa sem inline.
- [ ] Sem segredos hardcoded no repositório.
- [ ] `npm audit` sem vulnerabilidades altas/críticas.
- [ ] APIs respondendo com CORS restritivo e rate limiting.

## 7) Fonte de verdade

Se houver divergência entre documentos históricos e estado atual, este arquivo deve prevalecer.
