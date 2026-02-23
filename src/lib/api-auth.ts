import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GlobalRole } from "@prisma/client";

export type AuthenticatedActor = {
  id: string;
  globalRole: GlobalRole;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requireAuthenticatedActor(): Promise<AuthenticatedActor> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new ApiError("Não autorizado", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, globalRole: true },
  });

  if (!user) {
    throw new ApiError("Não autorizado", 401);
  }

  return user;
}

export function errorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
