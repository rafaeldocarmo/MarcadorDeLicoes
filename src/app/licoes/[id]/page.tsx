import { prisma } from "@/lib/prisma";
import MarcarEntregaPorAluno from "./MarcarEntregaPorAluno";
import { notFound } from "next/navigation";

export default async function LicaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) notFound();

  const licao = await prisma.licao.findUnique({
    where: { id },
    include: {
      subLicoes: true,
      turma: {
        include: {
          alunos: true,
        },
      },
    },
  });

  if (!licao) notFound();

  const entregas = await prisma.entregaSubLicao.findMany({
    where: {
      subLicao: {
        licaoId: id,
      },
    },
  });

  return (
    <MarcarEntregaPorAluno
      licao={licao}
      entregas={entregas}
    />
  );
}
