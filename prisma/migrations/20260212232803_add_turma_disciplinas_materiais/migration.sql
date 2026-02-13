/*
  Warnings:

  - You are about to drop the column `hashedPassword` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Turma" ADD COLUMN     "disciplinas" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "materiais" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "User" DROP COLUMN "hashedPassword";
