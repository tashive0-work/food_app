"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/quiz", label: "진단", icon: "quiz" },
  { href: "/theme", label: "테마", icon: "theme" },
  { href: "/ranking", label: "랭킹", icon: "rank" },
  { href: "/favorites", label: "찜", icon: "heart" },
];

function Icon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "var(--primary)" : "var(--dim)";
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (name === "home")
    return (
      <svg {...common}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
      </svg>
    );
  if (name === "quiz")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.2 9.2a2.9 2.9 0 1 1 3.6 3.6c-.5.2-.8.7-.8 1.2v.4" />
        <circle cx="12" cy="17.6" r=".7" fill={stroke} stroke="none" />
      </svg>
    );
  if (name === "theme")
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
        <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
        <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
        <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
      </svg>
    );
  if (name === "rank")
    return (
      <svg {...common}>
        <path d="M12 20V10" />
        <path d="M18 20V4" />
        <path d="M6 20v-4" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M12 20s-7-4.4-7-9.2A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.8C19 15.6 12 20 12 20Z" />
    </svg>
  );
}

export function BottomNav({ favCount = 0 }: { favCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="bottomNav" aria-label="주요 메뉴">
      {ITEMS.map((it) => {
        const active =
          it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={active ? "navItem on" : "navItem"}
            aria-current={active ? "page" : undefined}
          >
            <span className="navIcon">
              <Icon name={it.icon} active={active} />
              {it.icon === "heart" && favCount > 0 && (
                <span className="navBadge">{favCount}</span>
              )}
            </span>
            <span className="navLabel">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
