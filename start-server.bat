@echo off
echo ==========================================
echo  KHOI DONG BACKEND SERVER
echo ==========================================

cd server
echo Dang khoi dong backend...
start "Backend Server" cmd /k "node index-safe.js"
timeout /t 3

echo.
echo ✅ Backend dang chay tren: http://localhost:5000
echo ==========================================
pause
