@echo off
REM Atalho: roda start-all.ps1 sem depender da ExecutionPolicy do Windows
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-all.ps1" %*
pause
