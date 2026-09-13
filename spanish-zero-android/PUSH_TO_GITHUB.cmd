@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
where git >nul 2>&1
if errorlevel 1 (
  echo Git for Windows не найден.
  echo Откроется страница загрузки Git.
  start https://git-scm.com/download/win
  echo После установки Git запустите этот файл еще раз.
  pause
  exit /b 1
)

if not exist .git (
  git init
  git branch -M main
)

git config user.name "Anfascomua" >nul 2>&1
if not defined GIT_AUTHOR_EMAIL git config user.email "anfas.com.ua@gmail.com" >nul 2>&1

git add -A
git commit -m "Android app: Spanish Zero" 2>nul

git remote remove origin >nul 2>&1
git remote add origin https://github.com/Anfascomua/spanish-zero-app.git

echo.
echo Отправляю проект в GitHub...
echo Если появится окно авторизации GitHub - войдите в аккаунт Anfascomua.
echo.
git push -u origin main --force
if errorlevel 1 (
  echo.
  echo Не удалось отправить проект. Скопируйте текст ошибки и пришлите мне.
  pause
  exit /b 1
)

echo.
echo Готово. Проект загружен в GitHub.
echo GitHub Actions автоматически начнет сборку APK.
start https://github.com/Anfascomua/spanish-zero-app/actions
pause
