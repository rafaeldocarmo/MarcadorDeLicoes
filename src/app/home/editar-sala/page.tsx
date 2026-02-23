import NovaTurmaForm from "@/components/NovaTurmaForm";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { GlobalRole, TurmaRole } from "@prisma/client";

type SearchParamsInput =
  | Promise<{ turmaId?: string }>
  | { turmaId?: string }
  | undefined;

export default async function EditarSalaPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { globalRole: true },
  });

  if (!actor) {
    redirect("/");
  }

  const resolvedSearchParams = searchParams ? await Promise.resolve(searchParams) : undefined;
  const requestedTurmaId = resolvedSearchParams?.turmaId?.trim() ?? "";

  const turma = await prisma.turma.findFirst({
    where: {
      ...(requestedTurmaId ? { id: requestedTurmaId } : {}),
      ...(actor.globalRole === GlobalRole.ADMIN_GLOBAL
        ? {}
        : {
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
          }),
    },
    include: {
      alunos: {
        orderBy: { nome: "asc" },
        select: { nome: true },
      },
      members: {
        where: {
          role: {
            in: [TurmaRole.EDITOR, TurmaRole.VIEWER],
          },
        },
        select: {
          userId: true,
          role: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  });

  if (!turma) {
    redirect("/home");
  }

  const canManageMembers = turma.ownerId === session.user.id;

  return (
    <NovaTurmaForm
      mode="edit"
      allowManageMembers={canManageMembers}
      initialTurmaId={turma.id}
      initialNome={turma.nome}
      initialAlunos={turma.alunos.map((aluno) => aluno.nome)}
      initialDisciplinas={turma.disciplinas}
      initialMateriais={turma.materiais}
      initialMembers={turma.members.map((member) => ({
        userId: member.userId,
        email: member.user.email,
        role: member.role,
      }))}
    />
  );
}
