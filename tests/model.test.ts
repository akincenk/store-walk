import { describe, expect, it } from "vitest";
import { finish, localIso, newWalk, problems, progress, setAnswer, type Template } from "../src/model";
import { builtInTemplates, validateTemplate } from "../src/templates";

const template: Template = {
  id: "t",
  name: "Test",
  sections: [
    {
      title: "A",
      items: [
        { id: "a1", text: "Required one", required: true },
        { id: "a2", text: "Optional one" },
      ],
    },
  ],
};
const at = new Date("2026-11-18T14:00:00Z");

describe("walk model", () => {
  it("starts empty and snapshots the template", () => {
    const w = newWalk(template, "  Store 12 ", " CA ", at);
    expect(w.store).toBe("Store 12");
    expect(w.by).toBe("CA");
    expect(progress(w)).toEqual({ answered: 0, total: 2 });
    w.sections[0].items[0].text = "changed";
    expect(template.sections[0].items[0].text).toBe("Required one");
  });

  it("blocks finishing until required items are answered", () => {
    const w = newWalk(template, "S", "CA", at);
    expect(problems(w).map((p) => p.itemId)).toEqual(["a1"]);
    expect(() => finish(w)).toThrow("Not answered: Required one");
    const done = finish(setAnswer(w, "a1", "yes", "", at), at);
    expect(done.finishedAt).toBe(localIso(at));
  });

  it("needs a note for every No answer, required or not", () => {
    let w = newWalk(template, "S", "CA", at);
    w = setAnswer(w, "a1", "yes", "", at);
    w = setAnswer(w, "a2", "no", "   ", at);
    expect(problems(w)).toEqual([{ itemId: "a2", message: 'Add a note for "No": Optional one' }]);
    w = setAnswer(w, "a2", "no", "Light 3 out, ticket raised", at);
    expect(problems(w)).toEqual([]);
  });

  it("refuses to change a finished walk or an unknown item", () => {
    const w = setAnswer(newWalk(template, "S", "CA", at), "a1", "na", "", at);
    expect(() => setAnswer(w, "zz", "yes", "")).toThrow("Unknown item");
    const done = finish(w, at);
    expect(() => setAnswer(done, "a1", "no", "x")).toThrow("finished");
    expect(finish(done)).toBe(done);
  });

  it("formats local time with an offset", () => {
    expect(localIso(at)).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[+-]\d\d:\d\d$/);
  });
});

describe("templates", () => {
  it("ships valid opening and closing templates", () => {
    expect(builtInTemplates.map((t) => t.id)).toEqual(["opening", "closing"]);
  });

  it("rejects duplicate item ids and empty sections", () => {
    const dup = { id: "x", name: "X", sections: [{ title: "S", items: [{ id: "a", text: "1" }, { id: "a", text: "2" }] }] };
    expect(() => validateTemplate(dup)).toThrow('duplicate item id "a"');
    expect(() => validateTemplate({ id: "x", name: "X", sections: [] })).toThrow("no sections");
    expect(() => validateTemplate(null)).toThrow("non-empty id and name");
  });
});
