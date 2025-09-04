@echo off
echo ==========================================
echo  KHOI DONG FRONTEND CLIENT
echo ==========================================

cd client
echo Dang khoi dong frontend...
start "Frontend Client" cmd /k "npm run dev"
timeout /t 5

echo.
echo ✅ Frontend dang chay tren: http://localhost:3000
echo ==========================================
pause
