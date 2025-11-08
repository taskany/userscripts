@echo off
cd /d "C:\Users\taska\Documents\userscripts"
git add .
git commit -m "Auto-update: %date% %time%"
git push origin main
echo Done!
pause