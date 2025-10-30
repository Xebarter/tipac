"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  
  const navigation = [
    { name: "Dashboard", href: "/admin" },
    { name: "Messages", href: "/admin/messages" },
    { name: "Gallery", href: "/admin/gallery" },
    { name: "Events", href: "/admin/events" },
    { name: "Tickets", href: "/admin/tickets" },
  ];

  return (
    <div className="flex flex-col w-64 bg-white shadow-md h-full">
      <div className="flex items-center justify-center h-16 border-b">
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="px-4 py-6">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`block px-4 py-3 rounded-lg transition-colors ${
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="p-4 border-t">
        <button 
          onClick={() => {
            localStorage.removeItem("admin_token");
            window.location.href = "/";
          }}
          className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}