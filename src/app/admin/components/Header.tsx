"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Calendar,
  Image as ImageIcon,
  Mail,
  Ticket,
  ShieldCheck,
  Users,
  Mailbox,
  Menu,
  X,
  LogOut,
  ChevronRight
} from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMenuOpen]);

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Events", href: "/admin/events", icon: Calendar },
    { name: "Gallery", href: "/admin/gallery", icon: ImageIcon },
    { name: "Messages", href: "/admin/messages", icon: Mail },
    { name: "Tickets", href: "/admin/tickets", icon: Ticket },
    { name: "Invitations", href: "/admin/invitation-cards", icon: Mailbox },
    { name: "Apps", href: "/admin/applications", icon: Users },
    { name: "Verify Ticket", href: "/admin/verify", icon: ShieldCheck },
    { name: "Verify Invites", href: "/admin/verify-invitations", icon: ShieldCheck },
  ];

  const handleLogout = async () => {
    try {
      const res = await fetch("/admin/api/logout", {
        method: "POST",
      });

      if (res.ok) {
        router.push("/admin/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2 group">
              <div className="bg-primary p-1.5 rounded-lg transition-transform group-hover:scale-110">
                <ShieldCheck className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight hidden sm:block">
                TIPAC<span className="text-primary text-sm ml-1 uppercase">Admin</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Hidden on smaller screens due to item count */}
          <nav className="hidden xl:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="h-6 w-px bg-border mx-2" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </nav>

          {/* Mobile/Tablet Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="xl:hidden p-2 rounded-md hover:bg-accent transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/95 xl:hidden transition-transform duration-300 ease-in-out"
          style={{ top: "64px", height: "calc(100vh - 64px)" }}
        >
          <nav className="flex flex-col h-full p-6 overflow-y-auto">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center justify-between w-full p-4 rounded-xl text-base font-medium transition-all ${isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </div>
                    <ChevronRight className={`h-4 w-4 opacity-50 ${isActive ? "block" : "hidden sm:block"}`} />
                  </Link>
                );
              })}
            </div>

            <div className="mt-auto pt-10 pb-6">
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full p-4 text-red-500 font-semibold bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Logout from Admin
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}