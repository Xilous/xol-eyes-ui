xol eyes ui

pick elements on webpages - including the tabs Claude in Chrome drives - attach a
comment to each, queue them across pages, then hand the batch to Claude Code. a
self-updating windows desktop app plus a thin companion chrome extension.

why two parts
- the extension is the only thing that can touch pages in your real, logged-in
  chrome without relaunching it or fighting Claude's debugger. it injects the
  picker with chrome.scripting (which does not conflict with the chrome.debugger
  that Claude in Chrome attaches) and reads tab groups with chrome.tabGroups.
- the desktop app is the only thing that can render a real control surface, write
  picks to the Claude Code inbox on disk, and self-update from github releases.
- each half exists because the other physically cannot do that job.

how it flows
- the injected overlay captures a pick (selector, text, react component + source
  when the dev fiber exposes it) and your comment
- the extension relays it over a localhost websocket to the desktop app
- the app queues it; on submit it writes ~/.claude/xol-eyes/inbox.jsonl (or copies
  a formatted batch to the clipboard)
- you run /pick in Claude Code and it applies the edits, then clears the inbox

install
- desktop app: grab the latest Xol-Eyes-UI-Setup exe from releases and run it.
  windows smartscreen shows a one-time "run anyway" for the unsigned installer;
  every auto-update after that is silent.
- extension: chrome -> extensions -> enable developer mode -> load unpacked ->
  select the extension/ folder.
- command: copy command/pick.md into ~/.claude/commands/ so /pick is available.

updates
- the app checks github releases on launch and hourly. when a new version is
  downloaded it shows a notice with a "restart now to update" button.
- every merge to main publishes a new release via github actions, so the app
  always has something to update to.

layout
- src/main - electron main: window, websocket server, inbox writer, updater
- src/preload - context-isolated bridge to the renderer
- src/renderer - react + mui + motion control panel
- extension - mv3 companion (background + content bridge + injected overlay)
- command/pick.md - the /pick slash command for Claude Code
- .github/workflows - release on merge to main, ci on prs
