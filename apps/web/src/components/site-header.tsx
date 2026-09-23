import Link from "next/link";
import { getSession } from "@/lib/session";

/** Public site header (server component). */
export async function SiteHeader() {
  const session = await getSession();
  const role = session.role;

  return (
    <header className="app-header">
      <Link href="/" className="logo">
        <span className="logo-icon" />
        <span>newswatch</span>
      </Link>
      <nav className="nav">
        <Link href="/">Home</Link>
        <Link href="/categories">Categories</Link>
        <Link href="/search">Search</Link>
        <Link href="/bookmarks">Bookmarks</Link>
        <Link href="/about/about">About</Link>
      </nav>
      <div className="header-actions">
        <form className="search-box" action="/search">
          <span>&#9906;</span>
          <input type="text" name="q" placeholder="Search news..." />
        </form>
        {role === "reporter" && <Link href="/reporter/dashboard" className="btn btn-ghost btn-sm">Reporter</Link>}
        {(role === "admin" || role === "super_admin") && (
          <Link href="/admin" className="btn btn-ghost btn-sm">Admin</Link>
        )}
        {session.user ? (
          <>
            <Link href="/notifications" className="icon-link" title="Notifications">&#128276;</Link>
            <Link href="/profile" className="icon-link" title="Profile">&#9787;</Link>
          </>
        ) : (
          <Link href="/login" className="btn btn-primary btn-sm">Login</Link>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", padding: "30px 20px", marginTop: 40 }}>
      <div className="container-wide row-between wrap" style={{ padding: 0 }}>
        <span className="muted small">© {new Date().getFullYear()} NewsWatch. All rights reserved.</span>
        <div className="row wrap small">
          <Link href="/about/about" className="muted">About</Link>
          <Link href="/about/privacy" className="muted">Privacy</Link>
          <Link href="/about/terms" className="muted">Terms</Link>
          <Link href="/about/faq" className="muted">FAQ</Link>
        </div>
      </div>
    </footer>
  );
}
