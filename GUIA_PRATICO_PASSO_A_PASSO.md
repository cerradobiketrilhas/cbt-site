# 📋 GUIA PRÁTICO PASSO-A-PASSO - CBT Site

**Documento para equipe: Como implementar melhorias imediatamente**

---

## 🎯 OBJETIVO

Transformar o site CBT de **bom** para **excelente** em 4 semanas seguindo este roteiro prático.

---

## 📅 CRONOGRAMA

### 🟢 SEMANA 1: Foundation & SEO (4-5 horas)

#### DIA 1: Setup (1.5 horas)

**Tarefa 1: Verificar otimizações aplicadas** (30 min)
```bash
# Testar Service Worker
1. Abrir site em Chrome/Firefox
2. Pressionar F12 (DevTools)
3. Ir em Application/Storage > Service Workers
4. Verificar: sw.js deve estar "activated"
5. Se não estiver, fazer Ctrl+Shift+R (hard refresh)
```

**Tarefa 2: Google Analytics Setup** (1 hora)
<details>
<summary><b>Clique para expandir instruções</b></summary>

1. **Criar conta Google Analytics**
   - Ir em https://analytics.google.com/
   - Clique "Start measuring"
   - Criar novo property "CBT Site"
   - Selecionar "Web"
   - URL: `https://cerradobiketrilhas.com`
   - Timezone: `America/Sao_Paulo`
   - Aceitar termos

2. **Obter ID Google Analytics**
   - Após criação, você verá: `G-XXXXXXXXXX`
   - **COPIAR** este ID (vai usar em todos HTML)

3. **Implementar em TODAS as páginas**
   - Arquivos: `index.html`, `sobre.html`, `localizacao.html`, `doacoes.html`, `ajudar.html`, `transparencia.html`, `contato.html`
   - Para CADA arquivo:
     1. Abrir em editor de código
     2. Encontrar `</head>` (fim da seção head)
     3. ANTES de `</head>`, adicionar código de Analytics (do arquivo IMPLEMENTACOES_PRONTAS.md)
     4. Substituir `G-XXXXXXXXXX` pelo seu ID
     5. Salvar arquivo

4. **Verificar funcionamento**
   - Abrir DevTools > Network tab
   - Procurar por `google-analytics`
   - Deve ter requisição com status 200
   - Em Analytics, você verá usuários em tempo real

**Tempo total:** 1 hora

</details>

---

#### DIA 2: Schema Markup (2 horas)

**Tarefa 3: Implementar JSON-LD** (1.5 horas)

1. **Adicionar Schema Organization**
   - Abrir `index.html` em editor
   - Encontrar `</head>`
   - ANTES de `</head>`, adicionar código JSON-LD (arquivo IMPLEMENTACOES_PRONTAS.md > seção 2)
   - Testar em https://schema.org/validator
   
2. **Adicionar Schema em doacoes.html**
   - Mesmas instruções, mas usar código LocalBusiness
   - Validar depois

3. **Submeter em Google Search Console**
   - Ir em https://search.google.com/search-console
   - Adicionar property: `https://cerradobiketrilhas.com`
   - Verificar domain (via DNS ou arquivo HTML)
   - Após verificado, submeter sitemap.xml (próxima tarefa)

**Tempo total:** 1.5 horas

---

#### DIA 3: Sitemap & Robots (1-1.5 horas)

**Tarefa 4: Criar sitemap.xml**

1. **Criar arquivo `sitemap.xml`**
   - Local: raiz do site (mesma pasta de index.html)
   - Conteúdo: Copiar do arquivo IMPLEMENTACOES_PRONTAS.md > seção 3
   - Ajustar datas para hoje (data atual)
   - Salvar

2. **Criar arquivo `robots.txt`**
   - Local: raiz do site
   - Conteúdo: Copiar do arquivo IMPLEMENTACOES_PRONTAS.md > seção 4
   - Salvar

3. **Validar arquivos**
   - Abrir browser
   - Ir em `https://cerradobiketrilhas.com/sitemap.xml`
   - Deve aparecer arquivo XML (não erro 404)
   - Ir em `https://cerradobiketrilhas.com/robots.txt`
   - Deve aparecer texto

4. **Submeter en Google Search Console**
   - Search Console > Sitemaps
   - Clicar "Add new sitemap"
   - Digitar: `sitemap.xml`
   - Submeter

