/*
  Warnings:

  - You are about to drop the column `disciplina` on the `Licao` table. All the data in the column will be lost.
  - You are about to drop the column `nome` on the `Licao` table. All the data in the column will be lost.
  - You are about to drop the `Questao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Resposta` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `dataEntrega` to the `Licao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dataEnvio` to the `Licao` table without a default value. This is not possible if the table is not empty.
  - Added the required column `titulo` to the `Licao` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusEntrega" AS ENUM ('FEZ', 'NAO_FEZ');

-- DropForeignKey
ALTER TABLE "Questao" DROP CONSTRAINT "Questao_licaoId_fkey";

-- DropForeignKey
ALTER TABLE "Resposta" DROP CONSTRAINT "Resposta_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "Resposta" DROP CONSTRAINT "Resposta_questaoId_fkey";

-- AlterTable
ALTER TABLE "Licao" DROP COLUMN "disciplina",
DROP COLUMN "nome",
ADD COLUMN     "dataEntrega" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "dataEnvio" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "titulo" TEXT NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "Questao";

-- DropTable
DROP TABLE "Resposta";

-- DropEnum
DROP TYPE "StatusResposta";

-- CreateTable
CREATE TABLE "SubLicao" (
    "id" TEXT NOT NULL,
    "disciplina" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "licaoId" TEXT NOT NULL,

    CONSTRAINT "SubLicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrega" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "licaoId" TEXT NOT NULL,
    "status" "StatusEntrega" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entrega_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entrega_alunoId_licaoId_key" ON "Entrega"("alunoId", "licaoId");

-- AddForeignKey
ALTER TABLE "SubLicao" ADD CONSTRAINT "SubLicao_licaoId_fkey" FOREIGN KEY ("licaoId") REFERENCES "Licao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrega" ADD CONSTRAINT "Entrega_licaoId_fkey" FOREIGN KEY ("licaoId") REFERENCES "Licao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
