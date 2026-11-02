-- ============================================================
-- QUELLCODE · database schema (Supabase / PostgreSQL)
-- Rebuilt on 2026-11-02 from the structure of the live database
-- (tables, rules, functions, triggers, storage rules). No rows.
-- Run once in the SQL editor of a new Supabase project.
--
-- Roles: "anon" is the public app. "authenticated" is the
-- moderator signed in to the Kontrollraum (admin.html).
-- Only create moderator accounts you trust, and keep
-- public sign-ups switched off in Supabase Auth.
-- ============================================================

-- ---------- Types ----------
create type pump_status as enum ('working', 'broken', 'unknown', 'missing');
create type moderation_state as enum ('pending', 'approved', 'rejected');

-- ---------- Pumps (seeded from OpenStreetMap, see pipeline/) ----------
create table pumps (
  id                uuid primary key default gen_random_uuid(),
  osm_id            bigint unique,          -- null for pumps added by hand
  lat               double precision not null,
  lng               double precision not null,
  address           text,
  district          text,                   -- Ortsteil, from the ALKIS boundaries
  ref               text,                   -- number on the pump
  model             text,
  install_year      integer,
  notes             text,
  current_status    pump_status not null default 'unknown',
  last_confirmed_at timestamptz,
  report_count      integer not null default 0,
  created_at        timestamptz not null default now()
);
create index pumps_geo_idx on pumps (lat, lng);
create index pumps_status_idx on pumps (current_status);

-- ---------- Status reports (civic layer, published at once) ----------
create table status_reports (
  id         uuid primary key default gen_random_uuid(),
  pump_id    uuid not null references pumps(id) on delete cascade,
  status     pump_status not null,
  created_at timestamptz not null default now()
);
create index status_reports_pump_idx on status_reports (pump_id, created_at desc);

-- ---------- Photos (cultural layer, moderated) ----------
create table photos (
  id           uuid primary key default gen_random_uuid(),
  pump_id      uuid not null references pumps(id) on delete cascade,
  storage_path text not null,
  taken_hint   text,
  state        moderation_state not null default 'pending',
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz
);
create index photos_pump_idx on photos (pump_id) where state = 'approved';
create index photos_queue_idx on photos (created_at) where state = 'pending';

-- ---------- Stories (cultural layer, moderated, five languages) ----------
create table stories (
  id          uuid primary key default gen_random_uuid(),
  pump_id     uuid not null references pumps(id) on delete cascade,
  body        text not null,
  lang        text not null default 'de',
  period_hint text,
  state       moderation_state not null default 'pending',
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz,
  body_de     text,
  body_en     text,
  body_fr     text,
  body_ru     text,
  body_tr     text,
  credit      text,                         -- a name, only with the author's consent
  -- Public submissions: 10 to 2000 characters. Longer texts can only
  -- be added by a moderator, never as a pending submission.
  constraint stories_body_check check (char_length(body) >= 10
    and (char_length(body) <= 2000 or state <> 'pending')),
  constraint stories_lang_check check (lang in ('de', 'en', 'fr', 'ru', 'tr'))
);
create index stories_pump_idx on stories (pump_id) where state = 'approved';
create index stories_queue_idx on stories (created_at) where state = 'pending';

-- ---------- Drinking fountains (separate layer, read only) ----------
create table fountains (
  id         uuid primary key default gen_random_uuid(),
  osm_id     bigint unique,
  lat        double precision not null,
  lng        double precision not null,
  name       text,
  operator   text,                          -- "Berliner Wasserbetriebe" = official
  seasonal   boolean,
  indoor     boolean,
  created_at timestamptz not null default now()
);
create index fountains_geo_idx on fountains (lat, lng);

-- ---------- ECHO: one water fact per year ----------
-- The counter of unchecked pumps reads as a year (it started at 1968).
-- Each first check of a pump opens the next year down.
create table year_facts (
  year       integer primary key check (year between 0 and 1968),
  theme      text not null check (theme in ('berlin', 'world', 'ocean', 'chronik', 'cat', 'yoga')),
  dating     text not null check (dating in ('exact', 'circa', 'era', 'timeless')),
  text_de    text not null,
  text_en    text not null,
  text_fr    text not null,
  text_ru    text not null,
  text_tr    text not null,
  source_url text not null,
  created_at timestamptz not null default now()
);

-- A year can be given to a chosen pump (it swaps with the pump that held it).
create table echo_overrides (
  year    integer primary key,
  pump_id uuid not null unique references pumps(id) on delete cascade
);

-- A short quote shown on a year's card, linked to an approved story.
create table echo_witness (
  year     integer primary key,
  story_id uuid not null references stories(id) on delete cascade,
  pump_id  uuid not null references pumps(id) on delete cascade,
  credit   text not null,
  quote_de text,
  quote_en text,
  quote_fr text,
  quote_ru text,
  quote_tr text
);

-- A story held back until someone checks its pump on site.
create table story_reveals (
  story_id    uuid primary key references stories(id) on delete cascade,
  pump_id     uuid not null references pumps(id) on delete cascade,
  revealed_at timestamptz
);

-- A news card shown once when the app opens, inside a time window.
create table news (
  id        text primary key,
  story_id  uuid references stories(id) on delete cascade,
  pump_id   uuid references pumps(id) on delete cascade,
  title_de  text, title_en text, title_fr text, title_ru text, title_tr text,
  body_de   text, body_en  text, body_fr  text, body_ru  text, body_tr  text,
  starts_at timestamptz not null default now(),
  ends_at   timestamptz
);

