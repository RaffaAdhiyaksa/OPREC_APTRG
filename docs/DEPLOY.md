# Panduan Deploy — APTRG LMS

Panduan ini untuk server Linux (Ubuntu 22.04/24.04) dengan satu domain API dan satu domain frontend, misalnya:

- API (Laravel): `https://api-lms.aptrg.id`
- Frontend (React SPA): `https://lms.aptrg.id`

Ganti domain, path, dan nama user sesuai server Anda. Semua perintah `php artisan` dijalankan dari folder `backend/`.

---

## 1. Kebutuhan server

| Komponen | Versi | Catatan |
| --- | --- | --- |
| PHP (FPM + CLI) | 8.3 | Ekstensi: `bcmath`, `ctype`, `curl`, `fileinfo`, `intl`, `mbstring`, `openssl`, `pdo_mysql`, `tokenizer`, `xml`, `zip` |
| Composer | 2.x | Untuk install dependency backend |
| MySQL | 8.0.16 atau lebih baru | Wajib ≥ 8.0.16 karena tabel `submissions` memakai CHECK constraint |
| Nginx | stabil terbaru | Reverse proxy ke PHP-FPM dan hosting file statis frontend |
| Node.js | 22 | **Hanya untuk build frontend.** Tidak perlu jalan terus di server; build bisa juga dilakukan di laptop lalu hasil `frontend/dist/` di-upload |
| Cron | bawaan OS | Untuk scheduler Laravel (pengingat deadline) |

Tidak perlu queue worker, Redis, atau WebSocket: semua notifikasi dikirim sinkron ke tabel `notifications`, dan frontend melakukan polling setiap 60 detik.

Contoh install di Ubuntu:

```bash
sudo apt install nginx mysql-server php8.3-fpm php8.3-cli php8.3-mysql php8.3-mbstring \
  php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath php8.3-intl unzip
```

---

## 2. Database

```sql
CREATE DATABASE aptrg_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'aptrg_lms'@'localhost' IDENTIFIED BY 'GANTI_DENGAN_PASSWORD_KUAT';
GRANT ALL PRIVILEGES ON aptrg_lms.* TO 'aptrg_lms'@'localhost';
FLUSH PRIVILEGES;
```

Jangan memakai user `root` MySQL untuk aplikasi.

---

## 3. File `.env` production (`backend/.env`)

Salin dari contoh lalu ubah:

```bash
cd /var/www/aptrg-lms/backend
cp .env.example .env
```

Baris yang **wajib** disesuaikan:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api-lms.aptrg.id
FRONTEND_URL=https://lms.aptrg.id
SANCTUM_EXPIRATION=10080
LMS_MAX_UPLOAD_MB=50
LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=aptrg_lms
DB_USERNAME=aptrg_lms
DB_PASSWORD=GANTI_DENGAN_PASSWORD_KUAT

SEED_DEFAULT_PASSWORD=
```

Penjelasan setiap baris:

| Baris | Arti |
| --- | --- |
| `APP_ENV=production` | Mode production. Seeder akun dummy (`UserSeeder`) otomatis tidak jalan, dan `migrate`/`db:seed` meminta `--force`. |
| `APP_DEBUG=false` | **Wajib `false`.** Jika `true`, pesan error menampilkan stack trace, isi `.env`, dan query ke pengguna. |
| `APP_URL` | URL publik API. Dipakai Laravel untuk membuat URL absolut. |
| `FRONTEND_URL` | Origin frontend yang diizinkan CORS (`config/cors.php`). Harus persis sama dengan alamat yang dibuka browser, termasuk `https://`, tanpa garis miring di akhir. Beberapa origin dipisah koma. |
| `SANCTUM_EXPIRATION` | Umur token login dalam menit. `10080` = 7 hari. Setelah itu pengguna harus login ulang. `0` = tidak pernah kedaluwarsa (tidak disarankan). |
| `LMS_MAX_UPLOAD_MB` | Batas global ukuran file submission. Tiap tugas boleh memilih 1 sampai angka ini. Batas PHP dan Nginx (bagian 4) harus sedikit di atasnya. |
| `LOG_LEVEL` | Tingkat log di `storage/logs/laravel.log`. `warning` atau `error` di production; `debug` hanya untuk lokal. |
| `DB_*` | Koneksi MySQL dari bagian 2. |
| `SEED_DEFAULT_PASSWORD` | Biarkan kosong. Hanya dipakai `UserSeeder` di lokal/testing. |

