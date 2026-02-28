import type { ReactNode } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import { cookies } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  const isAuthenticated = !!sessionCookie;

  if (!isAuthenticated) {
    // Unauthenticated: render children without any shell (login page handles its own UI)
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[hsl(220,20%,97%)]">
      {/* Persistent sidebar on lg+ */}
      <Sidebar />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile header — hidden on lg+ via CSS inside the component */}
        <Header />

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}