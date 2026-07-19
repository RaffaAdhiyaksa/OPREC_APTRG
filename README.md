# Admission Portal APTRG 2026

Platform pendaftaran modern, interaktif, dan terintegrasi untuk calon anggota baru (Sobat Angkasa) Aeromodelling & Payload Telemetry Research Group (APTRG) tahun 2026.

## ✨ Fitur Utama (Highlights)

* **Admission Portal Rebranding**: Mengusung terminologi dan identitas baru dari yang sebelumnya *Open Recruitment* menjadi *Admission Portal* untuk memberikan kesan yang lebih profesional dan kredibel.
* **Internationalization (i18n)**: Dukungan penuh dwibahasa (Indonesia & English) yang diintegrasikan menggunakan `react-i18next`. Pada pengaturan bahasa Indonesia, sistem dirancang menyapa pendaftar dengan sebutan "Sobat Angkasa" dan bahasa yang *friendly* tanpa kehilangan wibawa sebagai laboratorium riset kebanggaan kampus.
* **Interactive Side Drawer**: Informasi mendalam pada segmen 'Reasons to join the lab' kini dikemas ke dalam antarmuka *Side Drawer* (panel geser) yang imersif dan detail.
* **Stable Performance Animations**: Segala bentuk pergerakan animasi wahana UAV dioptimasi menggunakan *linear easing* demi memberikan kecepatan animasi yang stabil dan konstan.
* **Code Optimization**: Pembersihan *orphan assets*, perbaikan *broken imports*, hingga optimalisasi struktur komponen demi mengurangi risiko *lag* dan memberikan pengalaman akses (terutama saat *scrolling*) yang *smooth* walaupun diakses banyak pengguna secara bersamaan.

## 🛠️ Teknologi yang Digunakan

Website ini dibangun di atas *modern tech stack* terbaik untuk menjamin kecepatan dan fluiditas UI:
* **React (Vite)** – Frontend *framework* dan *build tool*
* **Tailwind CSS** – *Styling* utilitas untuk kemudahan desain responsif
* **Framer Motion** – *Engine* utama animasi interaktif
* **react-i18next** – *Library* standar untuk lokalisasi bahasa (i18n)
* **Lucide React** – Ikonografi modern
* **Supabase** – *Backend-as-a-Service* (Authentication, Database, dll)

## 🚀 Cara Menjalankan Proyek

1. Pastikan kamu sudah menginstal [Node.js](https://nodejs.org/).
2. Clone repositori proyek ini:
   ```bash
   git clone https://github.com/RaffaAdhiyaksa/OPREC_APTRG.git
   ```
3. Masuk ke direktori proyek dan instal semua *dependencies*:
   ```bash
   npm install
   ```
4. Buat file `.env.local` pada folder utama dan masukkan konfigurasi kunci akses Supabase kamu.
5. Jalankan server secara lokal (*development*):
   ```bash
   npm run dev
   ```