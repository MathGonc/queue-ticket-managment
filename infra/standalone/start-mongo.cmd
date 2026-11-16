@echo off
REM Atalho: roda start-mongo.ps1 sem depender da ExecutionPolicy do Windows
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-mongo.ps1" %*
pause
