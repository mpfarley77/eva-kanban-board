# Patrick Kanban Board (MVP)

A private Kanban board with owner-only authentication and 3 objective categories:

- Skyworks (blue)
- Personal (green)
- Side Hustles (purple)

Columns:
- Backlog
- In Progress
- Review
- Completed

## Security Model (MVP)

- Login uses a server-side password (`KB_PASSWORD`) via `/api/login`.
- Auth session uses secure httpOnly cookie (`kb_auth`) with token value `KB_AUTH_TOKEN`.
- Middleware blocks all app routes unless authenticated.

## Local Run

```bash
npm install
cp .env.example .env.local
# edit .env.local with strong values
npm run dev
```

Open `http://localhost:3000`.

## Deploy (Vercel)

1. Push this folder to GitHub.
2. Import project in Vercel.
3. Set environment variables in Vercel project settings:
   - `KB_PASSWORD`
   - `KB_AUTH_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (recommended for server routes)
   - `KB_AUTOMATION_TOKEN` (for seed/rebucket automation endpoints)
4. Deploy.

## Notes

- Test validation checklist: `TEST-CHECKLIST.md`
- Persistence is currently Supabase-backed for shared multi-device state.
- Includes drag-and-drop between columns, per-task project assignment/filtering, risk + time filtering, and lightweight local activity history.
- Includes optional board background image + overlay customization (saved in localStorage).
- Includes task duplication, filtered JSON/CSV export, clipboard-ready board summary (with TXT fallback), clear-completed bulk cleanup, and optional delete confirmation guardrail.
- Includes optional relative-time labels, stale in-progress (>48h) visual warnings, and activity-panel visibility toggle for focus-friendly card scanning.
- Includes keyboard shortcuts for faster flow (`/` search focus, `Esc` clear search, `n` new-task title focus).
- Add Task form draft is persisted locally (title/project/objective/priority).
- Owner-scoped API authorization is now enforced in task + automation routes.
- Next production step: move owner isolation fully into Supabase RLS policies and add richer server-side audit history.


## Automation seed endpoint (owner-triggered)

Set `KB_AUTOMATION_TOKEN` and trigger:

```
/api/automation/seed?token=<KB_AUTOMATION_TOKEN>&reset=1
```

- `reset=1` clears current tasks first, then seeds current Kanban project tasks.
- Omit `reset=1` to only insert missing seed tasks.
