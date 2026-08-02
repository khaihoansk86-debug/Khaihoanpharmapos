@echo off
set "SCRIPT_DIR=%~dp0"
set "SESSION_DIR=%SCRIPT_DIR%zalo-session"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"
set "BAT_FILE=%DESKTOP_DIR%\Dang Nhap Zalo Bot.bat"

echo @echo off > "%BAT_FILE%"
echo echo ---------------------------------------------------- >> "%BAT_FILE%"
echo echo DANG MO PHIEN BAN ZALO CUA BOT... >> "%BAT_FILE%"
echo echo Vui long quet ma QR hoac dang nhap neu duoc yeu cau. >> "%BAT_FILE%"
echo echo ---------------------------------------------------- >> "%BAT_FILE%"
echo start chrome --user-data-dir="%SESSION_DIR%" "https://chat.zalo.me/" >> "%BAT_FILE%"
echo exit >> "%BAT_FILE%"

echo Da tao xong Shortcut tren Desktop (Dang Nhap Zalo Bot.bat)
echo Bay gio ban co the click vao file tren Desktop de mo Zalo Bot tren may nay!
pause
