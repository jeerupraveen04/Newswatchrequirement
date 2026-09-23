import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SiteFooter } from "@/components/site-header";

export default async function ReporterLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session.user) redirect("/login?next=/reporter/dashboard");
  const allowed = ["reporter", "admin", "super_admin"];
  if (!allowed.includes(session.role ?? "")) redirect("/");

  return (
    <>
      <header className="app-header">
        <Link href="/" className="logo"><span className="logo-icon" /><span>newswatch</span></Link>
        <nav className="nav">
          <Link href="/reporter/dashboard">Dashboard</Link>
          <Link href="/reporter/articles">My Articles</Link>
          <Link href="/reporter/compose">Compose</Link>
          <Link href="/reporter/apply">Apply</Link>
        </nav>
        <div className="header-actions">
          <span className="badge badge-purple">{session.role}</span>
          <Link href="/" className="btn btn-ghost btn-sm">Back to site</Link>
        </div>
      </header>
      {children}
      <SiteFooter />
    </>
  );
}
