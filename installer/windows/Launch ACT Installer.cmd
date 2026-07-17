@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0ACT-Installer.ps1"
if errorlevel 1 (
  echo.
  echo ACT Installer stopped with an error.
  pause
)
endlocal
