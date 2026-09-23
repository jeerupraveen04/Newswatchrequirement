import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-wrap">
      <div className="auth-side">
        <span className="logo-icon" style={{ background: "#fff" }} />
        <h2 className="mt-3">Welcome to<br />newswatch</h2>
        <p style={{ opacity: 0.85, marginTop: 14 }}>
          Log in to save articles, comment and follow your favourite topics.
        </p>
      </div>
      <div className="auth-main">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
}
