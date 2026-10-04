@echo off
setlocal enabledelayedexpansion

echo =====================================================================
echo    Singly Linked List Implementation - Build and Launch Script
echo =====================================================================
echo.

where gcc >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [INFO] Found GCC compiler. Compiling C Backend...
    gcc -Wall -O2 backend\server.c backend\linkedlist.c -o backend\server.exe -lws2_32
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Compilation failed! Please check error messages above.
        pause
        exit /b %ERRORLEVEL%
    )
    echo [SUCCESS] Backend compiled successfully into backend\server.exe!
    echo.
    echo [INFO] Starting Singly Linked List C HTTP Server...
    echo [INFO] Opening http://localhost:8080 in default web browser...
    start http://localhost:8080
    cd backend
    server.exe
    exit /b 0
)

where clang >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [INFO] Found Clang compiler. Compiling C Backend...
    clang -Wall -O2 backend\server.c backend\linkedlist.c -o backend\server.exe -lws2_32
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Compilation failed! Please check error messages above.
        pause
        exit /b %ERRORLEVEL%
    )
    echo [SUCCESS] Backend compiled successfully into backend\server.exe!
    echo.
    echo [INFO] Starting Singly Linked List C HTTP Server...
    echo [INFO] Opening http://localhost:8080 in default web browser...
    start http://localhost:8080
    cd backend
    server.exe
    exit /b 0
)

echo [WARNING] Neither GCC nor Clang was detected in your system PATH.
echo.
echo Please install MinGW-w64 or LLVM:
echo   Option 1: winget install -e --id MartinStorsjo.LLVM-MinGW.UCRT
echo   Option 2: Download w64devkit from https://github.com/skeeto/w64devkit/releases
echo   Option 3: Install MSYS2 from https://www.msys2.org/
echo.
echo After installing, add the 'bin' directory to your PATH and re-run this script.
echo.
pause
