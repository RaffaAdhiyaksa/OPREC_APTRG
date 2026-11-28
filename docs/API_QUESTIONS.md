# API Questions (Frontend → Backend)

Format: lihat `docs/FRONTEND_HANDOFF.md` bagian 10.

## 2026-11-28 — `UserResource.competition_divisions`
- Temuan: backend mengembalikan `{ id, name, team_name }`. Contoh login di PRD §7.1 juga menyertakan `position`.
- Kebutuhan frontend: `position` (nullable) untuk ditampilkan sebagai Badge di halaman Profil.
- Sementara: tipe frontend mengikuti backend (tanpa `position`).

## 2026-11-28 — Akun seed dan `must_change_password`
- Temuan: kelima akun seed dibuat dengan `must_change_password = false`, jadi alur paksa ganti password (403 `PASSWORD_CHANGE_REQUIRED` → `/change-password`) tidak bisa diuji dengan akun seed.
- Kebutuhan frontend: satu akun seed tambahan dengan `must_change_password = true`, misalnya `baru@aptrg.test` (magang System).
- Sementara: alur diuji dengan mengubah flag langsung di database lokal.

## 2026-11-28 — Field login di `CLAUDE.md`
- Temuan: `CLAUDE.md` §6 menulis login memakai `email` atau `nim`. Backend dan handoff memakai satu field `login` (email atau NIM) + `device_name`.
- Kebutuhan frontend: tidak ada perubahan backend. Mohon `CLAUDE.md` diselaraskan.
- Sementara: frontend mengirim `{ login, password, device_name: "web" }`.
