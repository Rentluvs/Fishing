@echo off
title Fish Management - Full Stack Startup

echo ==========================================
echo     FISH MANAGEMENT APPLICATION
echo ==========================================
echo.

echo 🚀 Step 1: Starting Backend Server...
cd server
start "🔧 Backend (Port 5000)" cmd /c "echo 🔧 Backend Server && echo ==================== && node index-safe.js"
cd ..

echo ⏳ Waiting 3 seconds for backend...
timeout /t 3 >nul

echo.
echo 🎨 Step 2: Starting Frontend Client...
cd client  
start "🎨 Frontend (Port 3000)" cmd /c "echo 🎨 Frontend Client && echo ==================== && npm run dev"
cd ..

echo ⏳ Waiting 5 seconds for frontend...
timeout /t 5 >nul

echo.
echo ==========================================
echo   ✅ APPLICATION READY!
echo ==========================================
echo 🌐 Open your browser: http://localhost:3000
echo 🔗 Backend API: http://localhost:5000/api
echo.
echo 📱 Login: admin / admin123
echo ==========================================

echo Press any key to open browser...
pause >nul
start http://localhost:3000
