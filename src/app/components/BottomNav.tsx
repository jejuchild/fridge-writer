"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  icon: string;
  label: string;
  filled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", icon: "kitchen", label: "주방", filled: true },
  { href: "/pantry", icon: "inventory_2", label: "식료품" },
  { href: "/cookbook", icon: "menu_book", label: "요리책" },
  { href: "/chef", icon: "account_circle", label: "셰프" },
];

export default function BottomNav({ variant = "default" }: { variant?: "default" | "result" }) {
  const pathname = usePathname();

  const items: NavItem[] = variant === "result"
    ? [
        { href: "/", icon: "kitchen", label: "주방" },
        { href: "/pantry", icon: "inventory_2", label: "식료품" },
        { href: "/result", icon: "restaurant", label: "서빙됨", filled: true },
        { href: "/cookbook", icon: "menu_book", label: "요리책" },
        { href: "/chef", icon: "person", label: "셰프" },
      ]
    : NAV_ITEMS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30">
      <div className="max-w-md mx-auto flex gap-2 border-t border-slate-800 bg-slate-900/90 backdrop-blur-xl px-4 pb-8 pt-3">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? "text-primary" : "text-slate-500"
              }`}
              href={item.href}
            >
              <div className="flex h-8 items-center justify-center">
                <span
                  className="material-symbols-outlined"
                  style={
                    isActive && item.filled
                      ? { fontVariationSettings: "'FILL' 1" }
                      : undefined
                  }
                >
                  {item.icon}
                </span>
              </div>
              <p className="text-[10px] font-bold leading-normal tracking-wider uppercase">
                {item.label}
              </p>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
