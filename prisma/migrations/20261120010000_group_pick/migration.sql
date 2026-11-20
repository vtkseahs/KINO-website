-- CreateTable
CREATE TABLE "GroupPick" (
    "id" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "movieIds" INTEGER[],
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupVote" (
    "groupId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "movieId" INTEGER NOT NULL,

    CONSTRAINT "GroupVote_pkey" PRIMARY KEY ("groupId","userId")
);

-- CreateIndex
CREATE INDEX "GroupPick_ownerId_expiresAt_idx" ON "GroupPick"("ownerId", "expiresAt");

-- CreateIndex
CREATE INDEX "GroupVote_movieId_idx" ON "GroupVote"("movieId");

-- CreateIndex
CREATE INDEX "GroupVote_userId_idx" ON "GroupVote"("userId");

-- AddForeignKey
ALTER TABLE "GroupPick" ADD CONSTRAINT "GroupPick_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupVote" ADD CONSTRAINT "GroupVote_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupPick"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupVote" ADD CONSTRAINT "GroupVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupVote" ADD CONSTRAINT "GroupVote_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
