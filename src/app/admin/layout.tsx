import { ReactNode } from "react";
import Header from "./components/Header";
import { cookies } from "next/headers";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session");
  
  // If no session cookie, don't show the sidebar
  const isAuthenticated = !!sessionCookie;

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated ? (
        <Header />
      ) : null}
      <div className="flex-1">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}