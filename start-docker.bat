@echo off
echo ===== Verificando Docker Desktop =====
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>NUL | find /I /N "Docker Desktop.exe">NUL
if "%ERRORLEVEL%"=="1" (
    echo Docker Desktop nao esta rodando. Tentando iniciar...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo Aguardando Docker iniciar...
    timeout /t 15
) else (
    echo Docker Desktop ja esta rodando.
)

echo.
echo ===== Iniciando ambiente Bicho Solto =====
echo.

docker-compose --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Usando docker-compose...
    docker-compose up -d
) else (
    echo Usando docker compose...
    docker compose up -d
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===== Ambiente iniciado com sucesso! =====
    echo.
    echo Frontend: http://localhost:3000
    echo Backend: http://localhost:5000
    echo PgAdmin: http://localhost:8080
    echo   - Email: admin@bischosolto.com
    echo   - Senha: admin
    echo.
) else (
    echo.
    echo ===== ERRO ao iniciar os containers =====
    echo.
)

pause 