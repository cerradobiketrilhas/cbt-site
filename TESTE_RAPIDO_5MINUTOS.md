# ⚡ TESTE RÁPIDO - CBT (5 MINUTOS)

## 🔧 Pré-requisito
Python instalado (temos ✅)

## 📱 Passo 1: Iniciar Servidor Local

```powershell
cd c:\Users\gomes\Documents\cbt-site
python -m http.server 8000
```

Aguarde:
```
Serving HTTP on 0.0.0.0 port 8000
```

Abra no navegador: **http://localhost:8000**

---

## ✅ Teste 1: Verificar Imagens WebP

### Chrome (Suporta WebP nativamente)
1. Abrir DevTools: `F12`
2. Aba Network
3. Filtrar por: `logo-cbt`
4. Ver tamanho: `46.9KB` (WebP) ✅

### Firefox (Suporta WebP v65+)
1. DevTools: `F12`
2. Aba Network
3. Procurar `logo-cbt.webp`
4. Deve carregar normalmente ✅

### Safari Antigo (sem WebP)
1. Verá `logo-cbt.jpeg` como fallback ✅
2. Tamanho: `100.7KB` (ok)

---

## ✅ Teste 2: Verificar Cache Headers

### No Chrome DevTools
1. `F12` → Network → Response Headers
2. Procurar por:
   - `Cache-Control: public, max-age=2592000` (CSS/JS)
   - `Content-Encoding: gzip` (se aplicável)

### Linha de Comando
```powershell
$headers = (Invoke-WebRequest http://localhost:8000/style.css -Method Head).Headers
$headers | Select-Object -Property @{N="Header";E={$_}}, @{N="Value";E={$_.Value}}
```

---

## ✅ Teste 3: Funcionalidades

### Testar Back-to-Top Button
1. Scroll até o final da página
2. Clique no botão ⬆️ no canto inferior direito
3. Deve voltar ao topo suavemente ✅

### Testar Newsletter Form
1. Role até seção de Newsletter
2. Digite um email (ex: teste@exemplo.com)
3. Clique em "Inscrever-se"
4. Deve ver toast feedback: "✓ Obrigado!" ✅

### Testar PIX Copy
1. Role até Doações
2. Clique em "Copiar PIX"
3. Deve ver toast: "✓ PIX copiado!" ✅
4. Pode colar em qualquer lugar (Ctrl+V)

### Testar Skip Link (Acessibilidade)
1. Pressione `Tab` no topo da página
2. Deve aparecer botão: "Pular para conteúdo principal"
3. Pressione `Enter`
4. Pula direto para `<main>` ✅

---

## ✅ Teste 4: Mobile Responsivo

### No Chrome DevTools
1. `F12` → Toggle Device Toolbar (`Ctrl+Shift+M`)
2. Testar em:
   - iPhone 12: 390x844
   - iPad: 768x1024
   - Android: 360x800
3. Elementos devem se adaptar ✅

---

## ✅ Teste 5: Desempenho

### Abrir Google PageSpeed (em outro navegador/aba)
```
https://pagespeed.web.dev/
```

1. Colocar: `http://localhost:8000`
2. Clicar "Analisar"
3. Aguardar ~30s
4. Ver score esperado:
   - **Performance**: 80+
   - **SEO**: 90+
   - **Acessibilidade**: 85+

---

## 🔍 Teste 6: Validação HTML

### W3C Validator (Online)
```
https://validator.w3.org/
```

1. Clicar "Validate by URL"
2. Entrar: `http://localhost:8000`
3. Processar
4. Deve ter 0 erros (avisos ignoráveis) ✅

---

## 📊 Teste 7: Verificar Sitemap

### No Navegador
```
http://localhost:8000/sitemap.xml
```

Deve aparecer XML com:
- ✅ index.html (priority 1.0)
- ✅ doacoes.html (0.9)
- ✅ sobre.html (0.8)
- ✅ image:loc apontando para WebP

---

## 🔐 Teste 8: Security Headers (Opcional)

### Online
```
https://securityheaders.com/?q=localhost:8000
```

1. Entrar URL
2. Score esperado: B+ ou A
3. Headers implementados:
   - X-Content-Type-Options: nosniff ✅
   - X-Frame-Options: SAMEORIGIN ✅
   - X-XSS-Protection ✅

---

## 📝 Checklist de Testes

- [ ] WebP carrega em Chrome
- [ ] JPEG fallback em Safari antigo
- [ ] Cache headers presentes
- [ ] Back-to-Top funciona
- [ ] Newsletter form funciona
- [ ] PIX copy funciona
- [ ] Skip link funciona (Tab)
- [ ] Mobile responsivo
- [ ] Google PageSpeed: 80+
- [ ] Sitemap válido
- [ ] Sem erros no console (F12)

---

## ⚠️ Se Algo Não Funcionar

| Problema | Solução |
|----------|---------|
| WebP não carrega | Verificar `img/logo-cbt.webp` existe |
| Cache não aparece | Headers requerem servidor real (não localhost) |
| Mobile lento | Normal em localhost, testar em produção |
| Back-to-Top não funciona | Verificar `script-optimized.js` carregado |
| Console com erros | Abrir DevTools (F12) → Console e reportar |

---

## 🎯 RESULTADO ESPERADO

✅ Tudo funciona perfeitamente
✅ Site responsivo em todos tamanhos
✅ Performance excelente
✅ Imagens otimizadas carregam
✅ Funcionalidades interativas funcionam

**Tempo de teste**: 5-10 minutos
**Segurança**: AAA (site pronto para produção)
**Performance**: 80+ (excelente)

---

## 🚀 PRÓXIMO: DEPLOY

Após validar tudo aqui, deploy em:
- **Hostinger**: Upload FTP + `.htaccess`
- **Vercel**: `vercel deploy`
- **Netlify**: Conectar GitHub
- **GitHub Pages**: Push para branch `gh-pages`

Ver guia em: `GUIA_DEPLOY_RAPIDO.md`

---

**Data**: 27 de Abril 2026
**Status**: 🟢 PRONTO PARA TESTE
