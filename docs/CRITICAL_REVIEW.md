# Critical Technical Review — ClawBrain PRD

**Reviewer:** Senior Technical Advisor  
**Date:** 2026-02-05  
**Scope:** Full architecture, integration, and delivery risk assessment

---

## Executive Summary

The PRD describes an elegant file-based architecture, but glosses over several high-severity issues that will surface immediately in development. The biggest risks are around **file I/O concurrency**, **OpenClaw integration assumptions**, and **underestimated complexity in "simple" features** like real-time sync.

**Verdict:** Buildable, but only if the top 5 risks are addressed before coding begins.

---

## 🔴 Top 5 Risks (Ranked by Severity)

### 1. FILE CONCURRENCY & DATA CORRUPTION — SEVERITY: CRITICAL

**The Problem:**  
Two writers (OpenClaw skill + Dashboard) + no file locking = guaranteed corruption. The PRD states "bidirectional sync" but provides no mechanism for:
- Atomic writes
- Concurrent modification detection
- Conflict resolution

**Evidence:**
```
PRD says: "Updates sync bidirectionally (file changes reflect in both places)"
Reality:  What happens when OpenClaw writes while user is editing in UI?
```

**When it will bite:** Week 1, first time someone drags a card while OpenClaw is processing a command.

**Recommendations:**
1. Implement atomic writes (write to temp file → atomic rename)
2. Add file-level locking with `proper-lockfile` or similar
3. Include `lastModified` timestamp in task frontmatter for conflict detection
4. Add a conflict resolution UI ("File changed externally. Reload or overwrite?")

**Missing Story:**
```json
{
  "id": "CB-011",
  "title": "File Concurrency & Locking",
  "description": "Implement atomic writes and conflict detection for task files",
  "acceptance": [
    "Atomic file writes (temp → rename pattern)",
    "File locking prevents concurrent writes",
    "Conflict detection via timestamps",
    "UI for resolving conflicts",
    "Graceful handling of external modifications"
  ],
  "status": "todo",
  "priority": "high"
}
```

---

### 2. OPENCLAW INTEGRATION IS UNDERSPECIFIED — SEVERITY: CRITICAL

**The Problem:**  
The Chat Panel story (CB-005) assumes seamless OpenClaw CLI integration, but the PRD doesn't specify:
- How the Dashboard spawns OpenClaw sessions
- How the task-manager skill is "pre-loaded"
- Session lifecycle management (reconnect on crash?)
- Authentication between Dashboard and OpenClaw

**Evidence:**
```
PRD says: "Connects to local OpenClaw instance", "Task manager skill pre-loaded"
Reality:  No mention of spawn mechanism, socket/pipe communication, or session persistence
```

**When it will bite:** Week 2, when the team realizes they need to build an OpenClaw bridge, not just "connect to CLI."

**Recommendations:**
1. Define the integration architecture explicitly:
   - Option A: Dashboard spawns `openclaw` process, communicates via stdio
   - Option B: Dashboard connects to OpenClaw Gateway via WebSocket
   - Option C: Embed OpenClaw as a library (if available)
2. Add session recovery logic (auto-reconnect on disconnect)
3. Define skill loading mechanism (CLI flag? Config file?)
4. Document the communication protocol

**Missing Story:**
```json
{
  "id": "CB-012",
  "title": "OpenClaw Session Bridge",
  "description": "Implement reliable communication layer between Dashboard and OpenClaw CLI",
  "acceptance": [
    "Spawn and manage OpenClaw process lifecycle",
    "Bidirectional message passing (Dashboard ↔ OpenClaw)",
    "Auto-reconnect on session failure",
    "Pre-load task-manager skill on session start",
    "Session state recovery after reconnect"
  ],
  "status": "todo",
  "priority": "high"
}
```

---

### 3. PATH TRAVERSAL & SECURITY VULNERABILITIES — SEVERITY: HIGH

**The Problem:**  
The API routes accept task IDs/paths from the client with no validation. This is a path traversal vulnerability waiting to happen.

