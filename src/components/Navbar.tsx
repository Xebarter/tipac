"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen((prev) => !prev), []);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const routesToPrefetch = ["/", "/about", "/gallery", "/contact", "/tickets", "/apply"];
    routesToPrefetch.forEach((route) => {
      try {
        router.prefetch(route);
      } catch {
        // Prefetch failures are non-blocking
      }
    });
  }, [router]);

  // Close on route change
  useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  // Lock body scroll, Escape, and outside pointer-down
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarGap > 0) {
      document.body.style.paddingRight = `${scrollbarGap}px`;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobileMenu();
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      // Clicks on the menu toggle are handled by the button itself
      if (menuButtonRef.current?.contains(target)) return;
      if (drawerRef.current?.contains(target)) return;
      closeMobileMenu();
    };

    document.addEventListener("keydown", onKeyDown);
    // Capture phase so we win over nested handlers
    document.addEventListener("pointerdown", onPointerDown, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  // Close when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) closeMobileMenu();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [closeMobileMenu]);

  const handleNavClick = (path: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (path.startsWith("/#") && pathname === "/") {
      event.preventDefault();
      const targetId = path.split("#")[1];
      const targetElement = targetId ? document.getElementById(targetId) : null;
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    }
    closeMobileMenu();
  };

  const isLinkActive = (path: string) => {
    if (path.startsWith("/#")) return pathname === "/";
    return pathname === path;
  };

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/#upcoming-events", label: "Events" },
    { path: "/gallery", label: "Gallery" },
    { path: "/apply", label: "Apply" },
    { path: "/contact", label: "Contact" },
  ];

  const mobileDrawer =
    portalReady &&
    createPortal(
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[200] md:hidden" role="presentation">
            {/* Scrim — tap anywhere here to dismiss */}
            <motion.div
              aria-hidden
              className="absolute inset-0 cursor-pointer bg-slate-950/50 backdrop-blur-[6px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              onClick={closeMobileMenu}
            />

            <motion.aside
              ref={drawerRef}
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="absolute inset-y-0 right-0 flex h-[100dvh] w-[min(86vw,20.5rem)] flex-col overflow-hidden border-l border-white/20 bg-[#fcfcfd] shadow-[-28px_0_80px_rgba(15,23,42,0.28)]"
              initial={{ x: "105%" }}
              animate={{ x: 0 }}
              exit={{ x: "105%" }}
              transition={{ type: "spring", damping: 34, stiffness: 380, mass: 0.78 }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Soft brand wash */}
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_-10%,rgba(239,68,68,0.10),transparent_55%),radial-gradient(90%_60%_at_0%_100%,rgba(147,51,234,0.08),transparent_50%)]"
                aria-hidden
              />

              <div className="relative flex items-center justify-between gap-3 border-b border-slate-200/80 px-5 pb-4 pt-[max(1.1rem,env(safe-area-inset-top))]">
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                >
                  <Image src="/logo.svg" alt="" width={34} height={34} className="rounded-md" />
                  <span className="bg-gradient-to-r from-red-500 to-purple-600 bg-clip-text text-lg font-bold tracking-tight text-transparent">
                    TIPAC
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>

              <nav className="relative flex-1 overflow-y-auto overscroll-contain px-3 py-4">
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Menu
                </p>
                <ul className="flex list-none flex-col gap-1 p-0">
                  {navItems.map((item, index) => {
                    const active = isLinkActive(item.path);
                    return (
                      <motion.li
                        key={item.path}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.06 + index * 0.035,
                          duration: 0.38,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <Link
                          href={item.path}
                          prefetch
                          onClick={handleNavClick(item.path)}
                          className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3.5 text-[15px] font-medium tracking-wide transition-all duration-200 ${
                            active
                              ? "bg-slate-900 text-white shadow-md shadow-slate-900/15"
                              : "text-slate-700 hover:bg-slate-100/90 hover:text-slate-900"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                              active
                                ? "bg-gradient-to-r from-red-400 to-purple-400"
                                : "bg-slate-300 group-hover:bg-slate-400"
                            }`}
                            aria-hidden
                          />
                          <span className="flex-1">{item.label}</span>
                          <span
                            className={`text-slate-400 transition-transform duration-200 ${
                              active ? "text-white/50" : "translate-x-0 opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100"
                            }`}
                            aria-hidden
                          >
                            →
                          </span>
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              <div className="relative border-t border-slate-200/80 bg-white/80 px-5 pb-[max(1.35rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md">
                <Link href="/tickets" onClick={closeMobileMenu} className="block">
                  <Button className="tipac-gradient h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-purple-500/20 transition-transform active:scale-[0.98]">
                    Buy Ticket
                  </Button>
                </Link>
                <p className="mt-3 text-center text-[11px] text-slate-400">
                  Theatre in Progress Across Communities
                </p>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container relative flex items-center justify-between py-4">
        <div className="flex items-center gap-4">
          <Image src="/logo.svg" alt="TIPAC Logo" width={40} height={40} className="min-w-[40px]" />
          <Link href="/" className="flex items-center" onClick={closeMobileMenu}>
            <h1 className="bg-gradient-to-r from-red-500 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">
              TIPAC
            </h1>
          </Link>
        </div>

        <div className="md:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={toggleMobileMenu}
            className="relative z-[60] inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground/80 transition-all duration-200 hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav-drawer"
          >
            <span className="sr-only">{isMobileMenuOpen ? "Close menu" : "Open menu"}</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isMobileMenuOpen ? "close" : "open"}
                initial={{ opacity: 0, rotate: -45, scale: 0.85 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 45, scale: 0.85 }}
                transition={{ duration: 0.18 }}
                className="inline-flex"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" strokeWidth={2.25} />
                ) : (
                  <Menu className="h-5 w-5" strokeWidth={2.25} />
                )}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

        <div className="hidden items-center gap-6 md:flex lg:gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              prefetch
              onClick={handleNavClick(item.path)}
              className={`whitespace-nowrap text-sm transition-colors lg:text-base ${
                isLinkActive(item.path) ? "font-medium text-primary" : "hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/tickets">
            <Button className="tipac-gradient whitespace-nowrap text-sm lg:text-base">Buy Ticket</Button>
          </Link>
        </div>
      </div>

      {mobileDrawer}
    </nav>
  );
}