**Tempo total:** 1-1.5 horas

---

### 📋 Checklist Semana 1
- [ ] Service Worker testado (offline funciona?)
- [ ] Google Analytics implementado em TODAS as páginas
- [ ]GA está registrando usuários (verificar em real-time)
- [ ] JSON-LD Schema adicionado (index.html + doacoes.html)
- [ ] sitemap.xml criado e testado
- [ ] robots.txt criado
- [ ] Sitemap submetido em Google Search Console
- [ ] Todo código commitado no Git

---

### 🟡 SEMANA 2: Performance & Images (4-5 horas)

#### DIA 1: Image Optimization (2-2.5 horas)

**Tarefa 5: Converter imagens para WebP**

1. **Listar imagens do site**
   ```
   Pasta: /img/
   ├─ logo-cbt.jpeg (usar em picture element)
   ├─ bg-lines.svg (deixar como está)
   └─ hero-bg.jpg (opcional, se existir)
   ```

2. **Converter para WebP**
   - Opção A (Online): Ir em https://squoosh.app
     1. Upload imagem JPEG
     2. Ajustar quality para 80
     3. Download WebP
     4. Salvar na pasta /img
   - Opção B (Cmd): Se tiver ImageMagick instalado
     ```bash
     convert img/logo-cbt.jpeg -quality 80 img/logo-cbt.webp
     ```

3. **Implementar no HTML**
   - Em TODAS as páginas, encontrar:
     ```html
     <img src="img/logo-cbt.jpeg" alt="Cerrado Bike Trilhas">
     ```
   - Substituir por:
     ```html
     <picture>
       <source srcset="img/logo-cbt.webp" type="image/webp">
       <img src="img/logo-cbt.jpeg" alt="Cerrado Bike Trilhas">
     </picture>
     ```
   - Adicionar `loading="lazy"` se imagens atuais usarem

**Tempo:** 2-2.5 horas

---

#### DIA 2: Acessibilidade (2 horas)

**Tarefa 6: Implementar Skip Links**

1. **Adicionar Skip Link em HTML**
   - Em TODAS as páginas:
   - Encontrar `<body>`
   - Logo após `<body>`, ANTES de `<div id="loader">`:
     ```html
     <a href="#main-content" class="skip-link">Pular para conteúdo principal</a>
     ```

2. **Adicionar ID em main content**
   - Encontrar `<main>`
   - Adicionar: `<main id="main-content">`

3. **Adicionar CSS para Skip Link**
   - Abrir `style.css`
   - Ir até o final
   - Adicionar código CSS do arquivo IMPLEMENTACOES_PRONTAS.md > seção 5
   - Testar: Abrir site, pressionar Tab, deve aparecer "Pular" no topo

**Tempo:** 1-1.5 horas

---

**Tarefa 7: Back-to-Top Button** (30-45 min)

1. **Adicionar HTML**
   - Em TODAS as páginas
   - Encontrar `</body>` (fim do arquivo)
   - ANTES de `</body>`, adicionar HTML do IMPLEMENTACOES_PRONTAS.md > seção 6

2. **Adicionar CSS**
   - Abrir `style.css`
   - Adicionar código CSS (seção 6)

3. **Adicionar JavaScript**
   - Abrir `script-optimized.js` ou `script.js`
   - Ir até o final
   - Adicionar código JS (seção 6)

4. **Testar**
   - Abrir site
   - Scroll para baixo
   - Botão verde deve aparecer no canto inferior direito
   - Clicar botão: deve scrollar para topo suavemente

**Tempo:** 30-45 min

---

### 📋 Checklist Semana 2
- [ ] Imagens convertidas para WebP
- [ ] `<picture>` elements implementados
- [ ] Skip Links adicionados e testados
- [ ] Back-to-Top button implementado
- [ ] Lighthouse score verificado (deve subir)
- [ ] Tudo commitado no Git

---

### 🟠 SEMANA 3: UX & Forms (3-4 horas)

#### DIA 1: Newsletter Form (2-2.5 horas)

**Tarefa 8: Implementar Newsletter Form**

1. **Adicionar HTML em index.html**
   - Encontrar seção de herói ou final do document
   - Adicionar código HTML do IMPLEMENTACOES_PRONTAS.md > seção 9
   - Pode ser logo após seção hero ou antes do footer

2. **Adicionar CSS**
   - Abrir `style.css`
   - Adicionar código CSS (seção 9)