**Evidence:**
```
PRD shows: GET /api/tasks/[id] - get single task
Attack:   GET /api/tasks/../../../.env
```

**When it will bite:** Immediately if this ever touches the internet (or a malicious local user).

**Recommendations:**
1. Strict input validation on all API routes
2. Path normalization and sandboxing:
   ```typescript
   const safePath = path.normalize(id).replace(/^(\.\.[\/\\])+/, '');
   const fullPath = path.join(SANDBOX_ROOT, safePath);
   if (!fullPath.startsWith(SANDBOX_ROOT)) throw new Error('Invalid path');
   ```
3. Use UUIDs for task IDs only (reject paths with slashes)
4. Consider chroot jail or containerization for file operations
5. Add rate limiting to file API routes

**Missing Story:**
```json
{
  "id": "CB-013",
  "title": "Security Hardening",
  "description": "Implement path traversal protection and input validation",
  "acceptance": [
    "All file paths validated and sandboxed",
    "UUID-only task IDs (no path characters allowed)",
    "Rate limiting on file operations",
    "Input sanitization for task content",
    "Security audit of API routes"
  ],
  "status": "todo",
  "priority": "high"
}
```

---

### 4. FILE WATCHING AT SCALE — SEVERITY: MEDIUM-HIGH

**The Problem:**  
Chokidar is listed as the file watching solution, but the PRD doesn't address:
- Chokidar's performance degrades significantly with 1000+ files
- macOS has file descriptor limits (ulimit)
- No debouncing strategy specified
- No handling of rapid successive changes

**Evidence:**
```
PRD says: "File watching for real-time updates"
Reality:  CB-008 mentions debouncing but provides no specifics
```

**When it will bite:** Week 3-4, when a user imports 2000 tasks and the UI becomes unresponsive.

