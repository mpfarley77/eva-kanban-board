# Supabase RLS Hardening Plan (Kanban)

This document outlines the next production hardening step: move owner isolation from app-layer checks into database-enforced Row Level Security (RLS).

## Goals

- Enforce `owner = 'Eva'` access at the database layer
- Keep app behavior unchanged for current single-owner use
- Prevent accidental cross-owner reads/writes if app checks regress

## Prerequisites

- `tasks` table includes an `owner text not null` column
- Existing rows are backfilled with `owner = 'Eva'` where null
- Service role key remains server-only

## SQL Migration (example)

```sql
-- 1) Ensure owner column exists + is populated
alter table public.tasks
  add column if not exists owner text;

update public.tasks
set owner = 'Eva'
where owner is null;

alter table public.tasks
  alter column owner set not null;

-- 2) Enable RLS
alter table public.tasks enable row level security;

-- 3) Remove overly broad policies (names may differ in your project)
drop policy if exists "tasks_select_all" on public.tasks;
drop policy if exists "tasks_insert_all" on public.tasks;
drop policy if exists "tasks_update_all" on public.tasks;
drop policy if exists "tasks_delete_all" on public.tasks;

-- 4) Create owner-scoped policies
create policy "tasks_select_owner"
on public.tasks
for select
using (owner = 'Eva');

create policy "tasks_insert_owner"
on public.tasks
for insert
with check (owner = 'Eva');

create policy "tasks_update_owner"
on public.tasks
for update
using (owner = 'Eva')
with check (owner = 'Eva');

create policy "tasks_delete_owner"
on public.tasks
for delete
using (owner = 'Eva');
```

## Verification Checklist

1. Query tasks via app: existing board loads normally.
2. Create/update/delete task from app: succeeds.
3. Attempt SQL update for another owner value from non-service context: blocked.
4. Automation endpoints (`seed`, `rebucket`) still function for `owner='Eva'` rows.
5. `npm run lint` and `npm run build` remain green after app-level cleanup.

## Follow-up App Cleanup (after RLS proven)

- Keep current owner filters as defense-in-depth OR remove duplicates selectively.
- Add server-side audit table (`task_events`) for immutable activity history.
