"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: "Dashboard", href: "/admin" },
    { name: "Events", href: "/admin/events" },
    { name: "Gallery", href: "/admin/gallery" },
    { name: "Tickets", href: "/admin/tickets" },
    { name: "Messages", href: "/admin/messages" },
    // New ticket management features
    { name: "Generate Batch Tickets", href: "/admin/tickets/generate" },
    { name: "Activate Tickets", href: "/admin/tickets/activate" },
    { name: "Verify Tickets", href: "/verify" },
  ];

  const handleLogout = async () => {
    try {
      const res = await fetch("/admin/api/logout", {
        method: "POST",
      });

      if (res.ok) {
        router.push("/admin/login");
        router.refresh();
      } else {
        console.error("Failed to logout");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">TIPAC Admin</h1>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`block px-4 py-2 rounded-md transition-colors ${
                  pathname === item.href
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 text-left text-red-400 hover:bg-gray-800 rounded-md transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}