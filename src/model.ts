export type Answer = "yes" | "no" | "na";

export interface Item {
  id: string;
  text: string;
  /** Required items must be answered before a walk can be finished. */
  required?: boolean;
}

export interface Section {
  title: string;
  items: Item[];
}

export interface Template {
  id: string;
  name: string;
  sections: Section[];
}

export interface AnswerRecord {
  value: Answer;
  note: string;
  /** Local time with offset, when the answer was last changed. */
  at: string;
}

export interface Walk {
  id: string;
  templateId: string;
  templateName: string;
  /** Snapshot of the template, so later template edits never change a finished walk. */
  sections: Section[];
  store: string;
  by: string;
  startedAt: string;
  finishedAt?: string;
  answers: Record<string, AnswerRecord>;
}

export interface Problem {
  itemId: string;
  message: string;
}

/** ISO 8601 local time with UTC offset, e.g. 2026-11-18T06:05:09-08:00. */
export function localIso(date: Date): string {
  const pad = (n: number) => String(Math.trunc(Math.abs(n))).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(offset / 60)}:${pad(offset % 60)}`
  );
}

export function newWalk(template: Template, store: string, by: string, now = new Date()): Walk {
  return {
    id: crypto.randomUUID(),
    templateId: template.id,
    templateName: template.name,
    sections: structuredClone(template.sections),
    store: store.trim(),
    by: by.trim(),
    startedAt: localIso(now),
    answers: {},
  };
}

export function allItems(walk: Pick<Walk, "sections">): Item[] {
  return walk.sections.flatMap((s) => s.items);
}

/** Returns a new walk with the answer set. A finished walk is never changed. */
export function setAnswer(walk: Walk, itemId: string, value: Answer, note: string, now = new Date()): Walk {
  if (walk.finishedAt) throw new Error("This walk is finished and can no longer be changed.");
  if (!allItems(walk).some((i) => i.id === itemId)) throw new Error(`Unknown item: ${itemId}`);
  return { ...walk, answers: { ...walk.answers, [itemId]: { value, note, at: localIso(now) } } };
}

export function progress(walk: Walk): { answered: number; total: number } {
  const items = allItems(walk);
  return { answered: items.filter((i) => walk.answers[i.id]).length, total: items.length };
}

/** Everything that blocks finishing: unanswered required items and "no" answers without a note. */
export function problems(walk: Walk): Problem[] {
  const out: Problem[] = [];
  for (const item of allItems(walk)) {
    const a = walk.answers[item.id];
    if (!a && item.required) out.push({ itemId: item.id, message: `Not answered: ${item.text}` });
    if (a?.value === "no" && !a.note.trim()) out.push({ itemId: item.id, message: `Add a note for "No": ${item.text}` });
  }
  return out;
}

export function finish(walk: Walk, now = new Date()): Walk {
  if (walk.finishedAt) return walk;
  const blocking = problems(walk);
  if (blocking.length) throw new Error(blocking.map((p) => p.message).join("\n"));
  return { ...walk, finishedAt: localIso(now) };
}
