import closing from "./templates/closing.json";
import opening from "./templates/opening.json";
import type { Template } from "./model";

/** Checks a template's shape and that item ids are unique; throws with a readable message. */
export function validateTemplate(data: unknown): Template {
  const t = data as Template;
  if (!t || typeof t.id !== "string" || !t.id || typeof t.name !== "string" || !t.name) {
    throw new Error("Template needs a non-empty id and name.");
  }
  if (!Array.isArray(t.sections) || t.sections.length === 0) throw new Error(`Template ${t.id} has no sections.`);
  const seen = new Set<string>();
  for (const s of t.sections) {
    if (typeof s.title !== "string" || !Array.isArray(s.items) || s.items.length === 0) {
      throw new Error(`Template ${t.id}: every section needs a title and at least one item.`);
    }
    for (const i of s.items) {
      if (typeof i.id !== "string" || !i.id || typeof i.text !== "string" || !i.text) {
        throw new Error(`Template ${t.id}: every item needs an id and text.`);
      }
      if (seen.has(i.id)) throw new Error(`Template ${t.id}: duplicate item id "${i.id}".`);
      seen.add(i.id);
    }
  }
  return t;
}

export const builtInTemplates: Template[] = [opening, closing].map(validateTemplate);
