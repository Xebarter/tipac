"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Image as ImageIcon,
  Mail,
  Ticket,
  ShieldCheck,
  Users,
  Mailbox,
  LogOut,
  ChevronRight,
  Shield,
} from "lucide-react";

const navigation = [
  {
    group: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    ],
  },
  {
    group: "Content",
    items: [
      { name: "Events", href: "/admin/events", icon: Calendar },
      { name: "Gallery", href: "/admin/gallery", icon: ImageIcon },
      { name: "Messages", href: "/admin/messages", icon: Mail },
    ],
  },
  {
    group: "Ticketing",
    items: [
      { name: "Tickets", href: "/admin/tickets", icon: Ticket },
      { name: "Invitation Cards", href: "/admin/invitation-cards", icon: Mailbox },
      { name: "Applications", href: "/admin/applications", icon: Users },
    ],
  },
  {
    group: "Verification",
    items: [
      { name: "Verify Ticket", href: "/admin/verify", icon: ShieldCheck },
      { name: "Verify Invitations", href: "/admin/verify-invitations", icon: ShieldCheck },
    ],
  },
];

interface SidebarContentProps {
  onNavClick?: () => void;
}

export function SidebarContent({ onNavClick }: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/admin/api/logout", { method: "POST" });
      if (res.ok) {
        router.push("/admin/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-base leading-tight tracking-tight">TIPAC</p>
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navigation.map((group) => (
          <div key={group.group}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/35">
              {group.group}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={onNavClick}
                      className={`group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive
                          ? "bg-white/15 text-white shadow-sm"
                          : "text-white/60 hover:bg-white/8 hover:text-white/90"
                        }`}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon
                          className={`h-4 w-4 flex-shrink-0 transition-colors ${isActive ? "text-white" : "text-white/50 group-hover:text-white/80"
                            }`}
                        />
                        {item.name}
                      </span>
                      {isActive && (
                        <ChevronRight className="h-3.5 w-3.5 text-white/50" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-red-500/20 hover:text-red-300 transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-60 xl:w-64 flex-shrink-0 bg-gradient-to-b from-[hsl(270,76%,22%)] to-[hsl(270,76%,16%)] min-h-screen sticky top-0">
      <SidebarContent />
    </aside>
  );
}