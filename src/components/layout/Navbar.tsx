"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { REGISTRATION_FORM_URL } from "@/lib/constants";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/warsztaty", label: "Warsztaty" },
  { href: "/materialy", label: "Materiały" },
  { href: "/o-projekcie", label: "O projekcie" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur-sm">
      <div className="container-wide flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-black tracking-tighter [font-family:var(--font-montserrat)]">
          AI LITERACY LAB
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-muted-foreground transition hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Button
            nativeButton={false}
            variant="outline"
            size="sm"
            className="shrink-0 text-xs sm:text-sm"
            render={
              <a
                href={REGISTRATION_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <span className="sm:hidden">Zapisz</span>
            <span className="hidden sm:inline">Zapisz się</span>
          </Button>
          <ThemeToggle />

          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Otwórz menu nawigacji" />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="border-l border-border bg-background">
              <SheetHeader>
                <SheetTitle>AI LITERACY LAB</SheetTitle>
                <SheetDescription>Nawigacja platformy</SheetDescription>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-2 p-4">
                <a
                  href={REGISTRATION_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-border bg-background px-3 py-2 text-center text-sm font-medium hover:bg-muted"
                >
                  Zapisz się na warsztaty
                </a>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
