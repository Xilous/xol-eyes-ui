interface PickShape {
  origin?: string;
  url?: string;
  pathname?: string;
  comment?: string;
  element?: {
    tag?: string;
    id?: string | null;
    classes?: string[];
    text?: string;
    selector?: string;
  };
  react?: {
    component?: string | null;
    breadcrumb?: string[];
    source?: { file: string; line: number } | null;
  } | null;
}

// Human-readable batch for the clipboard path (pasted straight into Claude Code).
export function formatBatch(picks: PickShape[]): string {
  const origin = picks[0]?.origin || picks[0]?.url || "";
  const lines = [`[xol-eyes] ${picks.length} pick(s)${origin ? " from " + origin : ""}`, ""];
  picks.forEach((p, i) => {
    const e = p.element || {};
    const head =
      `#${i + 1}  ${e.tag || "?"}${e.id ? "#" + e.id : ""}` +
      (e.classes?.length ? "." + e.classes.slice(0, 2).join(".") : "") +
      (e.text ? `  "${e.text}"` : "");
    lines.push(head);
    if (p.pathname) lines.push(`    route      ${p.pathname}`);
    if (p.react?.component) {
      const bc = p.react.breadcrumb?.length ? `  (${p.react.breadcrumb.join(" > ")})` : "";
      lines.push(`    component  ${p.react.component}${bc}`);
    }
    if (p.react?.source) lines.push(`    source     ${p.react.source.file}:${p.react.source.line}`);
    if (e.selector) lines.push(`    selector   ${e.selector}`);
    lines.push(`    comment    ${p.comment || ""}`);
    lines.push("");
  });
  return lines.join("\n");
}
