// Bridge between the preserved RhineLab renderer and the blog's content model.
import { ArchiveCatalog } from "../navigation.ts";

let catalog: ArchiveCatalog;
export let archiveColumns: string[] = [];
export function connectCatalog(value: ArchiveCatalog) {
  catalog = value;
  archiveColumns = value.columns;
}
export const columnFiles = (lane: number) => catalog.files(lane);
export function fileLocation(index: number) {
  const { lane, row } = catalog.location(index);
  return { lane, row, slot: lane * 32 + row };
}
export function assetUrl(path: string): string {
  const base = new URL(document.querySelector<HTMLMetaElement>('meta[name="knowledge-base"]')!.content, location.href);
  const url = new URL(`rhine/${path}`, base);
  if (path.endsWith(".glb")) url.searchParams.set("v", "5abab02");
  return url.href;
}
