# Kanban vNext Test Checklist

Use this checklist to validate current behavior before/after deploy.

## 1) Authentication

- [ ] Open `/login` while logged out: login form is shown.
- [ ] Enter wrong password: error message appears.
- [ ] Enter correct password: redirected to `/` board.
- [ ] Open `/` in new tab after login: remains authenticated.
- [ ] Click **Logout**: redirected to `/login` and session is cleared.
- [ ] Try opening `/` after logout: redirected back to `/login`.

## 2) Task Creation

- [ ] Create task with title only + objective + priority.
- [ ] Create task with optional **Project** value.
- [ ] Title with extra spaces gets normalized (no double spaces).
- [ ] Empty title is rejected.
- [ ] Title > 140 chars is rejected.
- [ ] Project > 80 chars is rejected.
- [ ] Duplicate title in same objective is rejected with conflict error.

## 3) Board Flow + WIP Limit (4-stage)

- [ ] Move Backlog task to In Progress with **Next →**.
- [ ] Move In Progress task to Review with **Next →**.
- [ ] Move Review task to Completed with **Next →**.
- [ ] Move Completed task back to Review with **← Back**.
- [ ] Move Review task back to In Progress with **← Back**.
- [ ] Try moving a second task into In Progress: blocked by WIP limit.

## 4) Priority + Ordering

- [ ] Change task priority from dropdown and refresh page; value persists.
- [ ] In Backlog, click **↑/↓** to reorder tasks; order persists after refresh.

## 5) Project + Filter Controls

- [ ] Edit per-task **Project** field and blur input; value persists after refresh.
- [ ] Clear per-task Project value and blur; becomes unassigned.
- [ ] Use **Project view** filter to show one project only.
- [ ] Use **Objective** filter and verify results narrow correctly.
- [ ] Use **Risk** filter (normal/watch/at_risk/blocked) and verify results.
- [ ] Use **Time** filter (due <24h / stale in-progress) and verify results.
- [ ] Use Search to match by title, project, and blocker text.
- [ ] Combine filters + search and verify intersection behavior.
- [ ] Click **Clear filters** and verify full board returns.
- [ ] Refresh page and confirm filter/search preferences persist.

## 6) Drag-and-Drop Column Movement

- [ ] Drag Backlog card into In Progress; move persists after refresh.
- [ ] Drag In Progress card into Review; move persists after refresh.
- [ ] Drag Review card into Completed; move persists after refresh.
- [ ] Verify drop target column highlights while dragging.
- [ ] Try dragging second card into In Progress when one already exists; WIP limit still enforced.

## 7) Delete, Duplicate + Sync

- [ ] Duplicate a task and verify copied objective/project/priority are retained.
- [ ] Delete a task from each column; confirm removed immediately.
- [ ] With **Confirm delete** enabled, verify delete prompt appears and cancel works.
- [ ] Disable **Confirm delete** and verify deletion proceeds without prompt.
- [ ] Use **Clear Completed** and verify all completed tasks are removed.
- [ ] Cancel **Clear Completed** confirmation and verify no tasks are deleted.
- [ ] Refresh page; deleted tasks remain gone.
- [ ] Wait ~30s auto-refresh interval and verify board refreshes without errors.

## 8) Mobile UX + Keyboard Productivity

- [ ] Header remains usable while scrolling (sticky behavior).
- [ ] Buttons are easy to tap (Refresh, Logout, Create, card actions).
- [ ] Add Task inputs/selects are comfortable to interact with.
- [ ] No clipped text or overlapping controls.
- [ ] Toggle controls (Confirm delete, Show relative times, Show activity panel, Compact cards) are usable on touch.
- [ ] Press `/` to focus search input (when not typing in a field).
- [ ] Press `Esc` while search input is focused to clear search query.
- [ ] Press `n` to focus task title input (when not typing in a field).

## 9) Activity + Background Customization

- [ ] Perform actions (create/move/priority/project/delete) and verify Recent Activity updates.
- [ ] Update risk/ETA/blocker and verify activity entries are added.
- [ ] Refresh page; recent activity remains (localStorage persistence).
- [ ] Click **Clear** in Recent Activity; list empties and stays empty after refresh.
- [ ] Toggle **Show activity panel** off/on and verify visibility + persistence after refresh.
- [ ] Set a background image URL and adjust overlay slider; visual changes apply immediately.
- [ ] Refresh page; background URL + overlay value persist.

## 10) Risk, ETA, Blockers + Summary

- [ ] Set task risk to `watch` and `at_risk`; verify values persist after refresh.
- [ ] Set and clear ETA; verify persistence and no API validation errors for valid timestamps.
- [ ] Set and clear blocker reason; verify persistence.
- [ ] Confirm summary chips update correctly: At risk, Watch, Due < 24h, Blocked, Stale in-progress (>48h).
- [ ] Click summary chips and verify corresponding risk/time filters are applied.
- [ ] Move a task to In Progress, simulate/adjust started_at older than 48h, and verify stale badge appears on card.
- [ ] Confirm summary respects active filters (project/objective/risk/time/search).

## 11) Export + Clipboard Summary

- [ ] Click **Export JSON** and verify file downloads.
- [ ] Verify exported payload includes `exportedAt`, `filters`, `count`, and `tasks`.
- [ ] Click **Export CSV** and verify file downloads with expected columns.
- [ ] Apply filters then export; verify JSON/CSV contain only visible filtered tasks.
- [ ] Click **Copy Summary** and paste into a text editor.
- [ ] Verify summary includes timestamp, filter snapshot (including time filter), column counts, risk counts, and Top urgent list.
- [ ] If clipboard is blocked, verify fallback TXT download occurs and user-facing notice appears.

## 12) Automation Endpoints (owner token)

- [ ] `GET /api/automation/seed?token=...` inserts missing seed tasks.
- [ ] `GET /api/automation/seed?token=...&reset=1` resets + reseeds.
- [ ] `GET /api/automation/rebucket?token=...` sets one active task by priority recency rules.
- [ ] Calls without token return Unauthorized.

## 13) Owner Scope + Data Isolation

- [ ] Create tasks as owner and verify `/api/tasks` returns only owner records.
- [ ] PATCH with non-owner task id returns no task update (no cross-owner mutation).
- [ ] DELETE with non-owner task id does not remove other owners' records.
- [ ] Automation `seed/reset/rebucket` affects owner-scoped records only.
- [ ] With service role key set, behavior remains owner-scoped.

## 14) Build/Quality Gates

- [x] `npm run lint` passes.
- [x] `npm run build` passes.

## Optional Regression Notes

Capture any failures with:

- Browser/device
- URL
- Steps to reproduce
- Actual vs expected behavior
- Screenshot (if visual)
