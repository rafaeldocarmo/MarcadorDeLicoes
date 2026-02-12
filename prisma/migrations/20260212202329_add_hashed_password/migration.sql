-- DropIndex
DROP INDEX "Turma_userId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hashedPassword" TEXT;
