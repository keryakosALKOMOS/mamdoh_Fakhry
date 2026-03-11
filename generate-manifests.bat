@echo off
setlocal
REM Runs manifest generator even when PowerShell scripts are restricted.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\generate-manifests.ps1"
endlocal
