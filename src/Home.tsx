import { useEffect, useState, type FormEvent } from "react";
import { summary, walksToCsv } from "./csv";
import { deleteWalk, listWalks, saveWalk } from "./db";
import { downloadText } from "./download";
import { newWalk, progress, shortTime, type Walk } from "./model";
import { builtInTemplates } from "./templates";

const LAST = "store-walk:last";

export function Home({ onOpen }: { onOpen: (id: string) => void }) {
  const last = JSON.parse(localStorage.getItem(LAST) ?? "{}") as { store?: string; by?: string };
  const [walks, setWalks] = useState<Walk[] | null>(null);
  const [templateId, setTemplateId] = useState(builtInTemplates[0].id);
  const [store, setStore] = useState(last.store ?? "");
  const [by, setBy] = useState(last.by ?? "");

  const reload = () => listWalks().then(setWalks);
  useEffect(() => {
    void reload();
  }, []);

  async function start(e: FormEvent) {
    e.preventDefault();
    const template = builtInTemplates.find((t) => t.id === templateId)!;
    const walk = newWalk(template, store, by);
    localStorage.setItem(LAST, JSON.stringify({ store: walk.store, by: walk.by }));
    await saveWalk(walk);
    onOpen(walk.id);
  }

  async function remove(w: Walk) {
    if (!confirm(`Delete the ${w.templateName} walk for ${w.store} started ${shortTime(w.startedAt)}?`)) return;
    await deleteWalk(w.id);
    await reload();
  }

  const open = walks?.filter((w) => !w.finishedAt) ?? [];
  const done = walks?.filter((w) => w.finishedAt) ?? [];

  return (
    <main>
      <h1>store-walk</h1>
      <form onSubmit={start} aria-labelledby="start-heading">
        <h2 id="start-heading">Start a walk</h2>
        <label htmlFor="start-checklist">Checklist</label>
        <select id="start-checklist" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {builtInTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <label htmlFor="start-store">Store</label>
        <input id="start-store" required value={store} onChange={(e) => setStore(e.target.value)} autoComplete="off" />
        <label htmlFor="start-by">Your name or initials</label>
        <input id="start-by" required value={by} onChange={(e) => setBy(e.target.value)} autoComplete="off" />
        <button type="submit">Start</button>
      </form>

      <section aria-labelledby="open-heading">
        <h2 id="open-heading">In progress</h2>
        {walks === null ? <p>Loading...</p> : open.length === 0 ? <p>No walks in progress.</p> : null}
        <ul className="walks">
          {open.map((w) => {
            const p = progress(w);
            return (
              <li key={w.id}>
                <span>
                  {w.templateName}, {w.store}, started {shortTime(w.startedAt)}. {p.answered} of {p.total} answered.
                </span>
                <button onClick={() => onOpen(w.id)}>Continue</button>
                <button className="secondary" onClick={() => remove(w)}>
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="done-heading">
        <h2 id="done-heading">Finished</h2>
        {walks !== null && done.length === 0 ? <p>No finished walks yet.</p> : null}
        {done.length > 0 ? (
          <button onClick={() => downloadText("store-walk-all.csv", walksToCsv(done))}>
            Download all finished as CSV
          </button>
        ) : null}
        <ul className="walks">
          {done.map((w) => {
            const s = summary(w);
            return (
              <li key={w.id}>
                <span>
                  {w.templateName}, {w.store}, finished {shortTime(w.finishedAt!)} by {w.by}. {s.yes} Yes, {s.no} No, {s.na} N/A
                  {s.open ? `, ${s.open} not answered` : ""}.
                </span>
                <button onClick={() => onOpen(w.id)}>View</button>
                <button
                  className="secondary"
                  onClick={() => downloadText(`store-walk-${w.templateId}-${w.startedAt.slice(0, 10)}.csv`, walksToCsv([w]))}
                >
                  CSV
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
