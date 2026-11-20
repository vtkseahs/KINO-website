-- CreateEnum
CREATE TYPE "ActivationResult" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "JournalStatus" AS ENUM ('WANT', 'WATCHING', 'WATCHED', 'DROPPED', 'REWATCH', 'DISMISSED');

-- CreateEnum
CREATE TYPE "InterestKind" AS ENUM ('ACTOR', 'DIRECTOR', 'FRANCHISE', 'GENRE', 'PREMIERE');

-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "actors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "directors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "franchise" TEXT,
ADD COLUMN     "premiereOn" DATE,
ADD COLUMN     "unusual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "watchLinks" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "PlusAccess" (
    "userId" INTEGER NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "lastResult" "ActivationResult" NOT NULL,

    CONSTRAINT "PlusAccess_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "userId" INTEGER NOT NULL,
    "movieId" INTEGER NOT NULL,
    "status" "JournalStatus" NOT NULL,
    "watchedOn" DATE,
    "notes" TEXT NOT NULL DEFAULT '',
    "impression" TEXT NOT NULL DEFAULT '',
    "company" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("userId","movieId")
);

-- CreateTable
CREATE TABLE "MovieInterest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "kind" "InterestKind" NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seenAt" TIMESTAMP(3),

    CONSTRAINT "MovieInterest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JournalEntry_movieId_idx" ON "JournalEntry"("movieId");

-- CreateIndex
CREATE UNIQUE INDEX "MovieInterest_userId_kind_value_key" ON "MovieInterest"("userId", "kind", "value");

-- AddForeignKey
ALTER TABLE "PlusAccess" ADD CONSTRAINT "PlusAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovieInterest" ADD CONSTRAINT "MovieInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Сохранить действующий доступ пользователей старого демотарифа.
INSERT INTO "PlusAccess" ("userId", "activatedAt", "endsAt", "lastResult")
SELECT u.id, NULL, u."subscriptionEndsAt", 'SUCCESS'
FROM "User" u
JOIN "SubscriptionPlan" p ON p.id = u."subscriptionPlanId"
WHERE p.title = 'КИНО Plus' AND u."subscriptionEndsAt" > CURRENT_TIMESTAMP;

-- Справочник для пустой БД. Существующие жанры остаются доступными.
INSERT INTO "Genre" ("name")
SELECT name FROM (VALUES ('Комедия'), ('Драма'), ('Фантастика'), ('мультфильм'),
  ('боевик'), ('Приключения'), ('Семейный'), ('Триллер'), ('Документальный')) AS genre(name)
WHERE NOT EXISTS (SELECT 1 FROM "Genre" g WHERE lower(trim(g.name)) = lower(genre.name))
ON CONFLICT DO NOTHING;
