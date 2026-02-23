import { prisma } from "@/lib/prisma";
import AlunoAnalyticsClient from "./AlunoAnalyticsClient";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { GlobalRole } from "@prisma/client";

type Props = {
  turmaId?: string;
};

export default async function AlunoAnalyticsSection({ turmaId }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return <AlunoAnalyticsClient alunos={[]} />;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true },
  });

  if (!user) {
    return <AlunoAnalyticsClient alunos={[]} />;
  }

  const turmaWhere = turmaId
    ? user.globalRole === GlobalRole.ADMIN_GLOBAL
      ? { id: turmaId }
      : {
          id: turmaId,
          OR: [
            { ownerId: session.user.id },
            {
              members: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          ],
        }
    : {
        OR: [
          { ownerId: session.user.id },
          {
            members: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      };

  const alunos = await prisma.aluno.findMany({
    where: {
      turma: turmaWhere,
    },
    select: {
      id: true,
      nome: true,
    },
    orderBy: {
      nome: "asc",
    },
  });

  return <AlunoAnalyticsClient alunos={alunos} />;
}