-- ---------- Functions and triggers ----------
-- Each status report refreshes the pump's status.
create or replace function apply_status_report()
returns trigger language plpgsql security definer as $$
begin
  update pumps set
    current_status    = new.status,
    last_confirmed_at = new.created_at,
    report_count      = report_count + 1
  where id = new.pump_id;
  return new;
end $$;

create trigger trg_apply_status_report
after insert on status_reports
for each row execute function apply_status_report();

-- The first check of a pump releases any story held for it.
create or replace function reveal_on_check()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update stories s set state = 'approved', reviewed_at = now()
    from story_reveals r
    where r.pump_id = new.pump_id and r.revealed_at is null and s.id = r.story_id;
  update story_reveals set revealed_at = now()
    where pump_id = new.pump_id and revealed_at is null;
  return new;
end $$;

create trigger trg_reveal_on_check
after insert on status_reports
for each row execute function reveal_on_check();

-- The facts of the years opened so far.
create or replace function unlocked_facts()
returns setof year_facts language sql stable security definer set search_path = public as $$
  select * from year_facts
  where year >= greatest(0, 1968 - (select count(*)::int from pumps where last_confirmed_at is not null))
  order by year asc
$$;

-- Which pump opened which year: the Nth pump checked opens 1968 - N,
-- with the swaps from echo_overrides, and the pump's first approved photo.
create or replace function echo_openers()
returns table(year integer, pump_id uuid, ref text, district text, photo_path text)
language sql stable security definer set search_path = public as $$
  with firsts as (
    select pump_id, min(created_at) as first_at from status_reports group by pump_id
  ),
  nat as (
    select pump_id, (1968 - row_number() over (order by first_at, pump_id))::int as y from firsts
  ),
  ov as (
    select o.year as y_new, o.pump_id as p, np.y as p_old, nq.pump_id as q
    from echo_overrides o
    join nat np on np.pump_id = o.pump_id
    join nat nq on nq.y = o.year
  ),
  fin as (
    select n.pump_id, coalesce(op.y_new, oq.p_old, n.y) as y
    from nat n
    left join ov op on op.p = n.pump_id
    left join ov oq on oq.q = n.pump_id
  ),
  first_photo as (
    select distinct on (pump_id) pump_id, storage_path
    from photos where state = 'approved' order by pump_id, created_at
  )
  select f.y, f.pump_id, p.ref, p.district, fp.storage_path
  from fin f
  join pumps p on p.id = f.pump_id
  left join first_photo fp on fp.pump_id = f.pump_id
  where f.y >= 0
  order by 1 desc
$$;

grant execute on function unlocked_facts() to anon, authenticated;
grant execute on function echo_openers() to anon, authenticated;

-- ---------- Row-level security ----------
alter table pumps          enable row level security;
alter table status_reports enable row level security;
alter table photos         enable row level security;
alter table stories        enable row level security;
alter table fountains      enable row level security;
alter table year_facts     enable row level security;
alter table echo_overrides enable row level security;  -- no policy: server side only
alter table echo_witness   enable row level security;
alter table story_reveals  enable row level security;  -- no policy: server side only
alter table news           enable row level security;

create policy "pumps public read"  on pumps for select using (true);
create policy "pumps admin write"  on pumps for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "reports public read"   on status_reports for select using (true);
create policy "reports public insert" on status_reports for insert with check (true);

create policy "photos read approved" on photos for select
  using (state = 'approved' or auth.role() = 'authenticated');
create policy "photos public insert" on photos for insert with check (state = 'pending');
create policy "photos admin update"  on photos for update using (auth.role() = 'authenticated');
create policy "photos admin delete"  on photos for delete using (auth.role() = 'authenticated');

create policy "stories read approved" on stories for select
  using (state = 'approved' or auth.role() = 'authenticated');
create policy "stories public insert" on stories for insert with check (state = 'pending');
create policy "stories admin update"  on stories for update using (auth.role() = 'authenticated');
create policy "stories admin delete"  on stories for delete using (auth.role() = 'authenticated');

create policy "fountains public read" on fountains for select using (true);
create policy "fountains admin write" on fountains for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- The public reads facts only through unlocked_facts().
create policy "year_facts admin all" on year_facts for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "witness read when live" on echo_witness for select
  using (exists (select 1 from stories s where s.id = echo_witness.story_id and s.state = 'approved'));

create policy "news read when live" on news for select
  using (starts_at <= now() and (ends_at is null or ends_at > now())
    and (story_id is null or exists (select 1 from stories s where s.id = news.story_id and s.state = 'approved')));

-- ---------- Storage: photo bucket ----------
-- Photos are re-encoded in the browser before upload (max 1600 px),
-- which also strips EXIF and GPS data.
insert into storage.buckets (id, name, public, file_size_limit)
values ('pump-photos', 'pump-photos', true, 5242880);

create policy "photo read public"   on storage.objects for select using (bucket_id = 'pump-photos');
create policy "photo uploads anon"  on storage.objects for insert with check (bucket_id = 'pump-photos');
create policy "photo admin delete"  on storage.objects for delete
  using (bucket_id = 'pump-photos' and auth.role() = 'authenticated');
