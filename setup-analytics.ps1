#!/usr/bin/env powershell
# Script para substituir Google Analytics ID em todos os arquivos HTML
# Uso: .\setup-analytics.ps1 -AnalyticsId "G-XXXXXXXXXX"

param(
    [Parameter(Mandatory=$true)]
    [string]$AnalyticsId
)

# Validar formato de Analytics ID
if ($AnalyticsId -notmatch "^G-[A-Z0-9]{10}$") {
    Write-Host "❌ Erro: ID deve ter formato G-XXXXXXXXXX (ex: G-AB12CD34EF)" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Configurando Google Analytics..." -ForegroundColor Green
Write-Host "Analytics ID: $AnalyticsId" -ForegroundColor Cyan

# Arquivos HTML que precisam ser atualizados
$htmlFiles = @(
    "index.html",
    "sobre.html",
    "localizacao.html",
    "doacoes.html",
    "ajudar.html",
    "transparencia.html",
    "contato.html"
)

# Regex para encontrar o placeholder
$placeholder = "G-XXXXXXXXXX"
$replacements = 0

foreach ($file in $htmlFiles) {
    $path = Join-Path (Get-Location) $file
    
    if (Test-Path $path) {
        Write-Host "➜ Atualizando: $file" -ForegroundColor Yellow
        
        # Ler conteúdo
        $content = Get-Content -Path $path -Raw
        
        # Contar ocorrências
        $matches = [regex]::Matches($content, [regex]::Escape($placeholder))
        if ($matches.Count -gt 0) {
            # Substituir
            $newContent = $content -replace [regex]::Escape($placeholder), $AnalyticsId
            
            # Escrever de volta
            Set-Content -Path $path -Value $newContent -Encoding UTF8
            
            Write-Host "  ✅ Substituído $($matches.Count) ocorrência(s)" -ForegroundColor Green
            $replacements += $matches.Count
        } else {
            Write-Host "  ⚠️  Nenhuma ocorrência encontrada" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ Arquivo não encontrado" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Configuração Concluída!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Total de substituições: $replacements" -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Fazer commit das alterações"
Write-Host "2. Fazer deploy em produção"
Write-Host "3. Aguardar 24-48h para dados aparecerem"
Write-Host "4. Acessar: https://analytics.google.com/analytics/web/#/"
Write-Host ""
