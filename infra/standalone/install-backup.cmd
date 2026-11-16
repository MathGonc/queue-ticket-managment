@echo off
REM Atalho: roda install-backup.ps1 sem depender da ExecutionPolicy do Windows
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-backup.ps1" %*
pause
