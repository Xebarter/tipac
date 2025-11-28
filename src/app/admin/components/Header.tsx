"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Image,
  Mail,
  Ticket,
  ShieldCheck,
  Users,
  Mailbox,
  Menu,
  X
} from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Events", href: "/admin/events", icon: Calendar },
    { name: "Gallery", href: "/admin/gallery", icon: Image },
    { name: "Messages", href: "/admin/messages", icon: Mail },
    { name: "Tickets", href: "/admin/tickets", icon: Ticket },
    { name: "Invitation Cards", href: "/admin/invitation-cards", icon: Mailbox },
    { name: "Applications", href: "/admin/applications", icon: Users },
    { name: "Verify Ticket", href: "/admin/verify", icon: ShieldCheck },
    { name: "Verify Invitations", href: "/admin/verify-invitations", icon: ShieldCheck },
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
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-lg font-semibold">TIPAC Admin</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="hidden md:flex items-center">
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:bg-accent rounded-md px-3 py-2 transition-colors"
            >
              Logout
            </button>
          </div>
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden">
            <nav className="pt-2 pb-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full text-left text-red-500 hover:bg-accent rounded-md px-3 py-2 transition-colors text-base font-medium"
              >
                Logout
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
