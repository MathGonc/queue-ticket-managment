@echo off
REM Atalho: roda setup.ps1 sem depender da ExecutionPolicy do Windows
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1" %*
pause
