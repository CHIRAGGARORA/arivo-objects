/**
 * Placeholder images are stored in products.ts as a "placeholder:xxx" key
 * rather than a real file path. This just detects that convention so
 * components know to render PlaceholderImage instead of a real photo.
 */
export function isPlaceholderKey(src: string): boolean {
  return src.startsWith("placeholder:");
}
