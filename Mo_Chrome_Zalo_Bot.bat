@echo off
title Khoi dong Zalo Bot PharmaPOS
echo ========================================================
echo   KHOI DONG ZALO BOT VA CHROME (PORT 9222)...
echo ========================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0bot-assistant\Start_Zalo_Bot.ps1"
if errorlevel 1 (
    echo Khong the khoi dong Zalo Bot. Kiem tra bot-assistant\bot-error.log.
    pause
    exit /b 1
)

echo Zalo Bot da duoc khoi dong. Co the dong cua so nay.
