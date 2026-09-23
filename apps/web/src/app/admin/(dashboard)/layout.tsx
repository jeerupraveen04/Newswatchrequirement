import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session.user) redirect("/admin/login");
  const role = session.role;
  if (role !== "admin" && role !== "super_admin") redirect("/");
  const isSuper = role === "super_admin";

  const items = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/articles", label: "Article Moderation" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/reporters", label: "Reporter Approvals" },
    { href: "/admin/analytics", label: "Analytics" },
    ...(isSuper
      ? [
          { href: "/admin/regions", label: "Regions" },
          { href: "/admin/app-settings", label: "App & Ad Settings" },
          { href: "/admin/danger-zone", label: "Danger Zone" },
        ]
      : []),
  ];

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="brand">newswatch {isSuper ? "super admin" : "admin"}</div>
        {items.map((i) => (
          <Link key={i.href} href={i.href}>{i.label}</Link>
        ))}
        <Link href="/" style={{ marginTop: 20 }}>View site</Link>
        <form action="/api/auth/logout" method="post">
          <button className="btn btn-ghost btn-sm" style={{ color: "#bbb", marginTop: 8 }}>Sign out</button>
        </form>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
