"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type LayoutShellProps = {
  children: ReactNode;
  footer: ReactNode;
  header: ReactNode;
};

export function LayoutShell({ children, footer, header }: LayoutShellProps) {
  const pathname = usePathname() || "";
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <>
      {isAdminRoute ? null : header}
      <main>{children}</main>
      {isAdminRoute ? null : footer}
    </>
  );
}