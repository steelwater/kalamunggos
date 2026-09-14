export type LayoutOrientation = "portrait" | "landscape";

export function resolveLayoutOrientation(
  width: number,
  height: number,
  deviceOrientation?: string,
  isEmbedded = false,
  hasMobileInput = false,
): LayoutOrientation {
  const measured = width > height ? "landscape" : "portrait";
  const signaled = deviceOrientation?.startsWith("landscape")
    ? "landscape"
    : deviceOrientation?.startsWith("portrait")
      ? "portrait"
      : undefined;

  // Mobile embedded players can retain stale iframe dimensions during rotation.
  // Desktop embeds must continue to follow the actual iframe shape.
  return isEmbedded && hasMobileInput && signaled ? signaled : measured;
}
