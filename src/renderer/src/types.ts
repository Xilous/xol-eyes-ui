export interface TabInfo {
  id: number;
  title: string;
  url: string;
  windowId: number;
  groupId: number;
  groupTitle?: string;
  groupColor?: string;
  active?: boolean;
  claude?: boolean;
}

export interface Pick {
  id: string;
  ts: string;
  url: string;
  origin: string;
  pathname: string;
  title: string;
  element: {
    tag: string;
    id?: string | null;
    classes: string[];
    text: string;
    selector: string;
    attrs?: Record<string, string>;
  };
  react?: {
    component?: string | null;
    breadcrumb?: string[];
    source?: { file: string; line: number } | null;
  } | null;
  comment: string;
  tabId?: number;
  tabTitle?: string;
}

export interface AppInfo {
  version: string;
  wsPort: number;
  inbox: string;
  connected: boolean;
}
