@echo off
REM Atalho: roda start-backend.ps1 sem depender da ExecutionPolicy do Windows
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-backend.ps1" %*
pause
