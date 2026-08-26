export type SourceType = "google_doc" | "file";

export type CreateFormAssistantPayload = {
  agentName: string;
  categories: string[];
  sourceType: SourceType;
  googleDocLink?: string;
  file?: File;
};

export type WorkflowResult = {
  success: boolean;
  agentName: string;
  categoriesCreated?: number;
  fieldsProcessed?: number;
  formAssistantFields?: number;
  details?: {
    created?: number;
    updated?: number;
    skipped?: number;
    unmatched?: number;
  };
};

export type ProgressStepId =
  | "prepare"
  | "read"
  | "extract"
  | "fields"
  | "agent"
  | "configure";

export type StepState = "pending" | "active" | "done";

export type ProgressStep = {
  id: ProgressStepId;
  label: string;
  state: StepState;
};

export const progressStepLabels: { id: ProgressStepId; label: string }[] = [
  { id: "prepare", label: "Preparing document" },
  { id: "read", label: "Reading document" },
  { id: "extract", label: "Extracting fields" },
  { id: "fields", label: "Creating LearningSuite fields" },
  { id: "agent", label: "Creating AI Agent" },
  { id: "configure", label: "Configuring Form Assistant" },
];
