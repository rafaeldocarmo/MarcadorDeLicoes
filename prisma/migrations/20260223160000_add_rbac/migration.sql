-- CreateEnum
CREATE TYPE "GlobalRole" AS ENUM ('USER', 'ADMIN_GLOBAL');

-- CreateEnum
CREATE TYPE "TurmaRole" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "globalRole" "GlobalRole" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "Turma" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "TurmaMember" (
    "id" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TurmaRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TurmaMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TurmaMember_userId_idx" ON "TurmaMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TurmaMember_turmaId_userId_key" ON "TurmaMember"("turmaId", "userId");

-- AddForeignKey
ALTER TABLE "TurmaMember" ADD CONSTRAINT "TurmaMember_turmaId_fkey" FOREIGN KEY ("turmaId") REFERENCES "Turma"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TurmaMember" ADD CONSTRAINT "TurmaMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill owners as OWNER members
INSERT INTO "TurmaMember" ("id", "turmaId", "userId", "role", "createdAt", "updatedAt")
SELECT
  CONCAT('owner_', t."id", '_', t."userId") AS "id",
  t."id" AS "turmaId",
  t."userId" AS "userId",
  'OWNER'::"TurmaRole" AS "role",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Turma" t
ON CONFLICT ("turmaId", "userId") DO NOTHING;
