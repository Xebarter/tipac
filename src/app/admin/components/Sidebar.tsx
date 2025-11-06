"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  Image, 
  Mail, 
  Ticket, 
  ShieldCheck,
  Users
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Events", href: "/admin/events", icon: Calendar },
    { name: "Gallery", href: "/admin/gallery", icon: Image },
    { name: "Messages", href: "/admin/messages", icon: Mail },
    { name: "Tickets", href: "/admin/tickets", icon: Ticket },
    { name: "Applications", href: "/admin/applications", icon: Users },
    { name: "Verify Ticket", href: "/admin/verify", icon: ShieldCheck },
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
    <div className="flex flex-col h-full border-r bg-card">
      <div className="p-4 border-b">
        <h1 className="text-lg font-semibold">TIPAC Admin</h1>
      </div>
      
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-red-500 hover:bg-accent rounded-lg px-3 py-2 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}