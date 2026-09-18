# GitHub Releases для Android

Приложение само проверяет `https://github.com/Anfascomua/spanish-zero-app/releases/latest` раз в 12 часов. Если номер Release выше номера установленного APK, появится кнопка «Скачать». Android откроет GitHub и пользователь подтвердит установку — бесшумно обновлять APK вне Google Play нельзя.

## Один раз: создать ключ подписи

В PowerShell в папке `spanish-zero-android`:

```powershell
keytool -genkeypair -v -keystore spanish-zero-release.jks -alias spanishzero -keyalg RSA -keysize 2048 -validity 10000
[Convert]::ToBase64String([IO.File]::ReadAllBytes('spanish-zero-release.jks')) | Set-Clipboard
```

Не удаляйте файл `spanish-zero-release.jks` и не публикуйте его в Git. Он нужен для всех будущих обновлений.

## Один раз: добавить GitHub Secrets

В репозитории: **Settings → Secrets and variables → Actions → New repository secret**.

- `ANDROID_KEYSTORE_BASE64` — текст из буфера после команды выше;
- `ANDROID_KEYSTORE_PASSWORD` — пароль файла ключа;
- `ANDROID_KEY_ALIAS` — `spanishzero` или выбранный вами alias;
- `ANDROID_KEY_PASSWORD` — пароль ключа.

## Выпуск обновления

Создайте тег вида `v123` и отправьте его в GitHub. Например:

```powershell
git tag v123
git push origin v123
```

GitHub Actions создаст Release и прикрепит `SpanishZero-v123.apk`. Каждый новый тег должен иметь большее число, чем предыдущий.
