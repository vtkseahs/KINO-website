# KINO 

Веб-приложение **каталог фильмов «КИНО»**. Проект разработан на NestJS и поддерживает три способа взаимодействия с системой: серверно-рендеримые страницы, REST API и GraphQL API.

Несмотря на то, что основная часть логики находится на backend, проект также включает frontend-часть: пользовательский интерфейс реализован через серверный рендеринг Handlebars-шаблонов, статические CSS-стили, изображения и клиентские JavaScript-файлы.

Cайт на Render: https://vikaleks.onrender.com/
## Возможности

- Просмотр каталога фильмов и карточки отдельного фильма.
- Административное создание, редактирование и удаление фильмов.
- Управление отзывами пользователей.
- Добавление фильмов в избранное.
- Просмотр и редактирование профиля пользователя.
- КИНО Plus: тестовая активация без оплаты, рекомендации, подбор по настроению, подборки и статистика открытий карточек.
- Аутентификация и авторизация через SuperTokens.
- Разграничение прав по ролям `USER` и `ADMIN`.
- Документация REST API через Swagger.
- GraphQL API с ограничением сложности запросов.
- Клиентское кэширование через `ETag`, `Cache-Control` и `304 Not Modified`.
- Серверное in-memory кэширование списка фильмов.
- Загрузка постеров фильмов в Yandex Object Storage через S3-совместимый API.
- Измерение времени обработки запросов через NestJS interceptor.

## Frontend

Frontend-часть проекта реализована без отдельного SPA-фреймворка. Страницы формируются на сервере с помощью Handlebars, а затем отдаются пользователю как готовый HTML.

В интерфейсе реализованы:

- главная страница сайта;
- каталог фильмов;
- карточка фильма;
- формы создания и редактирования фильмов;
- страницы отзывов и формы добавления отзывов;
- страница избранных фильмов пользователя;
- страницы подписок и формы управления тарифами;
- профиль пользователя и форма редактирования профиля;
- страницы входа и регистрации.

Статические файлы расположены в папке `public/`, а шаблоны страниц находятся в папке `views/`.

```text
public/
  css/               стили приложения
  img/               изображения и постеры
  js/                клиентские JavaScript-файлы

views/
  partials/          общие части страниц: header, footer, menu, scripts
  *.hbs              Handlebars-шаблоны страниц
```

Клиентские скрипты используются для улучшения взаимодействия с интерфейсом: отображения уведомлений, работы со списком фильмов, событий фильмов и отзывов. Таким образом, проект можно рассматривать как fullstack-приложение: backend реализует бизнес-логику, API, авторизацию и работу с базой данных, а frontend предоставляет пользователю полноценный веб-интерфейс.

## Технологический стек

- **Runtime:** Node.js 22
- **Framework:** NestJS
- **Language:** TypeScript
- **HTTP platform:** Express
- **Frontend:** Handlebars, HTML, CSS, JavaScript
- **Database:** PostgreSQL
- **ORM:** Prisma ORM
- **Views:** Handlebars
- **REST documentation:** Swagger
- **GraphQL:** Apollo + NestJS GraphQL
- **Auth provider:** SuperTokens
- **Object storage:** Yandex Object Storage
- **Deployment:** Render.com

## Структура проекта

```text
src/
  auth/              MVC и REST аутентификация
  st-auth/           интеграция SuperTokens, guard, middleware и роли
  users/             синхронизация локального пользователя с SuperTokens
  movies/            каталог фильмов, управление фильмами и SSE-события
  reviews/           отзывы пользователей
  favorites/         избранные фильмы пользователя
  profile/           профиль пользователя
  subscriptions/     тарифы подписок и пользовательские подписки
  storage/           интеграция с Yandex Object Storage
  prisma/            Prisma service и подключение к базе данных
  interceptors/      interceptors для времени ответа и ETag/cache
  filters/           общий фильтр обработки ошибок
```

## Переменные окружения

Для локального запуска нужно создать файл `.env`.
```env
PORT=3000

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

SUPERTOKENS_CONNECTION_URI="https://..."
SUPERTOKENS_API_KEY="..."
SUPERTOKENS_APP_NAME="Kino"
SUPERTOKENS_API_DOMAIN="http://localhost:3000"
SUPERTOKENS_WEBSITE_DOMAIN="http://localhost:3000"
SUPERTOKENS_API_BASE_PATH="/auth"
SUPERTOKENS_WEBSITE_BASE_PATH="/auth"

YANDEX_S3_BUCKET="..."
YANDEX_S3_PUBLIC_BASE_URL="https://storage.yandexcloud.net/BUCKET_NAME"
YANDEX_S3_REGION="ru-central1"
YANDEX_S3_ENDPOINT="https://storage.yandexcloud.net"
YANDEX_S3_ACCESS_KEY_ID="..."
YANDEX_S3_SECRET_ACCESS_KEY="..."
```

Проект также использует файл `ca.pem` для SSL-подключения к PostgreSQL.

## Установка

```text
npm install
npx prisma generate
npx prisma migrate deploy
```

История просмотров создается миграцией `20261113000000_plus_history`. Для локального запуска необходимы PostgreSQL и работающий SuperTokens Core. Загрузка постеров требует настроенного S3-совместимого хранилища.

## Локальный запуск

```text
npm run start:dev
```

По умолчанию приложение запускается по адресу:

```text
http://localhost:3000
```

## Доступные интерфейсы

- MVC-страницы: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`
- GraphQL: `http://localhost:3000/graphql`
- SuperTokens auth endpoints: `http://localhost:3000/auth`

## Основные REST endpoints

```text
GET    /api/movies
GET    /api/movies/:id
POST   /api/movies
PATCH  /api/movies/:id
DELETE /api/movies/:id

GET    /api/reviews
POST   /api/reviews
PATCH  /api/reviews/:id
DELETE /api/reviews/:id

GET    /api/favorites
POST   /api/favorites
PATCH  /api/favorites/:id
DELETE /api/favorites/:id

GET    /api/profile
PATCH  /api/profile
DELETE /api/profile

GET    /api/subscriptions
POST   /api/subscriptions/:id/buy
POST   /api/subscriptions/cancel
```

Защищенные маршруты требуют активную SuperTokens-сессию. Административные маршруты требуют роль `ADMIN`.

## GraphQL

GraphQL API поддерживает публичные запросы для фильмов, отзывов и тарифов подписок. Операции с пользовательскими данными требуют авторизацию. Административные мутации требуют роль `ADMIN`.

Пример запроса списка фильмов:

```graphql
query Movies {
  movies(pagination: { page: 1, limit: 10 }) {
    total
    data {
      id
      title
      year
    }
  }
}
```

Пример запроса профиля авторизованного пользователя:

```graphql
query Profile {
  profile {
    id
    email
    name
    role
  }
}
```

## Кэширование

В проекте реализовано два уровня кэширования:

- клиентское кэширование через `ETag` и `Cache-Control`;
- серверное in-memory кэширование через NestJS `CacheModule`.

Если клиент отправляет заголовок `If-None-Match` с актуальным значением `ETag`, сервер может вернуть ответ `304 Not Modified` без повторной отправки полного тела ответа.

## Загрузка файлов

Постеры фильмов загружаются в Yandex Object Storage с использованием AWS SDK for JavaScript и S3-совместимого API. После загрузки URL файла сохраняется в записи фильма.

## 

