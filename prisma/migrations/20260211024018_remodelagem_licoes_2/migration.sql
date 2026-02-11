/*
  Warnings:

  - You are about to drop the `Entrega` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Entrega" DROP CONSTRAINT "Entrega_alunoId_fkey";

-- DropForeignKey
ALTER TABLE "Entrega" DROP CONSTRAINT "Entrega_licaoId_fkey";

-- DropTable
DROP TABLE "Entrega";

-- CreateTable
CREATE TABLE "EntregaSubLicao" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "subLicaoId" TEXT NOT NULL,
    "status" "StatusEntrega" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntregaSubLicao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EntregaSubLicao_alunoId_subLicaoId_key" ON "EntregaSubLicao"("alunoId", "subLicaoId");

-- AddForeignKey
ALTER TABLE "EntregaSubLicao" ADD CONSTRAINT "EntregaSubLicao_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntregaSubLicao" ADD CONSTRAINT "EntregaSubLicao_subLicaoId_fkey" FOREIGN KEY ("subLicaoId") REFERENCES "SubLicao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
