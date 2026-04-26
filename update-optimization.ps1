# =============================================================================
# CBT Site Optimization - PowerShell Update Script
# Aplica todas as otimizacoes de nível senior aos arquivos HTML
# =============================================================================

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     CBT Site Optimization - PowerShell Script (v1.0)      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Arquivos para atualizar
$htmlFiles = @(
    "index.html",
    "sobre.html",
    "localizacao.html",
    "doacoes.html",
    "ajudar.html",
    "transparencia.html",
    "contato.html"
)

# Template para head otimizado
$optimizedHead = @'
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="description" content="CBT - Cerrado Bike Trilhas - Trilhas em meio ao Cerrado, mantidas por voluntarios.">
  <meta name="theme-color" content="#000000">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="format-detection" content="telephone-no">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  
  <!-- Open Graph / Social Media -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="CBT - Cerrado Bike Trilhas">
  <meta property="og:description" content="Trilhas em meio ao Cerrado.">
  <meta property="og:image" content="img/logo-cbt.jpeg">
  <meta name="twitter:card" content="summary_large_image">
  
  <title>CBT - Cerrado Bike Trilhas</title>
  
  <!-- Preload critical fonts -->
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Grotesk:wght@600;700&display=swap" as="style">
  
  <script>
    (function () {
      const version = Date.now();
      const stylesheet = document.createElement("link");
      stylesheet.rel = "stylesheet";
      stylesheet.href = `style.css?v=${version}`;
      document.head.appendChild(stylesheet);
    })();
  </script>
  
  <script src="config.js"></script>
</head>
'@

# Template para footer otimizado
$optimizedFooter = @'
  <!-- QRCode library -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" defer></script>
  
  <!-- Main optimized app script -->
  <script>
    (function () {
      const version = Date.now();
      const appScript = document.createElement("script");
      appScript.src = `script-optimized.js?v=${version}`;
      appScript.async = false;
      document.body.appendChild(appScript);
    })();
  </script>
  
  <!-- Service Worker Registration -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js');
      });
    }
  </script>
</body>
</html>
'@

# Processar cada arquivo
foreach ($file in $htmlFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "⚠ Arquivo não encontrado: $file" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "📝 Processando: $file" -ForegroundColor Cyan
    
    # Criar backup
    $backup = "$file.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
    Copy-Item $file $backup
    Write-Host "✓ Backup criado: $backup" -ForegroundColor Green
    
    # Ler conteúdo
    $content = Get-Content $file -Raw
    
    # Substituir head
    $content = $content -replace '(?s)<head>.*?</head>', $optimizedHead
    
    # Substituir footer (script section antes de </body>)
    $content = $content -replace '(?s)<script.*?</script>\s*</body>\s*</html>', $optimizedFooter
    
    # Salvar
    Set-Content $file $content
    Write-Host "✓ $file atualizado" -ForegroundColor Green
    Write-Host ""
}

Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     ✓ Otimizacoes aplicadas com sucesso!                 ║" -ForegroundColor Green
Write-Host "║     - config.json centralizado                           ║" -ForegroundColor Green
Write-Host "║     - script-optimized.js ativo                          ║" -ForegroundColor Green
Write-Host "║     - Service Worker registrado                          ║" -ForegroundColor Green
Write-Host "║     - Meta tags SEO adicionadas                          ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "Proximos Passos:" -ForegroundColor Cyan
Write-Host "1. Abra o site em localhost e teste"
Write-Host "2. DevTools > Application > Service Workers (verifique status)"
Write-Host "3. Valide em https://pagespeed.web.dev/"
Write-Host "4. Teste com DevTools Offline"
Write-Host ""
Write-Host "Para remover backups (se tudo OK):" -ForegroundColor Cyan
Write-Host "Remove-Item *.backup.*" -ForegroundColor Yellow
