import Link from "next/link";

export function LegalPage({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <main className="legal-page">
      <article className="legal-card">
        <Link className="legal-back" href="/">← Înapoi la Frizeo Oferte</Link>
        <div className="brand-mark auth-logo">F</div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <div className="legal-body">{children}</div>
        <footer className="legal-footer">
          <Link href="/termeni">Termeni</Link>
          <Link href="/confidentialitate">Confidențialitate</Link>
        </footer>
      </article>
    </main>
  );
}
