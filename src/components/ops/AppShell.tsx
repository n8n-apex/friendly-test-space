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
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-border bg-sidebar lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0">
          <div className="px-4 py-4">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              Learning Suite
            </p>
            <p className="text-sm font-semibold">Operations Console</p>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-2 pb-3 lg:flex-col lg:overflow-visible">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to as never}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
                className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <header className="mb-6 border-b border-border pb-4">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
            )}
          </header>
          <div className="max-w-3xl space-y-6">{children}</div>
        </main>
      </div>
    </div>
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
        "rounded-md border bg-card p-5 " +
        (tone === "danger" ? "border-destructive/40" : "border-border")
      }
    >
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}
