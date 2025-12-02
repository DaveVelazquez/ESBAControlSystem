# Script para verificar deployment
Write-Host "=== VERIFICANDO DEPLOYMENT AWS ===" -ForegroundColor Cyan

# Verificar AWS CLI
try {
    $account = aws sts get-caller-identity --query Account --output text 2>$null
    if ($account) {
        Write-Host "AWS Account: $account" -ForegroundColor Green
        
        # Buscar Load Balancers
        Write-Host "" 
        Write-Host "Buscando Load Balancers..." -ForegroundColor Yellow
        $albs = aws elbv2 describe-load-balancers --region us-east-1 --query "LoadBalancers[*].[LoadBalancerName,DNSName]" --output text 2>$null
        
        if ($albs) {
            Write-Host "Load Balancers encontrados:" -ForegroundColor Green
            $albs -split "`n" | ForEach-Object {
                $parts = $_ -split "`t"
                if ($parts.Length -ge 2) {
                    $name = $parts[0]
                    $dns = $parts[1]
                    Write-Host "  $name -> $dns" -ForegroundColor White
                    
                    if ($name -like "*field-service*") {
                        Write-Host ""
                        Write-Host "BACKEND API URL: http://$dns" -ForegroundColor Magenta
                        Write-Host "HEALTH CHECK: http://$dns/health" -ForegroundColor Magenta
                    }
                }
            }
        } else {
            Write-Host "No se encontraron Load Balancers - deployment en progreso" -ForegroundColor Yellow
        }
        
        # Verificar ECS  
        Write-Host ""
        Write-Host "Verificando ECS..." -ForegroundColor Yellow
        $services = aws ecs list-services --region us-east-1 --cluster field-service-cluster --output text 2>$null
        if ($services -and $services -ne "") {
            Write-Host "ECS Services: OK" -ForegroundColor Green
        } else {
            Write-Host "ECS Services: En progreso" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "AWS CLI no configurado" -ForegroundColor Red
    }
} catch {
    Write-Host "Error al verificar AWS" -ForegroundColor Red
}