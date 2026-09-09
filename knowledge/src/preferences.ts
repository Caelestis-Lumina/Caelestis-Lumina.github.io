export function readPreference<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(`cl-knowledge:${key}`) || "null") ?? fallback; }
  catch { return fallback; }
}
export function writePreference(key: string, value: unknown) {
  try { localStorage.setItem(`cl-knowledge:${key}`, JSON.stringify(value)); } catch { /* Private browsing remains usable. */ }
}
export class Preferences {
  readonly systemMotion = matchMedia("(prefers-reduced-motion: reduce)");
  private manualReduced = readPreference<boolean>("reduced", false) === true;
  quality = readPreference<boolean>("quality", true) !== false;
  get reduced() { return this.manualReduced || this.systemMotion.matches; }
  setReduced(value: boolean) { this.manualReduced = value; writePreference("reduced", value); }
  setQuality(value: boolean) { this.quality = value; writePreference("quality", value); }
}
