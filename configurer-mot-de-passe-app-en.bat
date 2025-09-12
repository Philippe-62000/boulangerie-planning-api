@echo off
echo ========================================
echo 🔐 CONFIGURATION APP PASSWORD GMAIL (ENGLISH)
echo ========================================

echo.
echo 🎯 This script guides you to create a Gmail App Password
echo    required for the Boulangerie Planning email service.
echo.

echo 📋 PREREQUISITES:
echo    ✅ Active Gmail account
echo    ✅ 2-Step Verification MANDATORY
echo.

echo ⚠️  IMPORTANT: 2-Step Verification is MANDATORY
echo    If not enabled, you must do it first.
echo.

pause

echo.
echo 🚀 STEP 1: Check 2-Step Verification
echo.
echo 📱 Open your browser and go to:
echo    https://myaccount.google.com
echo.
echo 🔍 Check that "2-Step Verification" is ENABLED
echo    If not, enable it first.
echo.

pause

echo.
echo 🚀 STEP 2: Generate App Password
echo.
echo 📱 In your browser:
echo    1. Go to: https://myaccount.google.com
echo    2. Click on "Security" (left menu)
echo    3. Look for "App passwords"
echo    4. Click on "App passwords"
echo.

pause

echo.
echo 🚀 STEP 3: Create the Password
echo.
echo 📝 On the "App passwords" page:
echo    1. Select "Other (Custom name)"
echo    2. Type: "Boulangerie Planning API"
echo    3. Click "Generate"
echo    4. COPY the generated password (16 characters)
echo.

echo ⚠️  ATTENTION: This password is shown only ONCE!
echo    Copy it immediately and paste it in a text file.
echo.

pause

echo.
echo 🚀 STEP 4: Configure on Render
echo.
echo 📱 Open a new tab and go to:
echo    https://dashboard.render.com
echo.
echo 📋 Steps on Render:
echo    1. Log in to your Render account
echo    2. Select the service "boulangerie-planning-api-3"
echo    3. Click on the "Environment" tab
echo    4. Add these 4 variables:
echo.

echo 🔧 Variables to add:
echo    SMTP_HOST = smtp.gmail.com
echo    SMTP_PORT = 587
echo    SMTP_USER = your-email@gmail.com
echo    SMTP_PASS = [the copied app password]
echo.

echo ⚠️  IMPORTANT: 
echo    - Use the app password WITHOUT SPACES
echo    - Replace "your-email@gmail.com" with your real email
echo.

pause

echo.
echo 🚀 STEP 5: Save and Restart
echo.
echo 📋 On Render:
echo    1. Click "Save Changes"
echo    2. The service will restart automatically
echo    3. Wait for deployment to complete
echo.

pause

echo.
echo 🧪 STEP 6: Test Configuration
echo.
echo 📱 Test the configuration with:
echo    node test-email-config.js
echo.
echo 📱 Or test the API directly:
echo    https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-email
echo.

echo.
echo ✅ CONFIGURATION COMPLETED!
echo.
echo 📋 Summary of what was configured:
echo    ✅ Gmail App Password created
echo    ✅ SMTP variables configured on Render
echo    ✅ Email service ready to work
echo.
echo 📧 The service will now automatically send:
echo    ✅ Validation emails to employees
echo    ✅ Rejection emails to employees
echo    ✅ Notifications to accountant
echo    ✅ Admin alerts
echo.

echo 🔗 Useful links:
echo    - Google Settings: https://myaccount.google.com
echo    - Render Dashboard: https://dashboard.render.com
echo    - API Test: https://boulangerie-planning-api-3.onrender.com/api/sick-leaves/test-email
echo.

echo 📚 Documentation:
echo    - GUIDE-MOT-DE-PASSE-APPLICATION-EN.md
echo    - CONFIGURATION-EMAIL.md
echo.

pause
