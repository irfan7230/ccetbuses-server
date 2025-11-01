@echo off
echo ========================================
echo 🔥 Firestore Rules & Indexes Deployment
echo ========================================
echo.

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Firebase CLI is not installed.
    echo.
    echo Installing Firebase CLI...
    call npm install -g firebase-tools
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install Firebase CLI
        pause
        exit /b 1
    )
)

echo ✅ Firebase CLI found
echo.

REM Check if user is logged in
firebase projects:list >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 🔐 Please login to Firebase...
    call firebase login
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Login failed
        pause
        exit /b 1
    )
)

echo ✅ Logged in to Firebase
echo.

REM Check if firebase.json exists
if not exist "firebase.json" (
    echo ⚙️  Initializing Firebase...
    echo.
    echo Please select:
    echo - Firestore
    echo - Choose your project
    echo.
    call firebase init firestore
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Initialization failed
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo 📤 Deploying Firestore Rules & Indexes
echo ========================================
echo.

REM Deploy Firestore rules and indexes
call firebase deploy --only firestore

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Deployment failed
    echo.
    echo Please check:
    echo - Firebase project is selected
    echo - You have permission to deploy
    echo - Rules syntax is correct
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ Deployment Complete!
echo ========================================
echo.
echo 🔐 Security Rules: Deployed
echo 📊 Indexes: Deployed
echo.
echo Next Steps:
echo 1. Go to Firebase Console
echo 2. Verify rules are active
echo 3. Wait 1-2 minutes for indexes to build
echo 4. Test the app
echo.
echo 📖 See FIRESTORE_SETUP.md for details
echo.
pause
