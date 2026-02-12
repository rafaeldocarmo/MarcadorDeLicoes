import AlunoAnalyticsSection from "@/components/AlunoAnalyticsSection";
import LicoesList from "@/components/LicoesList";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function HomePage() {

    const session = await getServerSession(authOptions)

    if(!session) redirect('/')


  return (
    <div className="min-h-screen bg-muted/40 p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <h1 className="text-4xl font-bold">Dashboard</h1>

        <Dashboard />

        <AlunoAnalyticsSection />

        <LicoesList />
      </div>
    </div>
  );
}
