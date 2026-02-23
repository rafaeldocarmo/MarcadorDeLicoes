import { NextResponse } from "next/server";
import { TurmaRole } from "@prisma/client";
import { ApiError, errorResponse, requireAuthenticatedActor } from "@/lib/api-auth";
import { assertTurmaPermission, canAssignTurmaRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

type AddMemberPayload = {
  email?: string;
  role?: TurmaRole;
};

type RemoveMemberPayload = {
  userId?: string;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAuthenticatedActor();
    const { id: turmaId } = await params;

    if (!turmaId) {
      throw new ApiError("Dados inválidos", 400);
    }

    await assertTurmaPermission(actor, turmaId, "MANAGE_MEMBERS", {
      allowGlobalAdminOverride: false,
    });

    const members = await prisma.turmaMember.findMany({
      where: {
        turmaId,
        role: { in: [TurmaRole.EDITOR, TurmaRole.VIEWER] },
      },
      select: {
        userId: true,
        role: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        user: {
          email: "asc",
        },
      },
    });

    return NextResponse.json(
      members.map((member) => ({
        userId: member.userId,
        email: member.user.email,
        name: member.user.name,
        role: member.role,
      }))
    );
  } catch (error) {
    return errorResponse(error, "Erro ao listar membros");
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAuthenticatedActor();
    const { id: turmaId } = await params;
    const body = (await req.json()) as AddMemberPayload;

    const email = body.email?.trim().toLowerCase() ?? "";
    const role = body.role;

    if (!turmaId || !email || !role) {
      throw new ApiError("Dados inválidos", 400);
    }

    if (!canAssignTurmaRole(role)) {
      throw new ApiError("Role inválida para membro", 400);
    }

    await assertTurmaPermission(actor, turmaId, "MANAGE_MEMBERS", {
      allowGlobalAdminOverride: false,
    });

    const [targetUser, turma] = await Promise.all([
      prisma.user.findUnique({
        where: { email },
        select: { id: true },
      }),
      prisma.turma.findUnique({
        where: { id: turmaId },
        select: { ownerId: true },
      }),
    ]);

    if (!targetUser) {
      throw new ApiError("Usuário não encontrado", 404);
    }

    if (!turma) {
      throw new ApiError("Turma não encontrada", 404);
    }

    if (targetUser.id === turma.ownerId) {
      throw new ApiError("O criador da turma já possui permissão OWNER", 400);
    }

    const member = await prisma.turmaMember.upsert({
      where: {
        turmaId_userId: {
          turmaId,
          userId: targetUser.id,
        },
      },
      update: { role },
      create: {
        turmaId,
        userId: targetUser.id,
        role,
      },
      select: {
        id: true,
        role: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    return errorResponse(error, "Erro ao adicionar membro");
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await requireAuthenticatedActor();
    const { id: turmaId } = await params;
    const body = (await req.json()) as RemoveMemberPayload;
    const userId = body.userId?.trim() ?? "";

    if (!turmaId || !userId) {
      throw new ApiError("Dados inválidos", 400);
    }

    await assertTurmaPermission(actor, turmaId, "MANAGE_MEMBERS", {
      allowGlobalAdminOverride: false,
    });

    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      select: { ownerId: true },
    });

    if (!turma) {
      throw new ApiError("Turma não encontrada", 404);
    }

    if (userId === turma.ownerId) {
      throw new ApiError("Não é permitido remover o OWNER da turma", 400);
    }

    const deleted = await prisma.turmaMember.deleteMany({
      where: {
        turmaId,
        userId,
      },
    });

    if (deleted.count === 0) {
      throw new ApiError("Membro não encontrado na turma", 404);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Erro ao remover membro");
  }
}
