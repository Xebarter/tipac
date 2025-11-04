import { ReactNode } from "react";
import Sidebar from "./components/Sidebar";
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
    <div className="flex min-h-screen bg-gray-50">
      {isAuthenticated ? (
        <div className="fixed w-64 h-full bg-white shadow-md">
          <Sidebar />
        </div>
      ) : null}
      <div className={isAuthenticated ? "ml-64 flex-1" : "flex-1"}>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}