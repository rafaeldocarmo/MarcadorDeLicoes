import NovaTurmaForm from "@/components/NovaTurmaForm";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function EditarSalaPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  const turma = await prisma.turma.findFirst({
    where: { userId: session.user.id },
    include: {
      alunos: {
        orderBy: { nome: "asc" },
        select: { nome: true },
      },
    },
  });

  if (!turma) {
    redirect("/home");
  }

  return (
    <NovaTurmaForm
      mode="edit"
      initialNome={turma.nome}
      initialAlunos={turma.alunos.map((aluno) => aluno.nome)}
      initialDisciplinas={turma.disciplinas}
      initialMateriais={turma.materiais}
    />
  );
}
