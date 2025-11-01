@echo off
REM Sundhara Travels - Complete Installation Script for Windows
REM This script installs all dependencies for both frontend and backend

echo ========================================
echo 🚌 Sundhara Travels - Installation Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

node -v
echo ✅ Node.js found
echo.

REM Frontend Installation
echo ========================================
echo 📱 Installing Frontend Dependencies...
echo ========================================
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend installation failed
    pause
    exit /b 1
)

echo ✅ Frontend dependencies installed successfully
echo.

REM Backend Installation
echo ========================================
echo 🖥️  Installing Backend Dependencies...
echo ========================================
cd server
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend installation failed
    cd ..
    pause
    exit /b 1
)

echo ✅ Backend dependencies installed successfully
cd ..
echo.

REM Check for environment files
echo ========================================
echo 🔧 Checking Environment Configuration...
echo ========================================

if not exist ".env" (
    echo ⚠️  .env file not found
    echo Creating from .env.example...
    copy .env.example .env >nul
    echo ✅ Created .env - Please configure with your credentials
) else (
    echo ✅ .env file exists
)

if not exist "server\.env" (
    echo ⚠️  server\.env file not found
    echo Creating from server\.env.example...
    copy server\.env.example server\.env >nul
    echo ✅ Created server\.env - Please configure with your credentials
) else (
    echo ✅ server\.env file exists
)

echo.
echo ========================================
echo ✨ Installation Complete!
echo ========================================
echo.
echo 📋 Next Steps:
echo.
echo 1. Configure environment variables:
echo    - Edit .env (Frontend Firebase config)
echo    - Edit server\.env (Backend credentials)
echo.
echo 2. Start the backend server:
echo    cd server
echo    npm run dev
echo.
echo 3. In a new terminal, start the frontend:
echo    npm start
echo.
echo 4. Scan QR code with Expo Go app
echo.
echo 📖 For detailed setup instructions, see SETUP.md
echo.
pause
