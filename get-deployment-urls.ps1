# Script para obtener URLs del deployment
Write-Host "🔍 BUSCANDO URLS DEL DEPLOYMENT AWS..." -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Configurar AWS CLI si no está configurado
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "❌ AWS CLI no está instalado" -ForegroundColor Red
    Write-Host "   Instalar desde: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    return
}

# Verificar credenciales
try {
    $awsAccount = aws sts get-caller-identity --query Account --output text 2>$null
    if ($awsAccount) {
        Write-Host "✅ AWS CLI configurado - Account: $awsAccount" -ForegroundColor Green
        Write-Host ""
        
        # Buscar TODOS los Load Balancers
        Write-Host "🔍 Buscando todos los Load Balancers..." -ForegroundColor Yellow
        $allALBs = aws elbv2 describe-load-balancers --region us-east-1 --query "LoadBalancers[*].[LoadBalancerName,DNSName]" --output text 2>$null
        
        if ($allALBs) {
            Write-Host "📋 Load Balancers encontrados:" -ForegroundColor Blue
            $allALBs -split "`n" | ForEach-Object {
                $parts = $_ -split "`t"
                if ($parts.Length -ge 2) {
                    $name = $parts[0]
                    $dns = $parts[1]
                    Write-Host "   📡 $name" -ForegroundColor White
                    Write-Host "      $dns" -ForegroundColor Cyan
                    
                    # Si contiene field-service, probar
                    if ($name -like "*field-service*") {
                        Write-Host "      🎯 Este es nuestro ALB!" -ForegroundColor Green
                        Write-Host ""
                        Write-Host "🌐 BACKEND API URL:" -ForegroundColor Magenta
                        Write-Host "   http://$dns" -ForegroundColor Cyan
                        Write-Host ""
                        Write-Host "🔍 HEALTH CHECK:" -ForegroundColor Magenta  
                        Write-Host "   http://$dns/health" -ForegroundColor Cyan
                        Write-Host ""
                        Write-Host "📡 API INFO:" -ForegroundColor Magenta
                        Write-Host "   http://$dns/api" -ForegroundColor Cyan
                        Write-Host ""
                        
                        # Test API
                        Write-Host "🧪 Probando API..." -ForegroundColor Yellow
                        try {
                            $response = Invoke-RestMethod -Uri "http://$dns/health" -TimeoutSec 15
                            Write-Host "✅ API funcionando correctamente!" -ForegroundColor Green
                            Write-Host "   Status: $($response.status)" -ForegroundColor White
                            Write-Host "   Timestamp: $($response.timestamp)" -ForegroundColor White
                            if ($response.environment) {
                                Write-Host "   Environment: $($response.environment)" -ForegroundColor White
                            }
                        }
                        catch {
                            Write-Host "⏳ API aún inicializándose o hay un problema" -ForegroundColor Yellow
                            Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
                        }
                    }
                }
            }
        }
        else {
            Write-Host "⏳ No se encontraron Load Balancers" -ForegroundColor Yellow
            Write-Host "   El deployment puede estar aún en progreso..." -ForegroundColor White
        }
        
        # Verificar ECS
        Write-Host ""
        Write-Host "🔍 Verificando ECS Services..." -ForegroundColor Yellow
        $ecsServices = aws ecs list-services --region us-east-1 --cluster field-service-cluster --query "serviceArns" --output text 2>$null
        
        if ($ecsServices -and $ecsServices -ne "") {
            Write-Host "✅ ECS Services encontrados" -ForegroundColor Green
        }
        else {
            Write-Host "⏳ ECS Services aún no están creados" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "❌ AWS CLI no configurado" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ Error accediendo a AWS: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📍 También puedes revisar:" -ForegroundColor Blue
Write-Host "   GitHub Actions: https://github.com/DaveVelazquez/ESBAControlSystem/actions" -ForegroundColor Cyan
Write-Host "   AWS Console: https://507297234735.signin.aws.amazon.com/console" -ForegroundColor Cyan