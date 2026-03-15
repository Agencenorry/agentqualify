import { DashboardAuth } from "@/components/dashboard-auth";
import { Sidebar } from "@/components/sidebar";

export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardAuth>
      <div className="flex min-h-screen bg-zinc-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </DashboardAuth>
  );
}
