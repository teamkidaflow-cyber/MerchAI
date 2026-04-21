-- SUPABASE STORAGE CONFIGURATION

-- 1. Create Bucket
insert into storage.buckets (id, name, public)
values ('shelf-photos', 'shelf-photos', true);

-- 2. Storage Policies

-- Authenticated upload
create policy "Allow authenticated uploads"
on storage.objects for insert
with check (
  bucket_id = 'shelf-photos' AND
  auth.role() = 'authenticated'
);

-- Public read access
create policy "Allow public read access"
on storage.objects for select
using ( bucket_id = 'shelf-photos' );

-- Managers can delete
create policy "Allow managers to delete photos"
on storage.objects for delete
using (
  bucket_id = 'shelf-photos' AND
  exists (select 1 from public.users where id = auth.uid() and role = 'manager')
);
