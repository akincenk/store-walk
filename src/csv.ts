import { allItems, type Walk } from "./model";

export const CSV_HEADER = [
  "walk_id", "checklist", "store", "by", "started_at", "finished_at",
  "section", "item_id", "item", "required", "answer", "note", "answered_at",
];

/**
 * One CSV field. Quotes when needed, and prefixes text that a spreadsheet would run as a
 * formula (= + - @ tab CR) with an apostrophe, so a note like "=HYPERLINK(...)" stays text.
 */
export function csvField(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/** Audit trail: one row per checklist item per walk, unanswered items included. */
export function walksToCsv(walks: Walk[]): string {
  const rows = [CSV_HEADER];
  for (const w of walks) {
    for (const section of w.sections) {
      for (const item of section.items) {
        const a = w.answers[item.id];
        rows.push([
          w.id, w.templateName, w.store, w.by, w.startedAt, w.finishedAt ?? "",
          section.title, item.id, item.text, item.required ? "yes" : "no",
          a?.value ?? "", a?.note ?? "", a?.at ?? "",
        ]);
      }
    }
  }
  return rows.map((r) => r.map(csvField).join(",")).join("\r\n") + "\r\n";
}

/** Counts per walk, used in the walk list. */
export function summary(walk: Walk): { yes: number; no: number; na: number; open: number } {
  const s = { yes: 0, no: 0, na: 0, open: 0 };
  for (const item of allItems(walk)) {
    const a = walk.answers[item.id];
    if (a) s[a.value]++;
    else s.open++;
  }
  return s;
}
