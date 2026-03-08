import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto bg-background pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
