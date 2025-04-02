@echo off
echo ===== Parando ambiente Bicho Solto =====

docker-compose --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Usando docker-compose...
    docker-compose down
) else (
    echo Usando docker compose...
    docker compose down
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===== Ambiente parado com sucesso! =====
    echo.
) else (
    echo.
    echo ===== ERRO ao parar os containers =====
    echo.
)

pause 