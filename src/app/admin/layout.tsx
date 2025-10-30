import { ReactNode } from "react";
import { Sidebar } from "./components/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="fixed w-64 h-full bg-white shadow-md">
        <Sidebar />
      </div>
      <div className="ml-64 flex-1">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}