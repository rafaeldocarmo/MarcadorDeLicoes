"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

type Status = "FEZ" | "NAO_FEZ";

type EntregaPayload = {
  alunoId: string;
  subLicaoId: string;
  status: Status;
};

export async function salvarEntregas(
  entregas: EntregaPayload[],
  licaoId: string
) {
  // Buscar alunos válidos e tipar o map
  const alunos = await prisma.aluno.findMany({ select: { id: true } });
  const alunosValidos = new Set<string>(
    alunos.map((a: { id: string }) => a.id)
  );

  // Buscar sublições válidas e tipar o map
  const subLicoes = await prisma.subLicao.findMany({ select: { id: true } });
  const subLicoesValidas = new Set<string>(
    subLicoes.map((s: { id: string }) => s.id)
  );

  // Filtrar entregas inválidas
  const entregasFiltradas = entregas.filter(
    (e: EntregaPayload) =>
      alunosValidos.has(e.alunoId) && subLicoesValidas.has(e.subLicaoId)
  );

  if (!entregasFiltradas.length) return;

  // Map para upsert com tipagem explícita
  await prisma.$transaction(
    entregasFiltradas.map((entrega: EntregaPayload) =>
      prisma.entregaSubLicao.upsert({
        where: {
          alunoId_subLicaoId: {
            alunoId: entrega.alunoId,
            subLicaoId: entrega.subLicaoId,
          },
        },
        update: { status: entrega.status },
        create: {
          alunoId: entrega.alunoId,
          subLicaoId: entrega.subLicaoId,
          status: entrega.status,
        },
      })
    )
  );

  revalidatePath(`/licoes/${licaoId}`);
}
