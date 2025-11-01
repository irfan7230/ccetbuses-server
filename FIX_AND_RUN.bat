@echo off
echo ========================================
echo 🔧 Sundhara Travels - Quick Fix & Run
echo ========================================
echo.

echo 📦 Step 1: Installing Frontend Dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Installation failed. Please check the error above.
    pause
    exit /b 1
)

echo ✅ Frontend dependencies installed!
echo.

echo 🎉 Installation Complete!
echo.
echo ========================================
echo 📋 NEXT STEPS:
echo ========================================
echo.
echo 1. Backend server is already installed ✅
echo.
echo 2. Configure environment files:
echo    - Edit .env with Firebase config
echo    - Edit server\.env with credentials
echo.
echo 3. Start Backend (in NEW terminal):
echo    cd server
echo    npm run dev
echo.
echo 4. Start Frontend (in THIS terminal):
echo    npm start
echo.
echo 5. Scan QR code with Expo Go app
echo.
echo ========================================
pause
