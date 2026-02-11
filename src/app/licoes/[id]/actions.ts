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
  // Buscar alunos e sublições válidos
  const alunosValidos = new Set(
    (await prisma.aluno.findMany({ select: { id: true } })).map((a) => a.id)
  );

  const subLicoesValidas = new Set(
    (await prisma.subLicao.findMany({ select: { id: true } })).map((s) => s.id)
  );

  // Filtrar entregas inválidas
  const entregasFiltradas = entregas.filter(
    (e) => alunosValidos.has(e.alunoId) && subLicoesValidas.has(e.subLicaoId)
  );

  // Se não houver entregas válidas, apenas retorna
  if (!entregasFiltradas.length) return;

  await prisma.$transaction(
    entregasFiltradas.map((entrega) =>
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

