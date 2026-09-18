"use client";

import Link from "next/link";

interface AdminBreadcrumbItem {
  label: string;
  href?: string;
}

export function AdminBreadcrumbs({ items }: { items: AdminBreadcrumbItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="admin-breadcrumbs">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="admin-breadcrumb-link">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isLast ? "admin-breadcrumb-current" : "admin-breadcrumb-link"}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}

              {!isLast ? <span className="admin-breadcrumb-separator">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
