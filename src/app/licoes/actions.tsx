"use server";

import { prisma } from "@/lib/prisma";

type SubLicaoInput = {
  disciplina: string;
  material: string;
  descricao: string;
};

type EntregaInput = {
  alunoId: string;
  subLicaoId: string;
  status: "FEZ" | "NAO_FEZ";
};

export async function criarLicao(data: {
  titulo: string;
  dataEnvio: string;
  dataEntrega: string;
  turmaId: string;
  subLicoes: SubLicaoInput[];
}) {
  // Criar lição com sublições
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

  // Buscar alunos e tipar map
  const alunos = await prisma.aluno.findMany({
    where: { turmaId: data.turmaId },
    select: { id: true },
  });

  // Criar entregas e tipar flatMap/map
  const entregas: EntregaInput[] = licao.subLicoes.flatMap((sub) =>
    alunos.map((aluno: { id: string }): EntregaInput => ({
      alunoId: aluno.id,
      subLicaoId: sub.id,
      status: "NAO_FEZ",
    }))
  );

  // Criar todas as entregas dentro de uma transação
  await prisma.$transaction(
    entregas.map((entrega: EntregaInput) =>
      prisma.entregaSubLicao.create({ data: entrega })
    )
  );

  return licao;
}
