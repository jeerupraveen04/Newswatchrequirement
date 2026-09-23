import { apiFetch } from "@/lib/api";

export const revalidate = 600;

const FALLBACK: Record<string, { title: string; body: string }> = {
  about: { title: "About NewsWatch", body: "Independent, mobile-first journalism." },
  privacy: { title: "Privacy Policy", body: "We minimise PII and never sell data." },
  terms: { title: "Terms of Service", body: "Use of NewsWatch is subject to these terms." },
  faq: { title: "FAQ", body: "Frequently asked questions about NewsWatch." },
};

export async function generateMetadata({ params }: { params: { page: string } }) {
  return { title: FALLBACK[params.page]?.title ?? "Information" };
}

export default async function StaticPage({ params }: { params: { page: string } }) {
  let content = FALLBACK[params.page] ?? { title: "Information", body: "" };
  try {
    const settings = await apiFetch<Record<string, { title: string; body: string }>>("/app-settings", {
      revalidate: 600,
    });
    const key = `static.${params.page}`;
    if (settings[key]) content = settings[key]!;
  } catch {
    /* fallback */
  }

  return (
    <main className="page" style={{ maxWidth: 720 }}>
      <h1 className="page-title">{content.title}</h1>
      <div className="card card-pad mt-2">
        <p style={{ lineHeight: 1.8, color: "var(--text-secondary)" }}>{content.body}</p>
      </div>
    </main>
  );
}
