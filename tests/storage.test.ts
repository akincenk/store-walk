import { describe, expect, it } from "vitest";
import { CSV_HEADER, csvField, summary, walksToCsv } from "../src/csv";
import { deleteWalk, getWalk, listWalks, saveWalk } from "../src/db";
import { finish, newWalk, setAnswer } from "../src/model";
import { builtInTemplates } from "../src/templates";

const [opening, closing] = builtInTemplates;

describe("csv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(csvField("plain")).toBe("plain");
    expect(csvField("a,b")).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField("two\nlines")).toBe('"two\nlines"');
  });

  it("keeps formula-looking text as text", () => {
    expect(csvField("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvField("+1")).toBe("'+1");
    expect(csvField("-5 on float")).toBe("'-5 on float");
    expect(csvField("@sum")).toBe("'@sum");
  });

  it("writes one row per item with answers and blanks", () => {
    let w = newWalk(opening, "Store 7", "CA", new Date("2026-11-18T07:00:00Z"));
    w = setAnswer(w, "open-float", "no", "Till 2 short $5, recounted", new Date("2026-11-18T07:05:00Z"));
    const lines = walksToCsv([w]).trimEnd().split("\r\n");
    expect(lines[0]).toBe(CSV_HEADER.join(","));
    expect(lines).toHaveLength(1 + 13);
    const float = lines.find((l) => l.includes(",open-float,"))!;
    expect(float).toContain(',yes,no,"Till 2 short $5, recounted",');
    expect(lines.find((l) => l.includes(",open-alarm,"))).toMatch(/,yes,,,$/);
  });

  it("counts answers for the walk list", () => {
    let w = newWalk(closing, "S", "CA");
    w = setAnswer(w, "close-empty", "yes", "");
    w = setAnswer(w, "close-power", "na", "");
    expect(summary(w)).toEqual({ yes: 1, no: 0, na: 1, open: 8 });
  });
});

describe("db", () => {
  it("saves, lists newest first, and deletes", async () => {
    const older = newWalk(opening, "S", "CA", new Date("2026-11-17T07:00:00"));
    let newer = newWalk(closing, "S", "CA", new Date("2026-11-17T22:00:00"));
    await saveWalk(older);
    await saveWalk(newer);
    newer = setAnswer(newer, "close-empty", "yes", "");
    await saveWalk(newer);
    expect((await listWalks()).map((w) => w.id)).toEqual([newer.id, older.id]);
    expect((await getWalk(newer.id))?.answers["close-empty"]?.value).toBe("yes");
    await deleteWalk(older.id);
    expect(await getWalk(older.id)).toBeUndefined();
  });

  it("keeps a finished walk exactly as saved", async () => {
    let w = newWalk(closing, "S", "CA");
    for (const s of w.sections) for (const i of s.items) w = setAnswer(w, i.id, "yes", "");
    const done = finish(w);
    await saveWalk(done);
    expect(await getWalk(done.id)).toEqual(done);
  });
});
