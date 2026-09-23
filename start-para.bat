@echo off
setlocal
cd /d "%~dp0"

echo ================================================
echo PARA AI - React + TypeScript Frontend
echo ================================================

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Install Node.js LTS first.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo npm install failed. Check your internet connection and terminal output.
    pause
    exit /b 1
  )
)

echo Starting Vite development server...
call npm run dev
