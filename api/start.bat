@echo off
echo ========================================
echo  Starting Lip-Sync API Server
echo ========================================
echo.
echo Server will start on http://localhost:3001
echo.
echo Available endpoints:
echo - Test page: http://localhost:3001/test
echo - Status: http://localhost:3001/status  
echo - Libraries: http://localhost:3001/api/file-libraries
echo.
echo ========================================
echo.
node server.js
echo.
echo Server stopped.
pause
