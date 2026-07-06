@echo off
echo Starting Zzorp App...
cd /d "%~dp0"
start http://localhost:5173
npm run dev
