@echo off
setlocal
cd /d "%~dp0"
set "PC_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%PC_NODE%" (
  "%PC_NODE%" servidor.cjs
) else (
  node servidor.cjs
)
pause
