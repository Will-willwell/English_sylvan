-- Private source-book storage for authenticated personal study
-- Run once in Supabase SQL Editor, then upload the three PDFs manually in Storage.

insert into storage.buckets (id, name, public)
values ('book-source', 'book-source', false)
on conflict (id) do update set public = false;

drop policy if exists "Authenticated users can read private book source" on storage.objects;
create policy "Authenticated users can read private book source"
on storage.objects for select
to authenticated
using (bucket_id = 'book-source');

-- No browser upload policy is created. Upload files from Supabase Dashboard Storage.
