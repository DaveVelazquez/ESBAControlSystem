# Script para ejecutar y monitorear el workflow de backend
Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "EJECUTANDO WORKFLOW: Deploy Backend Complete" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Cambiar al directorio del repositorio
Set-Location "c:\dev\Dev2\Sistema de Control"

# Ejecutar el workflow
Write-Host "Enviando solicitud de ejecucion del workflow..." -ForegroundColor Yellow
gh workflow run "deploy-backend-complete.yml" --ref main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Workflow iniciado exitosamente" -ForegroundColor Green
    Write-Host ""
    
    # Esperar un momento para que el workflow aparezca
    Write-Host "Esperando 5 segundos para que el workflow se registre..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Obtener el ID del workflow run mas reciente
    Write-Host ""
    Write-Host "Obteniendo informacion del workflow..." -ForegroundColor Yellow
    
    $workflowRuns = gh run list --workflow="deploy-backend-complete.yml" --limit 1 --json databaseId,status,conclusion,url
    $workflowData = $workflowRuns | ConvertFrom-Json
    
    if ($workflowData -and $workflowData.Count -gt 0) {
        $runId = $workflowData[0].databaseId
        $runUrl = $workflowData[0].url
        
        Write-Host ""
        Write-Host "========================================================" -ForegroundColor Cyan
        Write-Host "INFORMACION DEL WORKFLOW" -ForegroundColor Green
        Write-Host "========================================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "URL: $runUrl" -ForegroundColor Blue
        Write-Host "Run ID: $runId" -ForegroundColor Gray
        Write-Host ""
        Write-Host "========================================================" -ForegroundColor Cyan
        Write-Host ""
        
        # Monitorear el workflow
        Write-Host "Monitoreando progreso del workflow..." -ForegroundColor Yellow
        Write-Host "(Esto tomara aproximadamente 10 minutos)" -ForegroundColor Gray
        Write-Host ""
        
        $previousStatus = ""
        $startTime = Get-Date
        
        while ($true) {
            # Obtener estado actual
            $currentRun = gh run view $runId --json status,conclusion | ConvertFrom-Json
            $status = $currentRun.status
            $conclusion = $currentRun.conclusion
            
            # Mostrar actualizaciones solo cuando cambia el estado
            if ($status -ne $previousStatus) {
                $elapsed = [math]::Round(((Get-Date) - $startTime).TotalMinutes, 1)
                
                switch ($status) {
                    "queued" {
                        Write-Host "[$elapsed min] Workflow en cola..." -ForegroundColor Yellow
                    }
                    "in_progress" {
                        Write-Host "[$elapsed min] Workflow en ejecucion..." -ForegroundColor Cyan
                    }
                    "completed" {
                        Write-Host "[$elapsed min] Workflow completado!" -ForegroundColor Green
                        break
                    }
                }
                
                $previousStatus = $status
            }
            
            # Si esta completado, salir del loop
            if ($status -eq "completed") {
                break
            }
            
            # Esperar 15 segundos antes de la proxima verificacion
            Start-Sleep -Seconds 15
        }
        
        Write-Host ""
        Write-Host "========================================================" -ForegroundColor Cyan
        
        # Verificar el resultado
        if ($conclusion -eq "success") {
            Write-Host "WORKFLOW COMPLETADO EXITOSAMENTE" -ForegroundColor Green
            Write-Host "========================================================" -ForegroundColor Cyan
            Write-Host ""
            
            # Obtener los logs del ultimo step para extraer la IP
            Write-Host "Obteniendo informacion del backend desplegado..." -ForegroundColor Yellow
            Write-Host ""
            
            $logs = gh run view $runId --log
            
            # Buscar la IP del backend en los logs
            if ($logs -match "Backend IP: (\d+\.\d+\.\d+\.\d+)") {
                $backendIp = $matches[1]
                
                Write-Host "========================================================" -ForegroundColor Cyan
                Write-Host "BACKEND DESPLEGADO EXITOSAMENTE" -ForegroundColor Green
                Write-Host "========================================================" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "IP del Backend: $backendIp" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "URLs disponibles:" -ForegroundColor Yellow
                Write-Host "  * Health Check: http://${backendIp}:3000/health" -ForegroundColor White
                Write-Host "  * API Root: http://${backendIp}:3000/" -ForegroundColor White
                Write-Host "  * Login: http://${backendIp}:3000/api/auth/login" -ForegroundColor White
                Write-Host "  * Test: http://${backendIp}:3000/api/test" -ForegroundColor White
                Write-Host ""
                Write-Host "Credenciales de prueba:" -ForegroundColor Yellow
                Write-Host "  * Email: admin@fieldservice.com" -ForegroundColor White
                Write-Host "  * Password: admin123" -ForegroundColor White
                Write-Host ""
                Write-Host "Frontend:" -ForegroundColor Yellow
                Write-Host "  * http://field-service-frontend-prod.s3-website-us-east-1.amazonaws.com" -ForegroundColor White
                Write-Host ""
                Write-Host "========================================================" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "Ahora puedes probar el login en el frontend!" -ForegroundColor Green
                Write-Host ""
                
                # Probar conectividad
                Write-Host "Probando conectividad del backend..." -ForegroundColor Yellow
                try {
                    $response = Invoke-WebRequest -Uri "http://${backendIp}:3000/health" -TimeoutSec 10
                    if ($response.StatusCode -eq 200) {
                        Write-Host "Backend responde correctamente!" -ForegroundColor Green
                        Write-Host ""
                        Write-Host "Respuesta del health check:" -ForegroundColor Gray
                        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
                    }
                } catch {
                    Write-Host "No se pudo conectar al backend todavia." -ForegroundColor Yellow
                    Write-Host "Espera 1-2 minutos mas y prueba:" -ForegroundColor Gray
                    Write-Host "curl http://${backendIp}:3000/health" -ForegroundColor Gray
                }
            } else {
                Write-Host "No se pudo extraer la IP del backend de los logs." -ForegroundColor Yellow
                Write-Host "Revisa los logs en: $runUrl" -ForegroundColor Gray
            }
            
        } elseif ($conclusion -eq "failure") {
            Write-Host "WORKFLOW FALLO" -ForegroundColor Red
            Write-Host "========================================================" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Revisa los logs en: $runUrl" -ForegroundColor Blue
            Write-Host ""
        } else {
            Write-Host "WORKFLOW TERMINO CON ESTADO: $conclusion" -ForegroundColor Yellow
            Write-Host "========================================================" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Revisa los logs en: $runUrl" -ForegroundColor Blue
            Write-Host ""
        }
        
    } else {
        Write-Host "No se pudo obtener informacion del workflow" -ForegroundColor Red
        Write-Host "Verifica manualmente en:" -ForegroundColor Gray
        Write-Host "https://github.com/DaveVelazquez/ESBAControlSystem/actions" -ForegroundColor Blue
    }
    
} else {
    Write-Host "Error al ejecutar el workflow" -ForegroundColor Red
    Write-Host ""
    Write-Host "Asegurate de estar autenticado con: gh auth login" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "O ejecuta manualmente en:" -ForegroundColor Gray
    Write-Host "https://github.com/DaveVelazquez/ESBAControlSystem/actions" -ForegroundColor Blue
}

Write-Host ""
