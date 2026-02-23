import { NextResponse } from "next/server";
import { GlobalRole, TurmaRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, errorResponse, requireAuthenticatedActor } from "@/lib/api-auth";
import { assertTurmaPermission, getFirstTurmaForPermission } from "@/lib/rbac";

type TurmaPayload = {
  turmaId?: string;
  nome?: string;
  alunos?: string[];
  disciplinas?: string[];
  materiais?: string[];
};

function normalizeList(values: string[] = []) {
  return Array.from(new Set(values.map((item) => item.trim()).filter((item) => item.length > 0)));
}

export async function GET() {
  try {
    const actor = await requireAuthenticatedActor();

    const turmas = await prisma.turma.findMany({
      where:
        actor.globalRole === GlobalRole.ADMIN_GLOBAL
          ? {}
          : {
              OR: [
                { ownerId: actor.id },
                {
                  members: {
                    some: {
                      userId: actor.id,
                    },
                  },
                },
              ],
            },
      select: {
        id: true,
        nome: true,
        ownerId: true,
        members: {
          where: { userId: actor.id },
          select: { role: true },
          take: 1,
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json(
      turmas.map((turma) => ({
        id: turma.id,
        nome: turma.nome,
        role:
          actor.globalRole === GlobalRole.ADMIN_GLOBAL
            ? "ADMIN_GLOBAL"
            : turma.ownerId === actor.id
              ? TurmaRole.OWNER
              : (turma.members[0]?.role ?? TurmaRole.VIEWER),
      }))
    );
  } catch (error) {
    return errorResponse(error, "Erro ao listar turmas");
  }
}

export async function POST(req: Request) {
  try {
    const actor = await requireAuthenticatedActor();
    const body = (await req.json()) as TurmaPayload;

    const nome = body.nome?.trim() ?? "";
    const alunos = normalizeList(body.alunos);
    const disciplinas = normalizeList(body.disciplinas);
    const materiais = normalizeList(body.materiais);

    if (!nome || !alunos.length || !disciplinas.length || !materiais.length) {
      throw new ApiError("Dados inválidos", 400);
    }

    const turma = await prisma.turma.create({
      data: {
        nome,
        ownerId: actor.id,
        disciplinas,
        materiais,
        members: {
          create: {
            userId: actor.id,
            role: TurmaRole.OWNER,
          },
        },
        alunos: {
          create: alunos.map((nomeAluno) => ({ nome: nomeAluno })),
        },
      },
      include: {
        alunos: true,
      },
    });

    return NextResponse.json(turma);
  } catch (error) {
    return errorResponse(error, "Erro ao criar turma");
  }
}

export async function PUT(req: Request) {
  try {
    const actor = await requireAuthenticatedActor();
    const body = (await req.json()) as TurmaPayload;

    const nome = body.nome?.trim() ?? "";
    const alunos = normalizeList(body.alunos);
    const disciplinas = normalizeList(body.disciplinas);
    const materiais = normalizeList(body.materiais);

    if (!nome || !alunos.length || !disciplinas.length || !materiais.length) {
      throw new ApiError("Dados inválidos", 400);
    }

    const requestedTurmaId = body.turmaId?.trim() ?? "";
    let turmaId = requestedTurmaId;

    if (turmaId) {
      await assertTurmaPermission(actor, turmaId, "EDIT_TURMA");
    } else {
      const turmaPadrao = await getFirstTurmaForPermission(actor, "EDIT_TURMA");
      if (!turmaPadrao) {
        throw new ApiError("Turma não encontrada", 404);
      }
      turmaId = turmaPadrao.id;
    }

    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: { alunos: { select: { nome: true } } },
    });

    if (!turma) {
      throw new ApiError("Turma não encontrada", 404);
    }

    const nomesAtuais = new Set(turma.alunos.map((aluno) => aluno.nome));
    const alunosParaCriar = alunos.filter((nomeAluno) => !nomesAtuais.has(nomeAluno));

    const turmaAtualizada = await prisma.turma.update({
      where: { id: turma.id },
      data: {
        nome,
        disciplinas,
        materiais,
        alunos: {
          create: alunosParaCriar.map((nomeAluno) => ({ nome: nomeAluno })),
        },
      },
      include: { alunos: true },
    });

    return NextResponse.json(turmaAtualizada);
  } catch (error) {
    return errorResponse(error, "Erro ao atualizar turma");
  }
}
