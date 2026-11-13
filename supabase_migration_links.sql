-- Run ONCE in Supabase Dashboard -> SQL Editor (project: KyZer_HADOC-Website)
-- 1) "Link" uploads (no file stored)  2) marks which uploads live in Cloudflare R2 (50-200 MB files)
alter table public.uploads add column if not exists external_url text;
alter table public.uploads alter column file_path drop not null;
alter table public.uploads add column if not exists storage text not null default 'supabase';
