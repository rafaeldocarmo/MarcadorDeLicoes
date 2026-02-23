import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse, requireAuthenticatedActor } from "@/lib/api-auth";
import { assertTurmaPermission, getFirstTurmaForPermission } from "@/lib/rbac";

type LicaoWhereInput = NonNullable<
  NonNullable<Parameters<typeof prisma.licao.findMany>[0]>["where"]
>;

export async function GET(req: NextRequest) {
  try {
    const actor = await requireAuthenticatedActor();

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, parseInt(url.searchParams.get("pageSize") || "5", 10));
    const disciplina = url.searchParams.get("disciplina");
    const material = url.searchParams.get("material");
    const turmaIdParam = url.searchParams.get("turmaId")?.trim() ?? "";

    let turmaId = turmaIdParam;
    let turmaMeta: { disciplinas: string[]; materiais: string[] } | null = null;

    if (turmaId) {
      await assertTurmaPermission(actor, turmaId, "VIEW_TURMA");

      turmaMeta = await prisma.turma.findUnique({
        where: { id: turmaId },
        select: { disciplinas: true, materiais: true },
      });
    } else {
      const turma = await getFirstTurmaForPermission(actor, "VIEW_TURMA");
      if (turma) {
        turmaId = turma.id;
        turmaMeta = {
          disciplinas: turma.disciplinas,
          materiais: turma.materiais,
        };
      }
    }

    if (!turmaId) {
      return NextResponse.json({
        items: [],
        totalPages: 0,
        disciplinasDisponiveis: [],
        materiaisDisponiveis: [],
      });
    }

    const where: LicaoWhereInput = {
      turmaId,
    };

    if (disciplina || material) {
      where.subLicoes = {
        some: {
          ...(disciplina ? { disciplina } : {}),
          ...(material ? { material } : {}),
        },
      };
    }

    const total = await prisma.licao.count({ where });
    const items = await prisma.licao.findMany({
      where,
      include: { subLicoes: true },
      orderBy: { dataEnvio: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      items,
      totalPages: Math.ceil(total / pageSize),
      disciplinasDisponiveis: turmaMeta?.disciplinas ?? [],
      materiaisDisponiveis: turmaMeta?.materiais ?? [],
    });
  } catch (error) {
    return errorResponse(error, "Erro ao buscar lições");
  }
}