**Recommendations:**
1. Implement pagination for task loading (don't load everything into memory)
2. Use a debounce of at least 100-300ms on file watchers
3. Consider using `fs.watch` directly for simple cases (faster, lighter)
4. Add a "watch mode" toggle (disable for large projects)
5. Monitor memory usage of file watchers
6. Implement virtual scrolling for Kanban (don't render 1000 cards)

**Missing Story:**
```json
{
  "id": "CB-014",
  "title": "Performance at Scale",
  "description": "Ensure dashboard remains responsive with large task volumes",
  "acceptance": [
    "Virtual scrolling for Kanban (react-window or similar)",
    "Pagination for task API (default 50 tasks)",
    "Debounced file watcher (300ms)",
    "Memory monitoring for file watchers",
    "Performance benchmarks: <100ms to load 1000 tasks"
  ],
  "status": "todo",
  "priority": "medium"
}
```

---

### 5. ELECTRON MIGRATION COMPLEXITY — SEVERITY: MEDIUM

**The Problem:**  
The PRD mentions the possibility of becoming a desktop app, but the current architecture (Next.js API routes) is web-first. Migrating to Electron later will require significant refactoring:
- API routes become IPC handlers
- File watching moves to main process
- Security model changes completely (nodeIntegration concerns)

**Evidence:**
```
PRD Stack: "Backend: Next.js API routes (file operations)"
Electron:   Would require main/renderer process split, IPC layer
```

**When it will bite:** Post-MVP, when the team decides they want a desktop app and has to rewrite half the codebase.

**Recommendations:**
1. **Decide now:** Web-only or Electron? Don't defer.
2. If Electron is likely, consider starting with Tauri or Electron from day 1
3. If staying web, abstract file operations behind an interface:
   ```typescript
   interface FileProvider {
     read(path: string): Promise<string>;
     write(path: string, content: string): Promise<void>;
     watch(path: string, callback: () => void): () => void;
   }
   // Implementations: WebFileProvider (uses API routes), ElectronFileProvider (uses fs directly)
   ```
4. This abstraction makes future migration trivial

**Missing Story:**
```json
{
  "id": "CB-015",
  "title": "File Provider Abstraction",
  "description": "Abstract file operations to support web and desktop targets",
  "acceptance": [
    "FileProvider interface defined",
    "WebFileProvider implementation (uses API routes)",
    "File operations use provider, not direct API calls",
    "Documentation for adding ElectronFileProvider later"
  ],
  "status": "todo",
  "priority": "medium"
}
```

---

## Additional Technical Concerns

### YAML Frontmatter Parsing
The task format uses YAML frontmatter. The PRD doesn't specify:
- Which YAML library (js-yaml? yaml?)
- Error handling for malformed YAML
- Schema validation for required fields

**Risk:** One malformed task file could crash the entire dashboard.

**Fix:** Use a schema validator (Zod) and wrap parsing in try/catch with graceful degradation.

---

### No Backup/Versioning Strategy
The PRD mentions "files are the source of truth" but doesn't address:
- Accidental deletion recovery
- Task history/audit trail
- Corruption recovery

**Fix:** Implement a simple git-based backup or periodic snapshots to `~/.clawdbrain/backups/`.

---

### Zustand State Management Risks
CB-001 lists Zustand but doesn't specify:
- State structure for tasks
- How file changes propagate to Zustand
- Persistence strategy (if any)

**Risk:** State could get out of sync with files, leading to stale UI.

**Fix:** Treat files as the source of truth, Zustand as a cache. File watcher updates Zustand, never the reverse.

---

### Chat Message Persistence
CB-005 mentions "Message history persistence" but doesn't specify:
- Storage format (files? SQLite?)
- Privacy implications (chat logs on disk)
- Retention policy

**Fix:** Store chat history in `~/.clawdbrain/sessions/` with rotation (keep last 30 days).

---

### Error Boundaries & Resilience
CB-010 mentions "Error boundaries" as a low-priority polish item. This is wrong.

**Risk:** Without error boundaries, one malformed task crashes the whole Kanban.

**Fix:** Move error boundaries to high priority. Wrap Kanban, Chat, and Sidebar in separate error boundaries.

---

## Scope Creep Traps to Watch

| Feature | Looks Simple | Hidden Complexity |
|---------|--------------|-------------------|
| Drag & Drop | "Just use dnd-kit" | Drag previews, mobile touch handling, accessibility, drop animations |
| Real-time Sync | "Just watch files" | Rename events, permission errors, network drives, debouncing, conflicts |
| Chat Panel | "Use AI Elements" | Session management, reconnect logic, streaming responses, rate limits |
| Self-hosting | "Just clone and run" | OpenClaw dependency, skill installation, config management, updates |
| Mono Grid Design | "Just CSS" | Custom scrollbar styling, responsive breakpoints, dark mode toggle |

---

## Recommended Priority Reordering

**Current CB-010 (Polish) items that should be HIGH priority:**
- Error boundaries
- Loading states
- Input validation

**Current HIGH priority items that need more detail:**
- CB-003 (File System API) — needs security audit
- CB-005 (Chat Panel) — needs integration spec
- CB-008 (Real-time Sync) — needs scale testing plan

---

## Questions for the Team

1. **Is Electron in scope for MVP or not?** Decide now, not later.
2. **How does the Dashboard find OpenClaw?** Expect it in $PATH? Configurable? Auto-detect?
3. **What's the story for multiple users?** Even "self-hosted" might have family members. File locking becomes critical.
4. **Do we need offline support?** If the file watcher fails, does the UI show stale data or error?
5. **What's the migration path for existing task systems?** (Todoist, Notion, etc.)

---

## Final Recommendations

1. **Add the 5 missing stories (CB-011 through CB-015) to prd.json before starting development**
2. **Write the OpenClaw integration spec first** — it's the riskiest unknown
3. **Implement the FileProvider abstraction from day 1** — even if web-only initially
4. **Security audit the API routes before any public release**
5. **Set up performance benchmarks early** — test with 1000+ tasks from week 1

The PRD has a solid vision and clean architecture. These issues are all fixable, but only if caught now. Better to spend 2 days on the spec than 2 weeks debugging race conditions at 2am.

---

*Review completed. Recommend scheduling a follow-up after team reads this document.*
