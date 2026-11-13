CREATE TABLE "DiscussionPost" (
  "id" SERIAL NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" INTEGER NOT NULL,
  "movieId" INTEGER NOT NULL,
  "parentId" INTEGER,
  CONSTRAINT "DiscussionPost_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DiscussionPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DiscussionPost_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DiscussionPost_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "DiscussionLike" (
  "userId" INTEGER NOT NULL,
  "postId" INTEGER NOT NULL,
  CONSTRAINT "DiscussionLike_pkey" PRIMARY KEY ("userId", "postId"),
  CONSTRAINT "DiscussionLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DiscussionLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "DiscussionPost"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "DiscussionPost_movieId_createdAt_idx" ON "DiscussionPost"("movieId", "createdAt");
CREATE INDEX "DiscussionPost_parentId_idx" ON "DiscussionPost"("parentId");
