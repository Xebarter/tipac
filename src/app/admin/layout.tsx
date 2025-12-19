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
  
  // If no session cookie, don't show the header
  const isAuthenticated = !!sessionCookie;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {isAuthenticated ? (
        <Header />
      ) : null}
      <div className="flex-1">
        <div className="p-4 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}