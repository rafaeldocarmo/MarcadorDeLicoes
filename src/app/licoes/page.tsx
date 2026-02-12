import NovaLicaoForm from "./novaLicaoForm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function Page() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/")
  }

  const totalLicoes = await prisma.licao.count({
    where: {
      turma: {
        userId: session.user.id,
      },
    },
  })

  return <NovaLicaoForm hasLicoes={totalLicoes > 0} />;
}
