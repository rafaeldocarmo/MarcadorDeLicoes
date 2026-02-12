import { prisma } from "@/lib/prisma";
import MarcarEntregaPorAluno from "./MarcarEntregaPorAluno";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function LicaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const { id } = await params;

  if (!id) notFound();

  const licao = await prisma.licao.findFirst({
    where: {
      id,
      turma: {
        userId: session.user.id,
      },
    },
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
      aluno: {
        turma: {
          userId: session.user.id,
        },
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
