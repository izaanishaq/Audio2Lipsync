@echo off
echo Starting Clean Lip-Sync API Server...
echo.
cd /d "%~dp0api"
echo Running: node server.js
echo.
node server.js
pause
