create extension if not exists pgcrypto;
create table if not exists public.telemetry (
  id uuid primary key default gen_random_uuid(),
  device_id text not null default 'ESP32-CHUTE-01',
  timestamp timestamptz not null default now(),
  flow_rate double precision not null default 0,
  level_pct double precision not null default 0,
  vibration_rms double precision not null default 0,
  weight_kg double precision not null default 0,
  inlet_flow boolean not null default false,
  outlet_flow boolean not null default false,
  temperature_c double precision not null default 0,
  blockage_probability double precision not null default 0,
  state text not null default 'NORMAL',
  cv_score double precision not null default 0
);
create index if not exists idx_telemetry_ts on public.telemetry(timestamp desc);
create index if not exists idx_telemetry_device_ts on public.telemetry(device_id, timestamp desc);
create table if not exists public.commands (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  command text not null,
  value text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists idx_commands_status_time on public.commands(status, created_at);
alter table public.telemetry enable row level security;
alter table public.commands enable row level security;
create policy "telemetry read" on public.telemetry for select using (true);
create policy "no public command write" on public.commands for all using (false) with check (false);
alter publication supabase_realtime add table public.telemetry;
