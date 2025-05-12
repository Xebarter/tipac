"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isLinkActive = (path: string) => pathname === path;

  return (
    <nav className="w-full py-4 border-b border-border sticky top-0 z-50 bg-background">
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <Image src="/logo.svg" alt="TIPAC Logo" width={40} height={40} />
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-500">
              TIPAC
            </h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { href: "/", label: "Home" },
            { href: "/about", label: "About Us" },
            { href: "/programs", label: "Programs" },
            { href: "/gallery", label: "Gallery" },
            { href: "/contact", label: "Contact" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`transition-colors ${
                isLinkActive(href)
                  ? "text-primary font-medium"
                  : "hover:text-primary"
              }`}
            >
              {label}
            </Link>
          ))}
          <Link href="/donation" target="_blank" rel="noopener noreferrer">
            <Button className="tipac-gradient">Donate Now</Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button
            onClick={toggleMobileMenu}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-4 pt-4 pb-6 bg-background shadow-md border-t border-border space-y-3">
          {[
            { href: "/", label: "Home" },
            { href: "/about", label: "About Us" },
            { href: "/programs", label: "Programs" },
            { href: "/gallery", label: "Gallery" },
            { href: "/contact", label: "Contact" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={closeMobileMenu}
              className={`block text-center py-2 transition-colors ${
                isLinkActive(href)
                  ? "text-primary font-medium"
                  : "hover:text-primary"
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/donation"
            onClick={closeMobileMenu}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center"
          >
            <Button className="tipac-gradient w-full">Donate Now</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
