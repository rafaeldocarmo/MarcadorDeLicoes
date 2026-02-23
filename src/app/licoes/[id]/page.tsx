import { prisma } from "@/lib/prisma";
import MarcarEntregaPorAluno from "./MarcarEntregaPorAluno";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GlobalRole, TurmaRole } from "@prisma/client";

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

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true },
  });

  if (!actor) {
    redirect("/");
  }

  const turmaScopeWhere =
    actor.globalRole === GlobalRole.ADMIN_GLOBAL
      ? {}
      : {
          OR: [
            { ownerId: session.user.id },
            {
              members: {
                some: {
                  userId: session.user.id,
                  role: {
                    in: [TurmaRole.OWNER, TurmaRole.EDITOR, TurmaRole.VIEWER],
                  },
                },
              },
            },
          ],
        };

  const licao = await prisma.licao.findFirst({
    where: {
      id,
      turma: turmaScopeWhere,
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
        turma: turmaScopeWhere,
      },
    },
  });

  const canEditLicao =
    actor.globalRole === GlobalRole.ADMIN_GLOBAL ||
    Boolean(
      await prisma.licao.findFirst({
        where: {
          id,
          turma: {
            OR: [
              { ownerId: session.user.id },
              {
                members: {
                  some: {
                    userId: session.user.id,
                    role: {
                      in: [TurmaRole.OWNER, TurmaRole.EDITOR],
                    },
                  },
                },
              },
            ],
          },
        },
        select: { id: true },
      })
    );

  return <MarcarEntregaPorAluno licao={licao} entregas={entregas} canEditLicao={canEditLicao} />;
}
