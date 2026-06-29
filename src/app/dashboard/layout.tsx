import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentOrg } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/knowledge", label: "Knowledge" },
  { href: "/chat", label: "Demo chat" },
  { href: "/dashboard/billing", label: "Billing" },
];

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const org = await getCurrentOrg();

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-950 p-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          AI Sales Engineer
        </Link>
        <p className="mt-1 mb-8 text-xs text-slate-500">
          {org.organizationName}
          {org.isMock && " (mock)"}
        </p>
        <nav className="space-y-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}
