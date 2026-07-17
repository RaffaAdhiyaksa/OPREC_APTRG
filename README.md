# Portal Pendaftaran APTRG 2026

Portal ini merupakan sistem pendaftaran resmi untuk Aeromodelling & Payload Telemetry Research Group (APTRG). Website ini dikembangkan untuk mengelola proses rekrutmen anggota baru dan acara *Open Mind* secara digital dan terintegrasi.

## Fitur Utama
* **Autentikasi User**: Sistem *login* dan *register* berbasis akun untuk mempersonalisasi pengalaman pendaftar.
* **Role-Based Access**: Pembagian hak akses antara Admin (untuk pengelolaan) dan Pendaftar/Magang (untuk pendaftaran).
* **Open Mind Registration**: Fitur pemilihan kursi (*seat selection*) interaktif bagi peserta *Open Mind* yang terhubung langsung ke database.
* **E-Ticket Generation**: Otomatisasi pembuatan tiket digital dengan QR Code setelah pendaftaran berhasil.
* **Responsive Dashboard**: Dasbor intuitif untuk melihat status pendaftaran dan navigasi cepat.

## Cara Menjalankan Proyek
1. Pastikan kamu sudah menginstal [Node.js](https://nodejs.org/).
2. Clone repository ini:
   ```bash
   git clone [https://github.com/RaffaAdhiyaksa/OPREC_APTRG.git](https://github.com/RaffaAdhiyaksa/OPREC_APTRG.git)
  
Masuk ke direktori proyek dan instal dependencies:

Bash
npm install
Buat file .env.local dan masukkan konfigurasi Supabase kamu.

Jalankan development server:

Bash
npm run dev
Teknologi yang Digunakan
Frontend: React, Tailwind CSS, Lucide React
Backend/Database: Supabase (Auth, Database, RLS Policies)