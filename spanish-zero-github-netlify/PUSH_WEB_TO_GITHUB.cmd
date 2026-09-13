@echo off
chcp 65001 >nul
setlocal
set REPO=https://github.com/Anfascomua/spanish-zero-app.git
set TMP=%~dp0_repo_web_sync

where git >nul 2>nul
if errorlevel 1 (
  echo Git is not installed.
  start https://git-scm.com/download/win
  pause
  exit /b 1
)

if exist "%TMP%" rmdir /s /q "%TMP%"
echo Cloning repository...
git clone "%REPO%" "%TMP%"
if errorlevel 1 goto :error

if exist "%TMP%\web" rmdir /s /q "%TMP%\web"
mkdir "%TMP%\web" >nul 2>nul
xcopy "%~dp0web\*" "%TMP%\web\" /E /I /Y >nul
copy /Y "%~dp0netlify.toml" "%TMP%\netlify.toml" >nul
copy /Y "%~dp0README.md" "%TMP%\README-WEB.md" >nul

cd /d "%TMP%"
git add web netlify.toml README-WEB.md
git diff --cached --quiet
if not errorlevel 1 (
  echo No new web changes to upload.
  goto :done
)

git config user.name >nul 2>nul
if errorlevel 1 git config user.name "Anfascomua"
git config user.email >nul 2>nul
if errorlevel 1 git config user.email "202592382+Anfascomua@users.noreply.github.com"

git commit -m "Add web PWA for Netlify auto deploy"
if errorlevel 1 goto :error
git push origin main
if errorlevel 1 goto :error

echo.
echo Web version uploaded to GitHub successfully.
:done
start https://github.com/Anfascomua/spanish-zero-app
start https://app.netlify.com/projects/spanish-zero-app-2026/configuration/deploys
pause
exit /b 0

:error
echo.
echo Upload failed. Send a screenshot of this window to ChatGPT.
pause
exit /b 1
