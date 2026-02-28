"use client";

import { useState, useEffect } from "react";
import { Menu, X, Shield } from "lucide-react";
import { SidebarContent } from "./Sidebar";
import Link from "next/link";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {/* Mobile-only sticky top bar */}
      <header className="lg:hidden sticky top-0 z-50 flex items-center justify-between px-4 h-14 bg-gradient-to-r from-[hsl(270,76%,22%)] to-[hsl(270,76%,30%)] shadow-lg">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/15">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-bold text-base tracking-tight">
            TIPAC <span className="text-white/60 text-xs font-medium uppercase">Admin</span>
          </span>
        </Link>

        <button
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          className="flex items-center justify-center w-9 h-9 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          style={{ top: 56 }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-in navigation drawer */}
      <div
        className={`lg:hidden fixed left-0 z-50 w-72 bg-gradient-to-b from-[hsl(270,76%,22%)] to-[hsl(270,76%,16%)] transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        style={{ top: 56, height: "calc(100dvh - 56px)" }}
      >
        <SidebarContent onNavClick={() => setIsOpen(false)} />
      </div>
    </>
  );
}