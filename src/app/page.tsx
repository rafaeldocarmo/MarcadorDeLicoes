import AlunoAnalyticsSection from "@/components/AlunoAnalyticsSection";
import LicoesList from "@/components/LicoesList";
import DashboardServer from "./(dashboard)/page";

export const dynamic = "force-dynamic";

export default async function HomePage() {


  return (
    <div className="min-h-screen bg-muted/40 p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <h1 className="text-4xl font-bold">Dashboard</h1>

        <DashboardServer />

        <AlunoAnalyticsSection />

        <LicoesList />
      </div>
    </div>
  );
}