3. **Adicionar JavaScript**
   - Abrir `script-optimized.js`
   - Adicionar código JS (seção 9)
   - NOTA: Por enquanto vai simular sucesso (sem backend)

4. **Testar**
   - Abrir index.html
   - Procurar "Fique atualizado"
   - Digitar email
   - Clicar "Inscrever-se"
   - Deve mostrar "Obrigado!"

5. **Para produção (depois)**
   - Criar backend endpoint: `/api/newsletter/subscribe`
   - Integrar com Mailchimp ou SendGrid
   - Armazenar emails em database

**Tempo:** 2-2.5 horas

---

#### DIA 2: Copy Feedback (1-1.5 horas)

**Tarefa 9: Melhorar feedback de Copy PIX**

1. **Em doacoes.html**
   - Encontrar botão "Copiar PIX"
   - Logo após `</button>`, adicionar HTML:
     ```html
     <div 
       id="copy-feedback" 
       class="copy-feedback" 
       role="status" 
       aria-live="polite" 
       aria-atomic="true">
     </div>
     ```

2. **Adicionar CSS em style.css**
   - Copiar código CSS (seção 7 de IMPLEMENTACOES_PRONTAS.md)

3. **Adicionar JavaScript**
   - Encontrar event listener do botão de copiar em script.js
   - Substituir por código melhorado (seção 7)
   - Testar: Click "Copiar" > deveria aparecer toast "✅ PIX copiado!"

**Tempo:** 1-1.5 horas

---

### 📋 Checklist Semana 3
- [ ] Newsletter form implementado e testado
- [ ] Copy feedback com toast message
- [ ] Form accessibility verificada
- [ ] Mobile responsiveness testado
- [ ] Tudo commitado

---

### 🔵 SEMANA 4: Testing & Deployment (3-4 horas)

#### DIA 1-2: Testing & Audit (2 horas)

**Tarefa 10: Lighthouse Audit**

1. **Executar Lighthouse**
   - DevTools (F12) > Lighthouse
   - Clicar "Generate report"
   - Esperar análise completar

2. **Verificar scores**
   ```
   Performance:     85+ ✅
   Accessibility:   92+ ✅
   Best Practices:  90+ ✅
   SEO:             90+ ✅
   ```

3. **Se scores < acima:**
   - Ler recomendações do Lighthouse
   - Implementar sugestões rápidas
   - Não precisa ser 100%

**Tarefa 11: PageSpeed Insights**

1. **Submeter site**
   - Ir em https://pagespeed.web.dev/
   - Digitar URL do site
   - Deixar analisar (2-3 minutos)

2. **Verificar scores**
   ```
   Performance Mobile:   75+ ✅
   Performance Desktop:  90+ ✅
   SEO:                  90+ ✅
   ```

**Tarefa 12: Manual Testing**

```
Verificar cada recurso:
- [ ] Menu mobile funciona (hamburger)
- [ ] Newsletter form valida email
- [ ] PIX copy funciona e mostra feedback
- [ ] Skip link funciona (Tab no inicio)
- [ ] Back-to-top aparece ao scroll
- [ ] Dark mode respeta preferência sistema
- [ ] Offline mode funciona (F12 > Offline)
- [ ] QR Code aparece em doacoes
- [ ] Links internos funcionam
- [ ] Botões têm hover states
- [ ] Tipografia legível em mobile
- [ ] Sem console errors (F12 > Console)
```

**Tempo:** 2 horas total

---

#### DIA 3-4: Deploy (1-2 horas)

**Tarefa 13: Preparar para Produção**

1. **Git commits finais**
   ```bash
   git add .
   git commit -m "feat: add analytics, schema, newsletter, a11y"
   git push origin main
   ```

2. **Build/Minify (se aplicável)**
   - Se usar Webpack: `npm run build`
   - Gerar versão minificada para produção

3. **Deploy em Hosting**
   - Fazer upload de arquivos otimizados
   - Testar em produção (URL real)
   - Verificar se meta tags aparecem corretamente

4. **Configurar Monitoring**
   - Google Search Console: aceitar sitemap
   - Google Analytics: verificar eventos
   - Uptime monitoring: alertas se site cair

**Tempo:** 1-2 horas

---

