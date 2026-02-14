import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type SubLicaoInput = {
  disciplina: string;
  material: string;
  descricao: string;
};

type NovaLicaoPayload = {
  dataEnvio: string;
  dataEntrega: string;
  subLicoes: SubLicaoInput[];
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = (await req.json()) as Partial<NovaLicaoPayload>;
    const dataEnvio = body.dataEnvio;
    const dataEntrega = body.dataEntrega;
    const subLicoes = (body.subLicoes ?? []).filter(
      (sub) =>
        sub.disciplina?.trim() &&
        sub.material?.trim() &&
        sub.descricao?.trim()
    );

    if (!dataEnvio || !dataEntrega || subLicoes.length === 0) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const turma = await prisma.turma.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!turma) {
      return NextResponse.json(
        { error: "Nenhuma turma encontrada para este usuario" },
        { status: 400 }
      );
    }

    const licao = await prisma.licao.create({
      data: {
        dataEnvio: new Date(dataEnvio),
        dataEntrega: new Date(dataEntrega),
        turmaId: turma.id,
        subLicoes: {
          create: subLicoes,
        },
      },
      include: {
        subLicoes: {
          select: { id: true },
        },
      },
    });

    const alunos = await prisma.aluno.findMany({
      where: { turmaId: turma.id },
      select: { id: true },
    });

    if (alunos.length > 0 && licao.subLicoes.length > 0) {
      await prisma.entregaSubLicao.createMany({
        data: licao.subLicoes.flatMap((sub) =>
          alunos.map((aluno) => ({
            alunoId: aluno.id,
            subLicaoId: sub.id,
            status: "NAO_FEZ" as const,
          }))
        ),
      });
    }

    return NextResponse.json({ id: licao.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar lição" }, { status: 500 });
  }
}

