-- ============================================================
-- Migration: tambah kolom hp & avatar_url ke profiles,
--            + storage bucket buat foto profil
-- Jalankan ini di Supabase SQL Editor (atau via `supabase db push`)
-- ============================================================

-- 1. Tambah kolom baru ke tabel profiles (aman dijalankan berkali-kali)
alter table public.profiles
  add column if not exists hp text,
  add column if not exists avatar_url text;

-- 2. Pastikan RLS aktif di profiles (kalau belum)
alter table public.profiles enable row level security;

-- 3. Policy: user boleh baca profilnya sendiri
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- 4. Policy: user boleh update profilnya sendiri (nama, hp, avatar_url)
--    Role sengaja TIDAK bisa diubah lewat policy ini secara langsung dari FE —
--    kalau mau strict, bikin kolom role di-manage cuma lewat admin/service role.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5. Policy: user boleh insert row profilnya sendiri (untuk auto-provision
--    saat login pertama kali, misal via Google OAuth yang belum ada row-nya)
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 6. (Opsional tapi disarankan) Admin & asisten boleh baca semua profil
--    — dibutuhkan buat halaman direktori anggota (Anggota.tsx) nanti
--    kalau mau ambil data asli dari Supabase, bukan mock data lagi.
drop policy if exists "profiles_select_admin_all" on public.profiles;
create policy "profiles_select_admin_all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'asisten')
    )
  );

-- ============================================================
-- 7. Storage bucket buat foto profil
-- ============================================================

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Siapa aja boleh LIHAT foto profil (bucket public, buat ditampilin di UI)
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- User cuma boleh UPLOAD ke folder namanya sendiri: avatars/<user_id>/...
drop policy if exists "avatars_insert_own_folder" on storage.objects;
create policy "avatars_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- User cuma boleh UPDATE/replace file di folder-nya sendiri
drop policy if exists "avatars_update_own_folder" on storage.objects;
create policy "avatars_update_own_folder"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- User cuma boleh HAPUS file di folder-nya sendiri
drop policy if exists "avatars_delete_own_folder" on storage.objects;
create policy "avatars_delete_own_folder"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
