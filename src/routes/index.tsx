import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, Mail, FileUp, Bot, Layers, ArrowRight } from "lucide-react";
import { About, AppShell, Instructions } from "@/components/ops/AppShell";

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

type ActionCard = {
  to: string;
  icon: typeof Database;
  title: string;
  description: string;
  danger?: boolean;
  primary?: boolean;
};

const actions: ActionCard[] = [
  {
    to: "/create-everything",
    icon: Layers,
    title: "Create Everything",
    description: "Document, categories and assistant in one run. Optional wipe first.",
    primary: true,
  },
  {
    to: "/document-tools",
    icon: FileUp,
    title: "Upload Document",
    description: "Send a document or Google Doc and update the matching properties.",
  },
  {
    to: "/ai-agents",
    icon: Bot,
    title: "Create Assistant",
    description: "Build an AI/Form Assistant from a document.",
  },
  {
    to: "/email-tools",
    icon: Mail,
    title: "Summary Emailer",
    description: "Send the property summary email to one recipient.",
  },
  {
    to: "/property-tools",
    icon: Database,
    title: "Property Cleaner",
    description: "Clear selected categories and their properties.",
    danger: true,
  },
];

function Dashboard() {
  return (
    <AppShell
      title="Dashboard"
      description="Every action here runs an existing Learning Suite workflow."
    >
      <About
        what="A control panel for the existing Learning Suite workflows. Each page below runs one of them and shows the progress and the result."
        notes={[
          {
            q: "Where do I start?",
            a: "Create Everything covers the whole flow. The other pages run a single part of it.",
          },
          {
            q: "Which pages delete things?",
            a: "Only Property Cleaner, and the optional wipe inside Create Everything. Both ask you to type DELETE.",
          },
          {
            q: "Where do categories come from?",
            a: "From Learning Suite, plus anything found in the document you add. You can also type your own.",
          },
          {
            q: "Runs feel slow",
            a: "Reading a document can take 30 seconds to 2 minutes. Keep the page open until the steps finish.",
          },
        ]}
      />

      <Instructions
        steps={[
          "Pick the task you want to run.",
          "Add the document first — it decides the categories.",
          "Check the categories, then start.",
          "Watch the steps and read the result.",
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to as never}
            className={
              "neo-panel animate-fade-up group flex flex-col rounded-2xl p-4 transition-transform hover:-translate-y-0.5 " +
              (action.primary ? "sm:col-span-2" : "") +
              (action.danger ? " ring-1 ring-destructive/20" : "")
            }
          >
            <div className="flex items-center gap-2">
              <span className="neo-inset flex h-8 w-8 items-center justify-center rounded-xl">
                <action.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
              </span>
              <h2 className="text-sm font-semibold">{action.title}</h2>
              {action.danger && (
                <span className="danger-panel rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide text-destructive uppercase">
                  Destructive
                </span>
              )}
            </div>
            <p className="mt-2.5 text-sm text-muted-foreground">{action.description}</p>
            <span className="mt-4 flex items-center gap-1 text-xs font-medium text-foreground">
              Open{" "}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
