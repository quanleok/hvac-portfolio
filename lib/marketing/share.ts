/**
 * Whether the current browser can share a file payload via the Web Share API.
 * Falls back to false on desktop browsers / older browsers where files aren't supported.
 *
 * Call this from a client component only — it references `navigator`.
 */
export function canShareFiles(files: File[]): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.canShare !== "function") return false;
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

/**
 * Trigger the native share sheet. Returns true if the user completed the share
 * (which doesn't guarantee anything was actually posted — the user could have
 * cancelled inside the platform app). Returns false if the share API threw
 * or the user cancelled the share sheet itself.
 */
export async function shareFiles(input: {
  text: string;
  files: File[];
  title?: string;
}): Promise<boolean> {
  try {
    await navigator.share({
      title: input.title,
      text: input.text,
      files: input.files,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch a signed storage URL as a File so it can be handed to navigator.share().
 */
export async function fetchAsFile(
  signedUrl: string,
  fileName: string,
  mimeType: string
): Promise<File> {
  const response = await fetch(signedUrl);
  if (!response.ok) {
    throw new Error(`Could not load media (${response.status}).`);
  }
  const blob = await response.blob();
  return new File([blob], fileName, { type: mimeType });
}
