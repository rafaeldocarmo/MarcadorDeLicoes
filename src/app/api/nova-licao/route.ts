import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { errorResponse, requireAuthenticatedActor, ApiError } from "@/lib/api-auth";
import { assertTurmaPermission, getFirstTurmaForPermission } from "@/lib/rbac";

type SubLicaoInput = {
  disciplina: string;
  material: string;
  descricao: string;
};

type NovaLicaoPayload = {
  turmaId?: string;
  dataEnvio: string;
  dataEntrega: string;
  subLicoes: SubLicaoInput[];
};

export async function POST(req: Request) {
  try {
    const actor = await requireAuthenticatedActor();

    const body = (await req.json()) as Partial<NovaLicaoPayload>;
    const dataEnvio = body.dataEnvio;
    const dataEntrega = body.dataEntrega;
    const turmaIdParam = body.turmaId?.trim() ?? "";
    const subLicoes = (body.subLicoes ?? []).filter(
      (sub) => sub.disciplina?.trim() && sub.material?.trim() && sub.descricao?.trim()
    );

    if (!dataEnvio || !dataEntrega || subLicoes.length === 0) {
      throw new ApiError("Dados inválidos", 400);
    }

    let turmaId = turmaIdParam;

    if (turmaId) {
      await assertTurmaPermission(actor, turmaId, "EDIT_TURMA");
    } else {
      const turma = await getFirstTurmaForPermission(actor, "EDIT_TURMA");
      if (!turma) {
        throw new ApiError("Nenhuma turma encontrada para este usuário", 400);
      }
      turmaId = turma.id;
    }

    const licao = await prisma.licao.create({
      data: {
        dataEnvio: new Date(dataEnvio),
        dataEntrega: new Date(dataEntrega),
        turmaId,
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
      where: { turmaId },
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
    return errorResponse(error, "Erro ao criar lição");
  }
}
