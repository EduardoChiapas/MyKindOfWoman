@echo off
setlocal
cd /d "%~dp0"
set "PC_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
set "PC_ENV="
if exist ".env" set "PC_ENV=--env-file=.env"
if exist "%PC_NODE%" (
  "%PC_NODE%" %PC_ENV% servidor.cjs
) else (
  node %PC_ENV% servidor.cjs
)
pause
