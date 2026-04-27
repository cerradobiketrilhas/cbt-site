# 🖼️ Guia de Otimização WebP - CBT Site

**Data:** 27 de Abril de 2026  
**Status:** Pronto para implementação  
**Impacto esperado:** -50-60% tamanho de imagens (performance +15%)

---

## 📋 Passo-a-Passo para Otimizar Imagens

### 1. Converter Imagens JPEG/PNG → WebP

#### Opção A: Usando Squoosh (Online - Recomendado para iniciantes)
1. Abra: https://squoosh.app/
2. Clique em "Select Image"
3. Escolha a imagem (ex: logo-cbt.jpeg)
4. Na aba direita, selecione "WebP" como formato
5. Ajuste quality para 80
6. Clique em "Download"
7. Salve em `/img/` com mesmo nome, mudando extensão

#### Opção B: Usando ImageMagick (Terminal - Para automação)
```bash
# Se não tiver instalado
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: sudo apt-get install imagemagick

# Converter uma imagem
convert img/logo-cbt.jpeg -quality 80 img/logo-cbt.webp

# Converter todas em uma pasta
for file in img/*.{jpg,jpeg,png}; do
  convert "$file" -quality 80 "${file%.*}.webp"
done
```

#### Opção C: Usando Online-Convert
1. Vá em: https://image.online-convert.com/convert-to-webp
2. Upload da imagem
3. Quality: 80
4. Converter e download

---

## 🎯 Imagens a Converter

### Prioridade ALTA (Hero/Logo)
- `img/logo-cbt.jpeg` → `img/logo-cbt.webp` (~35KB → ~12KB)
- `img/hero.mp4` (vídeo - usar compressor de vídeo)

### Prioridade MÉDIA (Background)
- `img/bg-lines.svg` → Deixar igual (SVGs já são pequenos)

---

## 💻 HTML a Modificar

### Converter logo em index.html

**ANTES:**
```html
<img src="img/logo-cbt.jpeg" alt="Cerrado Bike Trilhas">
```

**DEPOIS:**
```html
<picture>
  <source srcset="img/logo-cbt.webp" type="image/webp">
  <source srcset="img/logo-cbt.jpeg" type="image/jpeg">
  <img src="img/logo-cbt.jpeg" alt="Cerrado Bike Trilhas" loading="lazy">
</picture>
```

### Onde está o logo? (no arquivo index.html)

Procure pelas ocorrências e substitua:

1. **Na navbar/header** (linha ~48)
   - `<img src="img/logo-cbt.jpeg" alt="Cerrado Bike Trilhas">`
   - Está dentro de `.logo`

2. **Na seção Open Graph** (meta tag no <head>)
   - `<meta property="og:image" content="img/logo-cbt.jpeg">`
   - Não precisa convertao para WebP (é meta tag)

---

## 📊 Checklist de Implementação

### Fase 1: Conversão (30 minutos)
- [ ] Converter `logo-cbt.jpeg` → `logo-cbt.webp` (Squoosh)
- [ ] Validar arquivo criado em `/img/`
- [ ] Verificar tamanho reduzido

### Fase 2: Atualizar HTML (15 minutos)
- [ ] Substituir `<img>` do logo por `<picture>`
- [ ] Testar em navegador (deve exibir normal)
- [ ] Teste em navegadores antigos (fallback funciona)

### Fase 3: Validação (10 minutos)
- [ ] Abrir DevTools > Network > img/
- [ ] Verificar se WebP é carregado em navegadores modernos
- [ ] Verificar if JPEG fallback é carregado em IE/antigos

### Fase 4: Performance (5 minutos)
- [ ] Rodar Google Lighthouse
- [ ] Verificar ganho em "Performance" score

---

## 🔍 Como Validar no Navegador

### Chrome DevTools
1. Abra o site
2. Abrir DevTools (F12)
3. Ir na aba **Network**
4. Filtrar por imagens (clique em "Img")
5. Procurar por `logo-cbt.webp` ou `logo-cbt.jpeg`
6. Verificar qual foi carregado e o tamanho

**Resultado esperado:**
- Em Chrome moderno: `logo-cbt.webp` (12KB)
- Em Firefox/Safari: `logo-cbt.jpeg` (35KB - fallback)

---

## 📈 Estimativa de Ganho

```
ANTES (images):
├─ logo-cbt.jpeg: 35 KB
├─ TOTAL: 35 KB
└─ Performance impact: -5%

DEPOIS (com WebP):
├─ logo-cbt.webp: 12 KB
├─ logo-cbt.jpeg (fallback): 35 KB (não carregado)
├─ TOTAL carregado: 12 KB
└─ Performance impact: +10%
└─ Economia: 23 KB (66% redução) ✅
```

---

## 🚀 Próximos Passos Após Implementar

1. **Google PageSpeed Insights**
   - Rodar teste: https://pagespeed.web.dev/
   - Comparar antes/depois
   - Documentar ganho

2. **Mais imagens?**
   - Se houver mais imagens (hero bg etc), repetir processo
   - Cada imagem = 20-50KB economizados

3. **Deploy**
   - Fazer commit dos .webp
   - Deploy em produção
   - Monitorar performance no Google Analytics

---

## ⚡ Dicas de Performance Extras

### Lazy loading
Já está implementado com `loading="lazy"` no HTML.

### Compressão de vídeos
Se tiver `hero.mp4`:
```bash
# Reduzir tamanho de vídeo
ffmpeg -i hero.mp4 -c:v libx265 -crf 28 hero-compressed.mp4
```

### CDN para imagens
Para produção, considerar:
- **Cloudflare Images** (conversão automática)
- **ImageKit.io** (otimização on-the-fly)
- **AWS CloudFront** + **Lambda** para conversão

---

## 📞 Suporte

**Dúvidas ao converter?**
- Squoosh é o mais fácil (visual, sem terminal)
- Qualidade 80 é o padrão recomendado
- Se WebP ficar muito pequeno (<50% original), aumentar quality para 85-90

**Arquivo não funciona em produção?**
- Validar que a extensão está correta (.webp)
- Verificar que `<source>` vem ANTES de `<img>`
- Limpar cache do navegador (Ctrl+Shift+Del)

---

## 📅 Timeline Recomendada

| Tarefa | Tempo | Dia |
|--------|-------|-----|
| Converter imagens | 30 min | Hoje |
| Atualizar HTML | 15 min | Hoje |
| Testar + Validar | 15 min | Hoje |
| Deploy | 10 min | Amanhã |
| Monitorar | Contínuo | Após deploy |

**Total: ~1 hora de trabalho**
