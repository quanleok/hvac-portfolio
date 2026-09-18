export function isMissingClientSchemaError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("Could not find the table 'public.clients'") ||
    error.message.includes("relation \"public.clients\" does not exist") ||
    error.message.includes("Could not find the table 'public.documents'") ||
    error.message.includes("relation \"public.documents\" does not exist") ||
    error.message.includes("Could not find the table 'public.document_items'") ||
    error.message.includes("relation \"public.document_items\" does not exist") ||
    error.message.includes("Could not find the table 'public.document_presets'") ||
    error.message.includes("relation \"public.document_presets\" does not exist")
  );
}
