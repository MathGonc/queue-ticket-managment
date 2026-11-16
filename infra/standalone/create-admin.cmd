@echo off
REM Cria (ou redefine a senha de) um usuario administrador.
REM   create-admin.cmd                      pergunta os dados
REM   create-admin.cmd --login nome.sobrenome --name "Nome" --password segredo
cd /d "%~dp0..\..\backend"
call npm run create-admin -- %*
pause
