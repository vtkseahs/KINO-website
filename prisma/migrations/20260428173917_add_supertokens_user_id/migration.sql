/*
  Warnings:

  - A unique constraint covering the columns `[superTokensUserId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "superTokensUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_superTokensUserId_key" ON "User"("superTokensUserId");
