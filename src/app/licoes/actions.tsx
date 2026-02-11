"use server";

import { prisma } from "@/lib/prisma";

type SubLicaoInput = {
    disciplina: string;
    material: string;
    descricao: string;
};

export async function criarLicao(data: {
  titulo: string;
  dataEnvio: string;
  dataEntrega: string;
  turmaId: string;
  subLicoes: SubLicaoInput[];
}) {
  // Criar lição
  const licao = await prisma.licao.create({
    data: {
      titulo: data.titulo,
      dataEnvio: new Date(data.dataEnvio),
      dataEntrega: new Date(data.dataEntrega),
      turmaId: data.turmaId,
      subLicoes: {
        create: data.subLicoes,
      },
    },
    include: {
      subLicoes: true,
    },
  });

  // Buscar alunos
  const alunos = await prisma.aluno.findMany({
    where: { turmaId: data.turmaId },
    select: { id: true },
  });

  // Criar entregas
  const entregas = licao.subLicoes.flatMap((sub) =>
    alunos.map((aluno) => ({
      alunoId: aluno.id,
      subLicaoId: sub.id,
      status: "NAO_FEZ" as const,
    }))
  );

  // Criar todas as entregas dentro de uma transação (array)
  await prisma.$transaction(
    entregas.map((entrega) => prisma.entregaSubLicao.create({ data: entrega }))
  );

  return licao;
}

