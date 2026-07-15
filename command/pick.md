---
description: Apply queued Xol Eyes UI picks from the inbox to the current project
argument-hint: "[origin filter, optional]"
allowed-tools: Read, Edit, Write, Grep, Glob, Bash
---
Read the Xol Eyes UI pick inbox and apply each queued UI change to the current project.

inbox location: `~/.claude/xol-eyes/inbox.jsonl` (one JSON pick per line). on windows this is `C:\Users\<you>\.claude\xol-eyes\inbox.jsonl`.

steps:
1. read the inbox file. if it is missing or empty, tell the user "no picks queued" and stop.
2. parse each line as a pick object: `{ url, origin, pathname, element:{tag,id,classes,text,selector,attrs}, react:{component,breadcrumb,source}, comment }`.
3. group picks by `origin`. if arguments were passed ($ARGUMENTS), only process picks whose origin or url contains that string.
4. show the user a numbered summary - for each pick: the element (tag + visible text), its route, its react component/source when present, and the comment.
5. if picks come from more than one origin and it is ambiguous which belong to the repo you are in, ask which origin(s) to apply before editing. only apply picks that belong to the current project.
6. for each pick you will apply, locate the source:
   - if `react.source` is present, open that `file:line`, resolving it inside the current repo (search if the path is relative or shifted).
   - otherwise use `react.component` (grep for the component), then the element `text` / `classes` / `selector` to pinpoint the exact element.
7. make the change the `comment` asks for, matching the surrounding code style. each comment is the change request for that specific element.
8. after applying, clear the picks you processed: rewrite `inbox.jsonl` keeping only unprocessed lines, or empty it if all were applied.
9. summarize what changed, file by file.

do not run the app or push anything - just apply the edits and clear the processed picks.
