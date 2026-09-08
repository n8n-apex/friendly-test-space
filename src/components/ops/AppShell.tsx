import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Database,
  FileText,
  Bot,
  Mail,
  Sparkles,
} from "lucide-react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/property-tools", label: "Property Tools", icon: Database },
  { to: "/document-tools", label: "Document Tools", icon: FileText },
  { to: "/ai-agents", label: "AI Agents", icon: Bot },
  { to: "/create-everything", label: "Create Everything", icon: Sparkles },
  { to: "/email-tools", label: "Email Tools", icon: Mail },
] as const;

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="app-bg min-h-screen text-foreground">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="glass-panel z-10 lg:m-3 lg:w-60 lg:shrink-0 lg:rounded-3xl">
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Learning Suite
            </p>
            <p className="text-sm font-semibold">Operations Console</p>
          </div>
          <nav className="flex gap-1.5 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to as never}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "neo-inset font-medium text-foreground" }}
                className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-all hover:text-foreground"
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <header className="animate-fade-up mb-6">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
            )}
          </header>
          <div className="max-w-3xl space-y-5">{children}</div>
        </main>
      </div>
    </div>
  );
}

/** Compact numbered instructions — short lines only. */
export function Instructions({ steps }: { steps: string[] }) {
  return (
    <ol className="glass-panel animate-fade-up grid gap-2 rounded-2xl p-4 text-sm sm:grid-cols-2">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-2">
          <span className="neo-inset flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
            {index + 1}
          </span>
          <span className="text-muted-foreground">{step}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Short "what this tab does" block with a few practical answers
 * for the situations people actually run into.
 */
export function About({
  what,
  notes,
}: {
  what: string;
  notes: { q: string; a: string }[];
}) {
  return (
    <section className="glass-panel animate-fade-up rounded-2xl p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
        <Info className="h-4 w-4 text-muted-foreground" aria-hidden /> What this page does
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{what}</p>
      <dl className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {notes.map((note) => (
          <div key={note.q} className="neo-inset rounded-xl p-3">
            <dt className="text-xs font-semibold">{note.q}</dt>
            <dd className="mt-1 text-xs text-muted-foreground">{note.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function Panel({
  title,
  description,
  children,
  tone = "default",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <section
      className={
        "animate-fade-up rounded-2xl p-5 sm:p-6 " +
        (tone === "danger" ? "neo-panel ring-1 ring-destructive/25" : "neo-panel")
      }
    >
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}
