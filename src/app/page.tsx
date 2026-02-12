import LoginBtn from "@/components/LoginBtn";

export const dynamic = "force-dynamic";

export default async function HomePage() {


  return (
    <div className="min-h-screen bg-muted/40 p-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <LoginBtn />
      </div>
    </div>
  );
}
