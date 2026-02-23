import NovaTurmaForm from "@/components/NovaTurmaForm";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function CriarSalaPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/");
  }

  return <NovaTurmaForm mode="create" />;
}
