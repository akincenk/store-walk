import { useEffect, useState } from "react";
import { getWalk, saveWalk } from "./db";
import { finish, problems, progress, setAnswer, type Answer, type Problem, type Walk } from "./model";

const CHOICES: [Answer, string][] = [
  ["yes", "Yes"],
  ["no", "No"],
  ["na", "N/A"],
];

export function WalkView({ id, onBack }: { id: string; onBack: () => void }) {
  const [walk, setWalk] = useState<Walk | null | undefined>(undefined);
  const [shown, setShown] = useState<Problem[]>([]);

  useEffect(() => {
    getWalk(id).then((w) => setWalk(w ?? null));
  }, [id]);

  if (walk === undefined) return <main><p>Loading...</p></main>;
  if (walk === null) {
    return (
      <main>
        <p role="alert">This walk was not found. It may have been deleted.</p>
        <button onClick={onBack}>Back to list</button>
      </main>
    );
  }
  const current = walk;
  const locked = Boolean(current.finishedAt);

  async function update(itemId: string, value: Answer, note: string) {
    const next = setAnswer(current, itemId, value, note);
    setWalk(next);
    if (shown.length) setShown(problems(next));
    await saveWalk(next);
  }

  async function tryFinish() {
    const blocking = problems(current);
    setShown(blocking);
    if (blocking.length) {
      document.getElementById("problems")?.focus();
      return;
    }
    await saveWalk(finish(current));
    onBack();
  }

  const p = progress(current);
  return (
    <main>
      <button className="secondary" onClick={onBack}>
        Back to list
      </button>
      <h1>{current.templateName}</h1>
      <p>
        {current.store}, {current.by}, started {current.startedAt}
        {locked ? `, finished ${current.finishedAt}` : ""}.
      </p>
      <p aria-live="polite">
        {p.answered} of {p.total} answered
      </p>

      {shown.length > 0 ? (
        <div id="problems" role="alert" tabIndex={-1} className="problems">
          <p>Before finishing:</p>
          <ul>
            {shown.map((pr) => (
              <li key={pr.itemId + pr.message}>
                <a href={`#item-${pr.itemId}`}>{pr.message}</a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {current.sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          {section.items.map((item) => {
            const a = current.answers[item.id];
            const flagged = shown.some((pr) => pr.itemId === item.id);
            return (
              <fieldset key={item.id} id={`item-${item.id}`} className={flagged ? "flagged" : undefined} disabled={locked}>
                <legend>
                  {item.text}
                  {item.required ? <span className="req"> (required)</span> : null}
                </legend>
                <div className="choices">
                  {CHOICES.map(([value, label]) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name={item.id}
                        value={value}
                        checked={a?.value === value}
                        onChange={() => update(item.id, value, a?.note ?? "")}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {a ? (
                  <label className="note">
                    Note{a.value === "no" ? " (needed for No)" : ""}
                    <textarea value={a.note} rows={2} onChange={(e) => update(item.id, a.value, e.target.value)} />
                  </label>
                ) : null}
              </fieldset>
            );
          })}
        </section>
      ))}

      {locked ? null : <button onClick={tryFinish}>Finish walk</button>}
    </main>
  );
}
