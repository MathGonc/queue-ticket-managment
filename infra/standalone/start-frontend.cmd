@echo off
REM Atalho: roda start-frontend.ps1 sem depender da ExecutionPolicy do Windows
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-frontend.ps1" %*
pause
