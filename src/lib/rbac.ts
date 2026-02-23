import { prisma } from "@/lib/prisma";
import { GlobalRole, Prisma, TurmaRole } from "@prisma/client";
import { ApiError, AuthenticatedActor } from "@/lib/api-auth";

export type TurmaPermission = "VIEW_TURMA" | "EDIT_TURMA" | "MANAGE_MEMBERS";

const ROLES_BY_PERMISSION: Record<TurmaPermission, TurmaRole[]> = {
  VIEW_TURMA: [TurmaRole.OWNER, TurmaRole.EDITOR, TurmaRole.VIEWER],
  EDIT_TURMA: [TurmaRole.OWNER, TurmaRole.EDITOR],
  MANAGE_MEMBERS: [TurmaRole.OWNER],
};

type PermissionOptions = {
  allowGlobalAdminOverride?: boolean;
};

export function turmaWhereByPermission(
  actor: AuthenticatedActor,
  permission: TurmaPermission,
  options: PermissionOptions = {}
): Prisma.TurmaWhereInput {
  const allowGlobalAdminOverride = options.allowGlobalAdminOverride ?? true;

  if (allowGlobalAdminOverride && actor.globalRole === GlobalRole.ADMIN_GLOBAL) {
    return {};
  }

  const allowedRoles = ROLES_BY_PERMISSION[permission];

  return {
    OR: [
      { ownerId: actor.id },
      {
        members: {
          some: {
            userId: actor.id,
            role: { in: allowedRoles },
          },
        },
      },
    ],
  };
}

export async function assertTurmaPermission(
  actor: AuthenticatedActor,
  turmaId: string,
  permission: TurmaPermission,
  options: PermissionOptions = {}
) {
  const turma = await prisma.turma.findFirst({
    where: {
      id: turmaId,
      ...turmaWhereByPermission(actor, permission, options),
    },
    select: { id: true },
  });

  if (!turma) {
    throw new ApiError("Turma não encontrada ou sem acesso", 403);
  }
}

export async function getFirstTurmaForPermission(
  actor: AuthenticatedActor,
  permission: TurmaPermission
) {
  return prisma.turma.findFirst({
    where: turmaWhereByPermission(actor, permission),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      nome: true,
      disciplinas: true,
      materiais: true,
    },
  });
}

export function canAssignTurmaRole(role: TurmaRole) {
  return role === TurmaRole.EDITOR || role === TurmaRole.VIEWER;
}
