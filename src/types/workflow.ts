export type SourceType = "google_doc" | "file";

export type CreateFormAssistantPayload = {
  agentName: string;
  categories: string;
  sourceType: SourceType;
  googleDocLink?: string | undefined;
  file?: File | undefined;
};

export type UploadDocumentPayload = {
  categories: string;
  sourceType: SourceType;
  googleDocLink?: string | undefined;
  file?: File | undefined;
};

export type WorkflowResult = {
  success: boolean;
  agentName?: string | undefined;
  documentName?: string | undefined;
  categoriesProcessed?: number | undefined;
  categoriesCreated?: number | undefined;
  categoriesCleared?: number | undefined;
  propertiesCreated?: number | undefined;
  propertiesUpdated?: number | undefined;
  matchedProperties?: number | undefined;
  unmatchedProperties?: number | undefined;
  formAssistantFields?: number | undefined;
  fieldsProcessed?: number | undefined;
  warnings?: number | undefined;
  recipient?: string | undefined;
  raw?: string | undefined;
  details?: {
    created?: number | undefined;
    updated?: number | undefined;
    skipped?: number | undefined;
    unmatched?: number | undefined;
  };
};

export type StepState = "pending" | "active" | "done" | "failed";

export type Step = {
  id: string;
  label: string;
  state: StepState;
};

export const CLEANER_STEPS = [
  "Contacting workflow",
  "Authenticating with LearningSuite",
  "Resolving categories",
  "Clearing properties",
];

export const EMAILER_STEPS = [
  "Preparing property summary",
  "Collecting LearningSuite data",
  "Generating summary",
  "Sending email",
];

export const UPLOAD_STEPS = [
  "Uploading document",
  "Extracting document text",
  "Extracting categories",
  "Extracting properties",
  "Checking existing LearningSuite fields",
  "Preparing updates",
  "Creating/updating properties",
];

export const ASSISTANT_STEPS = [
  "Creating AI Agent",
  "Reading LearningSuite properties",
  "Reading document",
  "Extracting Form Assistant prompts",
  "Matching prompts to LearningSuite properties",
  "Configuring Form Assistant",
];

export const COMBINED_STEPS = [
  "Uploading document",
  "Extracting configuration",
  "Creating AI Agent",
  "Matching properties",
  "Configuring Form Assistant",
];

export const WIPE_STEP = "Clearing selected categories";
