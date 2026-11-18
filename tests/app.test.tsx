import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";
import { listWalks } from "../src/db";

afterEach(cleanup);

async function startWalk(user: ReturnType<typeof userEvent.setup>, checklist: string) {
  await user.selectOptions(screen.getByLabelText("Checklist"), checklist);
  // The form remembers the last store and name, so clear before typing.
  await user.clear(screen.getByLabelText("Store"));
  await user.type(screen.getByLabelText("Store"), "Store 7");
  await user.clear(screen.getByLabelText("Your name or initials"));
  await user.type(screen.getByLabelText("Your name or initials"), "JD");
  await user.click(screen.getByRole("button", { name: "Start" }));
  await screen.findByRole("heading", { level: 1, name: checklist });
}

describe("app", () => {
  it("walks a closing checklist from start to finished CSV", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("No walks in progress.");
    await startWalk(user, "Store closing");

    await user.click(screen.getByRole("button", { name: "Finish walk" }));
    const alert = screen.getByRole("alert");
    expect(within(alert).getByText(/Not answered: Tills counted/)).toBeTruthy();

    const groups = screen.getAllByRole("group");
    for (const g of groups) await user.click(within(g).getByLabelText("Yes"));
    const tills = screen.getByRole("group", { name: /Tills counted/ });
    await user.click(within(tills).getByLabelText("No"));
    await user.click(screen.getByRole("button", { name: "Finish walk" }));
    expect(within(screen.getByRole("alert")).getByText(/Add a note for "No": Tills counted/)).toBeTruthy();

    await user.type(within(tills).getByLabelText(/Note/), "Till 2 over by $1.20");
    expect(screen.queryByRole("alert")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Finish walk" }));

    await screen.findByText(/9 yes, 1 no, 0 n.a./);
    const [walk] = await listWalks();
    expect(walk.finishedAt).toBeTruthy();
    expect(walk.answers["close-tills"].note).toBe("Till 2 over by $1.20");

    const create = vi.fn(() => "blob:x");
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() }));
    await user.click(screen.getByRole("button", { name: "Download all finished as CSV" }));
    expect(create).toHaveBeenCalledOnce();
  });

  it("keeps a walk in progress and resumes it", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByDisplayValue("Store 7")).toBeTruthy();
    await startWalk(user, "Store opening");
    await user.click(within(screen.getByRole("group", { name: /Alarm disarmed/ })).getByLabelText("Yes"));
    await user.click(screen.getByRole("button", { name: "Back to list" }));
    await screen.findByText(/Store opening, Store 7, started .*1 of 13 answered/);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    const alarm = await screen.findByRole("group", { name: /Alarm disarmed/ });
    expect((within(alarm).getByLabelText("Yes") as HTMLInputElement).checked).toBe(true);
  });
});
