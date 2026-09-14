export type LayoutOrientation = "portrait" | "landscape";

export function resolveLayoutOrientation(
  width: number,
  height: number,
  deviceOrientation?: string,
  isEmbedded = false,
): LayoutOrientation {
  const measured = width > height ? "landscape" : "portrait";
  const signaled = deviceOrientation?.startsWith("landscape")
    ? "landscape"
    : deviceOrientation?.startsWith("portrait")
      ? "portrait"
      : undefined;

  // Only embedded players need the device signal to override stale iframe dimensions.
  return isEmbedded && signaled ? signaled : measured;
}
