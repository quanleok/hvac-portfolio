"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

interface AdminNavItem {
  href: string;
  label: string;
  badge?: string;
  disabled?: boolean;
  tone: {
    bg: string;
    border: string;
    text: string;
    hoverBg: string;
    hoverBorder: string;
    activeBg: string;
    activeBorder: string;
    activeText: string;
  };
}

const navItems: readonly AdminNavItem[] = [
  {
    href: "/admin",
    label: "Clients",
    tone: {
      bg: "#123354",
      border: "#2f6fb3",
      text: "#dbeeff",
      hoverBg: "#183f68",
      hoverBorder: "#4a91e6",
      activeBg: "#1f6feb",
      activeBorder: "#63a8ff",
      activeText: "#ffffff",
    },
  },
  {
    href: "/admin/attention",
    label: "Attention",
    tone: {
      bg: "#4b3718",
      border: "#9e7a2e",
      text: "#ffedc2",
      hoverBg: "#5a431d",
      hoverBorder: "#c89a35",
      activeBg: "#c9962d",
      activeBorder: "#e5b34e",
      activeText: "#111111",
    },
  },
  {
    href: "/admin/website",
    label: "Website",
    tone: {
      bg: "#183b61",
      border: "#4078b6",
      text: "#dbeeff",
      hoverBg: "#1d4876",
      hoverBorder: "#56a0f2",
      activeBg: "#3c8ef1",
      activeBorder: "#63a8ff",
      activeText: "#ffffff",
    },
  },
  {
    href: "/admin/marketing",
    label: "Marketing",
    tone: {
      bg: "#15474b",
      border: "#2f8d95",
      text: "#d9ffff",
      hoverBg: "#1c585d",
      hoverBorder: "#44bcc6",
      activeBg: "#2fb6bf",
      activeBorder: "#62d6de",
      activeText: "#082126",
    },
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="-mx-5 overflow-x-auto px-5 py-3 sm:mx-0 sm:overflow-visible sm:px-0 sm:py-2">
      <nav
        aria-label="Admin navigation"
        className="flex min-w-max items-center gap-2 text-sm font-semibold text-[#9aafc5] sm:flex-wrap"
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin" || pathname.startsWith("/admin/clients")
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          const navStyle = {
            "--admin-nav-bg": isActive ? item.tone.activeBg : item.tone.bg,
            "--admin-nav-border": isActive ? item.tone.activeBorder : item.tone.border,
            "--admin-nav-text": isActive ? item.tone.activeText : item.tone.text,
            "--admin-nav-hover-bg": isActive ? item.tone.activeBg : item.tone.hoverBg,
            "--admin-nav-hover-border": isActive ? item.tone.activeBorder : item.tone.hoverBorder,
            "--admin-nav-hover-text": isActive ? item.tone.activeText : "#ffffff",
          } as CSSProperties;

          if (item.disabled) {
            return (
              <span
                key={item.href}
                style={navStyle}
                className="admin-nav-link inline-flex shrink-0 items-center gap-2 cursor-not-allowed whitespace-nowrap text-[#6c8096]"
                aria-disabled="true"
                title="Coming soon"
              >
                {item.label}
                <span className="rounded-sm bg-[#1a2c44] border border-[#25344a] px-1.5 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-[#9aafc5]">
                  Soon
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-current={isActive ? "page" : undefined}
              style={navStyle}
              className={`admin-nav-link inline-flex shrink-0 items-center whitespace-nowrap ${
                isActive ? "font-extrabold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" : ""
              }`}
            >
              {item.label}
              {item.badge && (
                <span className="ml-2 inline-flex items-center rounded-sm border border-blue-500/30 bg-blue-500/20 px-1.5 py-0.5 text-[0.6rem] font-extrabold uppercase tracking-[0.14em] text-blue-400">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
