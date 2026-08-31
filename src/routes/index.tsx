import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, Mail, FileUp, Bot, Layers, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/ops/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Learning Suite Operations" },
      {
        name: "description",
        content:
          "Internal operations console for running Learning Suite property, document, assistant and email workflows.",
      },
      { property: "og:title", content: "Dashboard · Learning Suite Operations" },
      {
        property: "og:description",
        content:
          "Run Learning Suite property cleanup, document uploads, assistant creation and summary emails from one console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const actions = [
  {
    to: "/property-tools",
    icon: Database,
    title: "Property Cleaner",
    description: "Clear selected Learning Suite property categories.",
    danger: true,
  },
  {
    to: "/email-tools",
    icon: Mail,
    title: "Property Summary Emailer",
    description: "Generate and send the property summary email.",
  },
  {
    to: "/document-tools",
    icon: FileUp,
    title: "Upload Document",
    description: "Upload a document or Google Doc and create/update properties.",
  },
  {
    to: "/ai-agents",
    icon: Bot,
    title: "Create Assistant",
    description: "Create and configure an AI/Form Assistant from a document.",
  },
  {
    to: "/create-everything",
    icon: Layers,
    title: "Create Everything",
    description:
      "Upload the document and configure the AI/Form Assistant in one operation. Includes wipe before upload.",
    primary: true,
  },
] as const;

function Dashboard() {
  return (
    <AppShell
      title="Dashboard"
      description="Run the existing Learning Suite automation workflows. Each action calls its n8n workflow directly."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className={
              "group flex flex-col rounded-md border bg-card p-4 transition-colors hover:border-foreground/30 " +
              (action.primary
                ? "border-foreground/40 sm:col-span-2"
                : action.danger
                  ? "border-destructive/40"
                  : "border-border")
            }
          >
            <div className="flex items-center gap-2">
              <action.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-semibold">{action.title}</h2>
              {action.danger && (
                <span className="rounded border border-destructive/40 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-destructive uppercase">
                  Destructive
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{action.description}</p>
            <span className="mt-4 flex items-center gap-1 text-xs font-medium text-foreground">
              Open <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
