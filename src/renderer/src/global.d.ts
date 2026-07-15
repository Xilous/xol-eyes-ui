import type { Pick, TabInfo, AppInfo } from "./types";

export {};

type Unsub = () => void;

interface XolApi {
  info(): Promise<AppInfo>;
  listTabs(): Promise<boolean>;
  startPick(tabId: number): Promise<boolean>;
  stopPick(tabId: number): Promise<boolean>;
  submitPicks(picks: Pick[]): Promise<number>;
  copyPicks(picks: Pick[]): Promise<boolean>;
  revealInbox(): Promise<void>;
  checkUpdate(): Promise<unknown>;
  restartToUpdate(): void;
  on(channel: string, cb: (payload: never) => void): Unsub;
}

declare global {
  interface Window {
    xol: XolApi;
    // referenced only to keep TabInfo imported for consumers of this file
    __xolTypes?: TabInfo;
  }
}
