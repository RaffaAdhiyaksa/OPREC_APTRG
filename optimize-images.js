import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// Mendapatkan path __dirname di lingkungan ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arahkan ke folder public/assets
const assetsDir = path.join(__dirname, 'public', 'assets');

async function processImages() {
  console.log(`Mencari gambar di folder: ${assetsDir}...\n`);
  
  if (!fs.existsSync(assetsDir)) {
    console.error(`Error: Folder tidak ditemukan: ${assetsDir}`);
    return;
  }

  // Baca isi folder
  const files = fs.readdirSync(assetsDir);
  
  // Filter hanya file .jpg, .jpeg, dan .png
  const imageFiles = files.filter(f => {
    const ext = f.toLowerCase();
    return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png');
  });

  if (imageFiles.length === 0) {
    console.log('Tidak ada file JPG/PNG yang perlu dikonversi di public/assets/');
    return;
  }

  console.log(`Ditemukan ${imageFiles.length} gambar untuk dikonversi ke format WebP.\n`);

  for (const file of imageFiles) {
    const inputPath = path.join(assetsDir, file);
    const parsed = path.parse(file);
    const outputPath = path.join(assetsDir, `${parsed.name}.webp`);

    console.log(`🔄 Mengonversi: ${file} -> ${parsed.name}.webp`);

    try {
      // Proses menggunakan sharp
      await sharp(inputPath)
        .webp({ 
          quality: 80,       // Kualitas 80% sangat optimal untuk web
          effort: 6          // Effort 6 (maksimal) untuk ukuran file sekecil mungkin
        })
        .toFile(outputPath);
      
      console.log(`✅ Berhasil: ${parsed.name}.webp`);
    } catch (err) {
      console.error(`❌ Gagal mengonversi ${file}:`, err.message);
    }
  }

  console.log('\n🎉 Konversi selesai! Anda dapat menghapus file .jpg/.png aslinya jika ingin menghemat ruang penyimpanan.');
}

processImages();
