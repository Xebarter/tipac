"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isLinkActive = (path: string) => pathname === path;

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

  return (
    <nav className="w-full py-4 border-b border-border sticky top-0 z-50 bg-background">
      <div className="container flex items-center justify-between relative">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Image src="/logo.svg" alt="TIPAC Logo" width={40} height={40} />
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-500">
              TIPAC
            </h1>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden">
          <button onClick={toggleMobileMenu} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {["/", "/about", "/programs", "/gallery", "/contact"].map((path, i) => (
            <Link
              key={i}
              href={path}
              className={`transition-colors ${isLinkActive(path) ? "text-primary font-medium" : "hover:text-primary"}`}
            >
              {path === "/" ? "Home" : path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
            </Link>
          ))}
          <Link href="/donation" target="_blank" rel="noopener noreferrer">
            <Button className="tipac-gradient">Donate Now</Button>
          </Link>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            ref={menuRef}
            className="absolute top-full left-0 w-full bg-background shadow-md py-4 flex flex-col items-center gap-4 z-50"
          >
            {["/", "/about", "/programs", "/gallery", "/contact"].map((path, i) => (
              <Link
                key={i}
                href={path}
                className={`transition-colors block py-2 ${
                  isLinkActive(path) ? "text-primary font-medium" : "hover:text-primary"
                }`}
                onClick={closeMobileMenu}
              >
                {path === "/" ? "Home" : path.slice(1).charAt(0).toUpperCase() + path.slice(2)}
              </Link>
            ))}
            <Link
              href="/donation"
              onClick={closeMobileMenu}
              className="w-48"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="tipac-gradient w-full">Donate Now</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
