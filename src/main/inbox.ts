import { promises as fs } from "fs";
import { homedir } from "os";
import { join } from "path";

const dir = () => join(homedir(), ".claude", "xol-eyes");
export const inboxPath = (): string => join(dir(), "inbox.jsonl");

export async function appendPicks(picks: unknown[]): Promise<number> {
  if (!Array.isArray(picks) || picks.length === 0) return 0;
  await fs.mkdir(dir(), { recursive: true });
  const lines = picks.map((p) => JSON.stringify(p)).join("\n") + "\n";
  await fs.appendFile(inboxPath(), lines, "utf8");
  return picks.length;
}

export async function readInbox(): Promise<unknown[]> {
  try {
    const txt = await fs.readFile(inboxPath(), "utf8");
    return txt
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

export async function clearInbox(): Promise<void> {
  try {
    await fs.writeFile(inboxPath(), "", "utf8");
  } catch {
    /* ignore */
  }
}