### 📋 Checklist Semana 4 & Final
- [ ] Lighthouse scores verificados
- [ ] PageSpeed Insights OK
- [ ] Manual testing completado
- [ ] Git commitado
- [ ] Deployed em produção
- [ ] Analytics mostrando dados reais
- [ ] Search Console indexando páginas
- [ ] Monitoramento ativo

---

## 📊 MÉTRICAS DE SUCESSO

### Esperado após 4 semanas:

```
MÉTRICA                 ANTES    DEPOIS   META     STATUS
─────────────────────────────────────────────────────
LCP                     2.8s     1.9s     <2.5s    ✅
FID                     80ms     20ms     <100ms   ✅
CLS                     0.15     0.08     <0.1     ✅
Performance Score       75       88       85+      ✅
SEO Score               72       90       90+      ✅
Accessibility Score     85       92       92+      ✅
Emails Capturados       0        50+      50+      ✅
Google Index            0        7 URLs   7        ✅
ConversaoTaxa Doação    ?        ?        +15%     ?
```

---

## 🎓 APRENDIZADOS ESPERADOS

### O que a equipe vai aprender:

1. **Performance Optimization**
   - Service Workers e offline support
   - Image optimization (WebP)
   - Debounce/Throttle patterns

2. **SEO Técnico**
   - Meta tags e Open Graph
   - JSON-LD Schema Markup
   - Sitemap e robots.txt

3. **Acessibilidade Web**
   - ARIA attributes
   - Keyboard navigation
   - Color contrast

4. **Integração de Analytics**
   - Google Analytics 4
   - Event tracking
   - Conversão monitoring

5. **Mobile UX**
   - Responsive design
   - Touch-friendly interfaces
   - Focus management

---

## 🆘 TROUBLESHOOTING COMUM

### Problema: Service Worker não aparece em DevTools
**Solução:**
```
DevTools > Application > Clear storage > Clear all
Recarregar página (Ctrl+R)
Verificar novamente
```

### Problema: Analytics não mostrando usuários
**Solução:**
- Verificar se GA ID está correto (G-XXXXXXXXXX)
- Verificar se Analytics.js está carregando (Network tab)
- Pode levar 24h para aparecer dados

### Problema: Imagem WebP não carregando
**Solução:**
```html
<!-- Garantir tanto source quanto fallback -->
<picture>
  <source srcset="img/file.webp" type="image/webp">
  <img src="img/file.jpg" alt="Descrição">
</picture>
```

### Problema: Newsletter form não funciona
**Solução:**
- Verificar se ID `#newsletter-form` existe
- Verificar console (F12) para erros JavaScript
- Testar em incognito (sem cache)

### Problema: Skip link não funciona
**Solução:**
- Garantir que `#main-content` existe em HTML
- Verificar CSS (skip-link position absolute)
- Testar com Tab em navegador

---

## 📞 CONTATOS & SUPORTE

**Se ficar preso em alguma tarefa:**

1. **Verificar console (F12 > Console)**
   - Procurar por red errors (🔴)
   - Ler mensagem de erro

2. **Listar arquivos que editar**
   - Verificar se foram salvos
   - Fazer refresh (Ctrl+Shift+R)

3. **Testar isoladamente**
   - Parar, editar 1 coisa
   - Testar
   - Depois próxima coisa

---

## 🎉 RESULTADO FINAL

Após seguir este guia, você terá:

✅ **Site pronto para produção**
✅ **Otimizado para SEO**
✅ **Rápido no mobile**
✅ **Acessível para todos**
✅ **Analytics implementado**
✅ **Data para tomar decisões**
✅ **Capacidade de evoluir**

**Investimento:** 15-20 horas de trabalho
**Retorno:** Meses de otimização faltando

---

## 📝 TEMPLATE DE LOG

Salvar em arquivo `.log` ou planilha:

```
DATA      | TAREFA                    | TEMPO  | STATUS | NOTAS
──────────┼──────────────────────────┼────────┼────────┼──────────
2026-04-27| Analytics GA4 Setup      | 1h     | ✅     | ID: G-XXX
2026-04-28| JSON-LD Schema Markup    | 45min  | ✅     | Validado
2026-04-29| Sitemap XML              | 20min  | ✅     | Submetido
...
```

---

**Este guia é vivo. Ajuste conforme necessário.**

**Primeira revisão:** Após Semana 2  
**Segunda revisão:** Após Semana 4  
**Próximo ciclo:** 30 dias depois

---

**Bom trabalho! 💪**
