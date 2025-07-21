@echo off
echo Stopping Lip-Sync API Server...
echo.

REM Kill all node.exe processes
taskkill /IM node.exe /F 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✅ API Server stopped successfully
) else (
    echo ⚠️ No Node.js processes were running
)

echo.
pause
