# Realtime presence with Supabase

This document shows how to implement realtime presence (multiple devices logged into the same user) using Supabase.

1) Create a `sessions` table in your Supabase database (run via SQL editor):

```sql
create table public.sessions (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  device_id text not null,
  online boolean default true,
  last_seen timestamptz default now()
);

-- Optional: index for fast user lookups
create index on public.sessions (user_id);
```

2) Minimal policies: if you use Row Level Security (RLS), allow the authenticated user to insert/update/delete their own session rows.

3) Usage (frontend):

Example using the `startPresence` helper (added to `services/realtimeService.ts`):

```ts
import startPresence from '../services/realtimeService'

// generate a device id per browser/device (UUID or localStorage)
const deviceId = localStorage.getItem('deviceId') || crypto.randomUUID()
localStorage.setItem('deviceId', deviceId)

// when user logs in (userId is their unique identifier)
const { stop } = await startPresence(userId, deviceId, (sessions) => {
  // `sessions` contains current rows for this user (one per device)
  console.log('other devices for this user:', sessions)
  // update UI: show online devices, timestamps, etc.
})

// later (logout or page close) call stop()
// await stop()
```

4) Behavior
- When a device starts presence it upserts a row for `user_id`+`device_id` and sends a heartbeat every 30s.
- All clients subscribed for that `user_id` will receive realtime notifications and can refresh the local sessions list.

5) Notes
- If you need presence for ephemeral sessions (socket-like) consider using Supabase Realtime channels or a dedicated presence table. The approach above works well for presence tied to authenticated users.
