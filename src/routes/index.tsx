import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/pages/Home";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LearningSuite Form Builder" },
      {
        name: "description",
        content:
          "Create and configure LearningSuite fields and Form Assistants from your onboarding document.",
      },
      { property: "og:title", content: "LearningSuite Form Builder" },
      {
        property: "og:description",
        content:
          "Create and configure LearningSuite fields and Form Assistants from your onboarding document.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});
