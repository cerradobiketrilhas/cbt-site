# 🚀 GUIA RÁPIDO DE DEPLOY - CBT

> Baseline oficial de segurança: `SECURITY_BASELINE_2026-05.md` (fonte única de verdade).

## 1️⃣ TESTAR LOCALMENTE (5 min)

### Windows - Python SimpleHTTP
```powershell
cd c:\Users\gomes\Documents\cbt-site
python -m http.server 8000
```
Abra: `http://localhost:8000`

### Mac/Linux - Python
```bash
cd ~/cbt-site
python3 -m http.server 8000
```

---

## 2️⃣ DEPLOY NO HOSTING (15 min)

### Opção A: Hostinger / GoDaddy / Bluehost
1. Fazer upload via FTP:
   - Abra FileZilla ou similar
   - Conecte ao servidor FTP
   - Arraste todos os arquivos para `public_html/`

2. Ativar `.htaccess`:
   - Alguns hosts precisam ativar em painel de controle
   - cPanel → Segurança → ModSecurity: desativar `.htaccess`

### Opção B: Vercel (Recomendado - Grátis)
```bash
npm install -g vercel
cd c:\Users\gomes\Documents\cbt-site
vercel
# Seguir prompts
```

### Opção C: GitHub Pages + Netlify
1. GitHub Pages:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
```
2. Netlify:
   - Conecte seu GitHub repo
   - Deploy automático

---

## 3️⃣ PÓS-DEPLOY (15 min)

### Google Search Console
1. Ir para: https://search.google.com/search-console
2. Adicionar propriedade: `https://cerradobiketrilhas.com`
3. Verificar com arquivo HTML ou DNS
4. Submeter sitemap: `https://cerradobiketrilhas.com/sitemap.xml`
5. Testar robots.txt: `https://cerradobiketrilhas.com/robots.txt`

### Google Analytics (OPCIONAL)
1. Ir para: https://analytics.google.com/
2. Criar propriedade para o domínio
3. Copiar ID (ex: `G-XXXXXXXXXX`)
4. Substituir `G-XXXXXXXXXX` nos arquivos:
   - `script-security-bootstrap.js`
   - tags `<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX">` dos HTMLs

### Testar Performance
- Google PageSpeed: https://pagespeed.web.dev
- GTmetrix: https://gtmetrix.com
- WebPageTest: https://www.webpagetest.org

---

## 4️⃣ VALIDAÇÕES IMPORTANTES

### ✅ Checklist
- [ ] Site abre em HTTPS
- [ ] Imagem WebP carrega em Chrome/Firefox
- [ ] Imagem JPEG fallback em Safari antigo
- [ ] Logo aparece na aba do navegador
- [ ] Mobile responsivo (testar em iPhone/Android)
- [ ] Botão "Back to Top" funciona
- [ ] Formulário Newsletter funciona
- [ ] PIX copy feedback aparece ao clicar

### 🔒 Security
- [ ] Headers de segurança ativados (teste em: https://securityheaders.com)
- [ ] HTTPS ativado e redirecionando HTTP
- [ ] Certificado SSL válido
- [ ] CSP ativa sem `unsafe-inline`
- [ ] Nenhum `<script>` inline nas páginas HTML

---

## 5️⃣ MONITORAMENTO (Contínuo)

### Configurar Alertas
1. Google Search Console → Configurações → Alertas de segurança
2. Google Analytics → Alertas personalizados
3. Uptime Monitor: https://uptimerobot.com (grátis)

### Métrica de Sucesso (ideal)
- [ ] Performance Score: **85+** (Google PageSpeed)
- [ ] SEO Score: **90+**
- [ ] Acessibilidade: **85+**
- [ ] Best Practices: **80+**

---

## 📋 RESUMO - O QUE FOI ENTREGUE

✅ **8 Melhorias Implementadas:**
1. Google Analytics 4 (rastreamento)
2. JSON-LD Schema (rich snippets)
3. Sitemap XML (crawlabilidade)
4. Robots.txt (controle de bots)
5. Skip Links (acessibilidade)
6. Back-to-Top Button (UX)
7. Newsletter Form (captura de leads)
8. PIX Copy Feedback (acessibilidade)

✅ **Otimizações Finais:**
- WebP com fallback (-53.4% tamanho)
- Compressão GZIP + Cache headers
- Security headers (6 headers)
- Picture element (compatibilidade)
- Service Worker atualizado

---

## 🆘 SUPORTE RÁPIDO

| Problema | Solução |
|----------|---------|
| Site não carrega | Verificar arquivo `.htaccess` no host |
| Imagem não aparece | Converter novamente: `python converter.py` |
| Performance baixa | Ativar GZIP no host + aumentar cache |
| Analytics não rastreia | Verificar ID correto no `index.html` |
| Mobile lento | Compactar mais imagens ou usar lazy loading |

---

## 📞 PRÓXIMOS PASSOS

1. **Newsletter**: Conectar a SendGrid, Mailchimp ou similar
2. **Conversão**: Adicionar pixel do Facebook/Ads
3. **Blog**: Adicionar seção de notícias (novo sitemap)
4. **Mobile App**: Converter para PWA com `web-app-manifest.json`
5. **Automação**: Configurar CI/CD com GitHub Actions

---

**Data**: 27 de Abril 2026  
**Status**: 🟢 PRONTO PARA PRODUÇÃO  
**Versão**: 2.0 (Otimizado)

---

💡 **Dica**: Após deploy, aguarde 7 dias para Google indexar sitemap completamente.
