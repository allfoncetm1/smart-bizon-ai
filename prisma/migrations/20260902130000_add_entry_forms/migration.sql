-- CreateTable
CREATE TABLE "EntryForm" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bizonRoomUrl" TEXT NOT NULL,
    "title" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntryForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EntryForm_slug_key" ON "EntryForm"("slug");

-- CreateIndex
CREATE INDEX "EntryForm_userId_idx" ON "EntryForm"("userId");

-- AddForeignKey
ALTER TABLE "EntryForm" ADD CONSTRAINT "EntryForm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
