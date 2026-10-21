# Инструкция: Сборка APK через GitHub Actions

В репозиторий уже добавлен готовый файл автоматической сборки: `.github/workflows/build-apk.yml`.
GitHub бесплатно предоставит виртуальную машину с Ubuntu, Android SDK и Java 17, скомпилирует проект и отдаст готовый `.apk` файл для скачивания.

---

### Пошаговая инструкция

#### Шаг 1. Создание репозитория на GitHub
1. Перейди на [GitHub.com](https://github.com) и создай новый публичный или приватный репозиторий (например, `tetris-engine-android`).
2. Не инициализируй его файлами README или .gitignore (оставь пустым).

#### Шаг 2. Загрузка кода в GitHub
Распакуй архив с кодом и выполни в папке проекта команды терминала:
```bash
git init
git add .
git commit -m "Initial commit with competitive Tetris engine and APK workflow"
git branch -M main
git remote add origin https://github.com/<твой-логин>/<твой-репозиторий>.git
git push -u origin main
```
*(Также можно просто перетащить файлы проекта через веб-интерфейс GitHub: Add file -> Upload files).*

#### Шаг 3. Запуск сборки APK
1. Как только код будет отправлен (`git push`), GitHub автоматически запустит Workflow сборки.
2. Открой вкладку **Actions** в твоем репозитории на GitHub.
3. Ты увидишь запущенный пайплайн **«Build Android APK»**.
4. Сборка занимает около 2–3 минут (скачивание Capacitor, сборка React-бандла, запуск Gradle и генерация APK).

#### Шаг 4. Скачивание готового APK
1. После того как процесс завершится зеленым значком ✅, кликни по названию сборки.
2. В самом низу страницы в блоке **Artifacts** появится файл:
   **`tetris-engine-debug.apk`**
3. Нажми на него — скачается архив с готовым APK-файлом.
4. Перекинь файл на телефон и нажми «Установить»!

---

### Альтернатива: Сборка через PWABuilder (Без установки Git)
Если не хочется настраивать GitHub:
1. Открой сайт: **https://www.pwabuilder.com**
2. Введи ссылку:
   `https://ais-pre-cf52hgzozrp25gagelrufx-613858765043.europe-west2.run.app`
3. Нажми **Package for Android** -> **Generate APK**.
4. Сервис сгенерирует `.apk` и отдаст прямую ссылку на скачивание.
