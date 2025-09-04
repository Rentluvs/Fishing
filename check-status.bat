@echo off
echo ==========================================
echo  KIEM TRA TRANG THAI WEB APPLICATION
echo ==========================================
echo.

echo 🔍 Checking Backend (Port 5000)...
netstat -an | findstr ":5000" >nul
if %errorlevel%==0 (
    echo ✅ BACKEND: DANG HOAT DONG tren port 5000
) else (
    echo ❌ Backend: Chua hoat dong
)
echo.

echo 🔍 Checking Frontend (Port 3000)...  
netstat -an | findstr ":3000" >nul
if %errorlevel%==0 (
    echo ✅ FRONTEND: DANG HOAT DONG tren port 3000
) else (
    echo ❌ Frontend: Chua hoat dong  
)
echo.

echo 🌐 Neu ca 2 deu hoat dong, hay truy cap:
echo    👉 http://localhost:3000
echo.
echo ==========================================
pause
