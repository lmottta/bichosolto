@echo off
SETLOCAL EnableDelayedExpansion

:: Cores para saída
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

:: Título do script
title Ambiente Railway Local - Bicho Solto

:: Verificar se o Docker está instalado
docker -v > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    call :error "Docker não está instalado. Por favor, instale o Docker antes de continuar."
    exit /b 1
)

:: Verificar se o Docker está em execução
docker info > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    call :error "Docker não está em execução. Por favor, inicie o Docker antes de continuar."
    exit /b 1
)

:: Processar argumentos
if "%1"=="start" (
    call :reset_environment
    call :start_environment
    exit /b 0
)

if "%1"=="stop" (
    call :status "Parando serviços"
    docker-compose -f docker-compose.railway-local.yml down
    call :success "Serviços parados com sucesso"
    exit /b 0
)

if "%1"=="logs" (
    call :show_logs
    exit /b 0
)

if "%1"=="" (
    goto :menu
) else (
    call :error "Comando não reconhecido: %1"
    echo Uso: %0 [start^|stop^|logs]
    exit /b 1
)

:: Menu principal
:menu
cls
call :show_menu
choice /c 123456780 /n /m "Escolha uma opção: "
echo.

if errorlevel 9 goto :eof
if errorlevel 8 goto :reset
if errorlevel 7 goto :check_status
if errorlevel 6 goto :restart_frontend
if errorlevel 5 goto :restart_backend
if errorlevel 4 goto :show_logs_menu
if errorlevel 3 goto :stop_services
if errorlevel 2 goto :start_only
if errorlevel 1 goto :start_full

:: Opções do menu
:start_full
    call :reset_environment
    call :start_environment
    pause
    goto :menu

:start_only
    call :start_environment
    pause
    goto :menu

:stop_services
    call :status "Parando serviços"
    docker-compose -f docker-compose.railway-local.yml down
    call :success "Serviços parados com sucesso"
    pause
    goto :menu

:show_logs_menu
    call :show_logs
    goto :menu

:restart_backend
    call :status "Reiniciando backend"
    docker-compose -f docker-compose.railway-local.yml restart backend
    call :success "Backend reiniciado"
    pause
    goto :menu

:restart_frontend
    call :status "Reiniciando frontend"
    docker-compose -f docker-compose.railway-local.yml restart frontend
    call :success "Frontend reiniciado"
    pause
    goto :menu

:check_status
    call :status "Status dos serviços"
    docker-compose -f docker-compose.railway-local.yml ps
    pause
    goto :menu

:reset
    call :reset_environment
    pause
    goto :menu

:: Funções auxiliares
:reset_environment
    call :status "Parando e removendo contêineres existentes"
    docker-compose -f docker-compose.railway-local.yml down -v
    call :success "Ambiente anterior removido com sucesso"
    exit /b 0

:start_environment
    call :status "Construindo e iniciando o ambiente Railway local"
    docker-compose -f docker-compose.railway-local.yml up -d --build
    if %ERRORLEVEL% EQU 0 (
        call :success "Ambiente Railway local iniciado com sucesso!"
        echo %GREEN%O frontend estará disponível em: %YELLOW%http://localhost:3000%NC%
        echo %GREEN%O backend estará disponível em: %YELLOW%http://localhost:5001%NC%
    ) else (
        call :error "Erro ao iniciar o ambiente Railway local."
        exit /b 1
    )
    exit /b 0

:show_logs
    call :status "Exibindo logs dos serviços"
    docker-compose -f docker-compose.railway-local.yml logs -f
    exit /b 0

:show_menu
    echo %BLUE%
    echo ==========================================
    echo     Ambiente Railway Local - Bicho Solto  
    echo ==========================================
    echo %NC%
    echo 1. Iniciar ambiente completo (reset + start)
    echo 2. Apenas iniciar serviços
    echo 3. Parar todos os serviços
    echo 4. Ver logs dos serviços
    echo 5. Reiniciar apenas o backend
    echo 6. Reiniciar apenas o frontend
    echo 7. Verificar status
    echo 8. Limpar e remover tudo
    echo 0. Sair
    echo.
    exit /b 0

:status
    echo %BLUE%=== %~1 ===%NC%
    exit /b 0

:success
    echo %GREEN%✓ %~1%NC%
    exit /b 0

:warning
    echo %YELLOW%⚠ %~1%NC%
    exit /b 0

:error
    echo %RED%✗ %~1%NC%
    exit /b 0

ENDLOCAL 