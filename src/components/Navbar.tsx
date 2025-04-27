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
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isLinkActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="w-full py-4 border-b border-border sticky top-0 z-50 bg-background">
      <div className="container flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <Image
            src="/logo.svg"
            alt="TIPAC Logo"
            width={40}
            height={40}
          />
          <Link href="/" className="flex items-center">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-500">
              TIPAC
            </h1>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button onClick={toggleMobileMenu} className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary">
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className={`transition-colors ${isLinkActive('/') ? 'text-primary font-medium' : 'hover:text-primary'}`}
          >
            Home
          </Link>
          <Link
            href="/about"
            className={`transition-colors ${isLinkActive('/about') ? 'text-primary font-medium' : 'hover:text-primary'}`}
          >
            About Us
          </Link>
          <Link
            href="/programs"
            className={`transition-colors ${isLinkActive('/programs') ? 'text-primary font-medium' : 'hover:text-primary'}`}
          >
            Programs
          </Link>
          <Link
            href="/gallery"
            className={`transition-colors ${isLinkActive('/gallery') ? 'text-primary font-medium' : 'hover:text-primary'}`}
          >
            Gallery
          </Link>
          <Link
            href="/contact"
            className={`transition-colors ${isLinkActive('/contact') ? 'text-primary font-medium' : 'hover:text-primary'}`}
          >
            Contact
          </Link>
          <a
            href="https://flutterwave.com/donate/wlij6ldg0bpq"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="tipac-gradient">Donate Now</Button>
          </a>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-background shadow-md py-4 flex flex-col items-center gap-4">
            <Link
              href="/"
              className={`transition-colors ${isLinkActive('/') ? 'text-primary font-medium' : 'hover:text-primary'} block py-2`}
              onClick={closeMobileMenu}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`transition-colors ${isLinkActive('/about') ? 'text-primary font-medium' : 'hover:text-primary'} block py-2`}
              onClick={closeMobileMenu}
            >
              About Us
            </Link>
            <Link
              href="/programs"
              className={`transition-colors ${isLinkActive('/programs') ? 'text-primary font-medium' : 'hover:text-primary'} block py-2`}
              onClick={closeMobileMenu}
            >
              Programs
            </Link>
            <Link
              href="/gallery"
              className={`transition-colors ${isLinkActive('/gallery') ? 'text-primary font-medium' : 'hover:text-primary'} block py-2`}
              onClick={closeMobileMenu}
            >
              Gallery
            </Link>
            <Link
              href="/contact"
              className={`transition-colors ${isLinkActive('/contact') ? 'text-primary font-medium' : 'hover:text-primary'} block py-2`}
              onClick={closeMobileMenu}
            >
              Contact
            </Link>
            <a
              href="https://flutterwave.com/donate/wlij6ldg0bpq"
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMobileMenu}
              className="w-48"
            >
              <Button className="tipac-gradient w-full">Donate Now</Button>
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}

<img src="https://tracker.metricool.com/c3po.jpg?hash=4b07d88664615331ed8d6ff18faa8d3"/>