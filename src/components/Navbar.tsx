"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const routesToPrefetch = ["/", "/about", "/gallery", "/contact", "/tickets", "/apply"];
    routesToPrefetch.forEach((route) => {
      try {
        router.prefetch(route);
      } catch {
        // Prefetch failures are non-blocking; ignore to keep navigation responsive.
      }
    });
  }, [router]);

  const handleNavClick = (path: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (path.startsWith("/#") && pathname === "/") {
      event.preventDefault();
      const targetId = path.split("#")[1];
      const targetElement = targetId ? document.getElementById(targetId) : null;
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
      closeMobileMenu();
      return;
    }

    closeMobileMenu();
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isLinkActive = (path: string) => {
    // If the link is an anchor to the home page (e.g. '/#upcoming-events'),
    // consider it active when we're on the home pathname ('/').
    if (path.startsWith("/#")) {
      return pathname === "/";
    }
    return pathname === path;
  };

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMobileMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  // Close mobile menu when window is resized to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        closeMobileMenu();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/#upcoming-events", label: "Events" },
    { path: "/gallery", label: "Gallery" },
    { path: "/apply", label: "Apply" },
    { path: "/contact", label: "Contact" },
  ];

  return (
    <nav className="w-full py-4 border-b border-border sticky top-0 z-50 bg-background">
      <div className="container flex items-center justify-between relative">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Image src="/logo.svg" alt="TIPAC Logo" width={40} height={40} className="min-w-[40px]" />
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-500">
              TIPAC
            </h1>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
          <button
            onClick={toggleMobileMenu}
            className="text-gray-500 hover:text-gray-700 focus:outline-none p-2"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {navItems.map((item, i) => (
            <Link
              key={i}
              href={item.path}
              prefetch
              onClick={handleNavClick(item.path)}
              className={`transition-colors whitespace-nowrap text-sm lg:text-base ${isLinkActive(item.path) ? "text-primary font-medium" : "hover:text-primary"}`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/tickets">
            <Button className="tipac-gradient text-sm lg:text-base whitespace-nowrap">Buy Ticket</Button>
          </Link>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            ref={menuRef}
            className="absolute top-full left-0 w-full bg-background shadow-lg py-4 flex flex-col items-center gap-4 z-50 md:hidden"
          >
            {navItems.map((item, i) => (
              <Link
                key={i}
                href={item.path}
                prefetch
                className={`transition-colors block py-2 px-4 w-full text-center ${isLinkActive(item.path) ? "text-primary font-medium" : "hover:text-primary"
                  }`}
                onClick={handleNavClick(item.path)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 w-48">
              <Link
                href="/tickets"
                onClick={closeMobileMenu}
                className="w-full"
              >
                <Button className="tipac-gradient w-full">Buy Ticket</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}