`APP_KEY` diisi otomatis oleh `php artisan key:generate` (bagian 5). Jangan menyalin `APP_KEY` dari laptop ke server.

Pastikan `.env` tidak bisa dibaca user lain:

```bash
chmod 640 .env
sudo chown deploy:www-data .env
```

---

## 4. Batas upload: PHP dan Nginx

Batas global upload 50 MB, jadi PHP dan Nginx diset **55M** (sedikit di atas, karena body multipart juga berisi field lain).

`/etc/php/8.3/fpm/php.ini`:

```ini
upload_max_filesize = 55M
post_max_size = 55M
memory_limit = 256M
```

Lalu `sudo systemctl reload php8.3-fpm`.

Jika batas ini lebih kecil dari `LMS_MAX_UPLOAD_MB`, file besar ditolak sebelum Laravel bisa memberi pesan yang jelas (`413 PAYLOAD_TOO_LARGE`).

### Server block API (`/etc/nginx/sites-available/api-lms.aptrg.id`)

```nginx
server {
    listen 80;
    server_name api-lms.aptrg.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api-lms.aptrg.id;

    ssl_certificate     /etc/letsencrypt/live/api-lms.aptrg.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-lms.aptrg.id/privkey.pem;

    root /var/www/aptrg-lms/backend/public;
    index index.php;

    client_max_body_size 55M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    }

    # Jangan pernah melayani dotfile (.env, .git, ...).
    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

`root` **harus** `backend/public`, bukan `backend/`. Folder `storage/` (termasuk file submission di `storage/app/private`) tidak boleh bisa diakses langsung dari web.

### Server block frontend (`/etc/nginx/sites-available/lms.aptrg.id`)

```nginx
server {
    listen 80;
    server_name lms.aptrg.id;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lms.aptrg.id;

    ssl_certificate     /etc/letsencrypt/live/lms.aptrg.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lms.aptrg.id/privkey.pem;

    root /var/www/aptrg-lms/frontend/dist;
    index index.html;

    # SPA: semua path (misalnya /assignments/21) dilayani index.html, React Router yang memilih halaman.
    location / {
        try_files $uri $uri/ /index.html;
    }

    # File hasil build punya hash di nama, aman di-cache lama.
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Aktifkan dan pasang HTTPS:

```bash
sudo ln -s /etc/nginx/sites-available/api-lms.aptrg.id /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/lms.aptrg.id /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api-lms.aptrg.id -d lms.aptrg.id
```

---

## 5. Deploy pertama

Jalankan berurutan. Contoh memakai user `deploy` dan folder `/var/www/aptrg-lms`.

```bash
# 1. Ambil kode (repo private; pakai deploy key read-only)
sudo mkdir -p /var/www/aptrg-lms && sudo chown deploy:www-data /var/www/aptrg-lms
git clone git@github.com:RaffaAdhiyaksa/OPREC_APTRG.git /var/www/aptrg-lms
cd /var/www/aptrg-lms/backend

# 2. Dependency PHP tanpa paket development
composer install --no-dev --optimize-autoloader

# 3. .env (lihat bagian 3), lalu kunci aplikasi
cp .env.example .env    # lalu edit sesuai bagian 3
php artisan key:generate

# 4. Skema database
php artisan migrate --force

# 5. Data wajib: 8 divisi. Di production TIDAK membuat akun dummy.
php artisan db:seed --force

# 6. Admin pertama. Password sementara hanya tampil sekali: catat, lalu berikan ke admin.
php artisan lms:create-admin "Nama Admin" admin@aptrg.id

# 7. Hak akses folder yang ditulis Laravel
sudo chown -R deploy:www-data storage bootstrap/cache
sudo chmod -R ug+rwX storage bootstrap/cache

# 8. Cache konfigurasi dan route (setelah .env final)
php artisan config:cache
php artisan route:cache
```

Admin login di frontend dengan password sementara itu, lalu wajib menggantinya. Akun lain dibuat admin lewat menu Pengguna.

### Build frontend

`VITE_API_BASE_URL` dibaca **saat build**, bukan saat runtime. Build ulang setiap kali URL API berubah.

```bash
cd /var/www/aptrg-lms/frontend
cat > .env.production.local <<'EOF'
VITE_API_BASE_URL=https://api-lms.aptrg.id
VITE_USE_MOCKS=false
EOF
npm ci
npm run build    # hasil di frontend/dist/, dilayani Nginx (bagian 4)
```

`VITE_USE_MOCKS=false` wajib di production supaya semua data diambil dari API.

### Cek setelah deploy

```bash
curl -s https://api-lms.aptrg.id/api/v1/health          # {"data":{"status":"ok"}}
curl -sI https://api-lms.aptrg.id/api/v1/health | grep -i x-frame-options   # DENY
```

Buka `https://lms.aptrg.id`, login sebagai admin, lalu cek menu Pengguna dan Divisi.

---

## 6. Update rutin

```bash
cd /var/www/aptrg-lms
php backend/artisan down                 # mode maintenance (opsional untuk perubahan kecil)
git pull origin main

cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache

cd ../frontend
npm ci && npm run build

php ../backend/artisan up
```

Jangan menjalankan `db:seed` lagi kecuali rilis menambah divisi baru (seeder hanya membuat divisi yang belum ada dan tidak menimpa perubahan admin, misalnya status aktif Teknofest).

Jika migrasi gagal, perbaiki lalu jalankan `php artisan migrate --force` lagi. Jangan memakai `migrate:fresh` di production: perintah itu **menghapus seluruh data**.

---

## 7. Cron (scheduler)

Pengingat deadline (`lms:remind-deadlines`, setiap jam) butuh scheduler Laravel. Tambahkan ke crontab user `deploy` (`crontab -e`):

```cron
* * * * * cd /var/www/aptrg-lms/backend && php artisan schedule:run >> /dev/null 2>&1
```

Cek jadwal terdaftar: `php artisan schedule:list`.

---

## 8. Backup

Dua hal yang wajib dibackup:

1. **Database** (`aptrg_lms`): semua user, tugas, nilai, pengumuman.
2. **File submission** di `backend/storage/app/private/` (file tugas magang tidak ada di database).

Contoh skrip `/home/deploy/backup-lms.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%F)
DEST=/var/backups/aptrg-lms
mkdir -p "$DEST"

# Kredensial MySQL dibaca dari ~/.my.cnf (chmod 600), bukan ditulis di skrip.
mysqldump --single-transaction --routines aptrg_lms | gzip > "$DEST/db-$STAMP.sql.gz"
tar -czf "$DEST/files-$STAMP.tar.gz" -C /var/www/aptrg-lms/backend/storage/app private

# Simpan 14 hari terakhir.
find "$DEST" -type f -mtime +14 -delete
```

`~/.my.cnf`:

```ini
[client]
user=aptrg_lms
password=GANTI_DENGAN_PASSWORD_KUAT
```

Jadwal harian pukul 02.00 (`crontab -e`):

```cron
0 2 * * * /home/deploy/backup-lms.sh >> /var/log/backup-lms.log 2>&1
```

Salin folder backup ke lokasi lain (Google Drive lab, server lain) secara berkala. Backup yang hanya ada di server yang sama ikut hilang jika server rusak. Uji restore minimal sekali per semester.

---

## 9. Checklist keamanan

- [ ] Repository GitHub **private**. Riwayat repo pernah berisi key Supabase lama; anggap key itu bocor dan nonaktifkan project Supabase lama.
- [ ] `APP_DEBUG=false` dan `APP_ENV=production` di `backend/.env`.
- [ ] HTTPS aktif untuk API dan frontend (certbot), HTTP dialihkan ke HTTPS.
- [ ] `FRONTEND_URL` hanya berisi domain frontend production (tanpa `localhost`).
- [ ] Tidak ada akun seed (`*@aptrg.test`) di database production: `SELECT email FROM users WHERE email LIKE '%@aptrg.test';` harus kosong.
- [ ] Nginx `root` API = `backend/public`; `storage/` dan `.env` tidak bisa diakses dari web.
- [ ] User MySQL aplikasi bukan `root`, password kuat.
- [ ] Backup harian berjalan dan pernah diuji restore.
- [ ] **Jika `APP_KEY` bocor:** jalankan `php artisan key:generate --force`, lalu `php artisan config:cache`. Data yang dienkripsi dengan key lama tidak bisa dibaca lagi (aplikasi ini tidak mengenkripsi data di database, jadi dampaknya hanya sesi/cookie). Token login Sanctum tidak bergantung pada `APP_KEY`; untuk memaksa semua orang login ulang, kosongkan tabel `personal_access_tokens`.
- [ ] Jika password database bocor: ganti password user MySQL, perbarui `DB_PASSWORD`, lalu `php artisan config:cache`.
