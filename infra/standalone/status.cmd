@echo off
REM Atalho: roda status.ps1 sem depender da ExecutionPolicy do Windows
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0status.ps1" %*
pause
