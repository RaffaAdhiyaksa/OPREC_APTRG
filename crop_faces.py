import cv2
import os

def crop_to_aspect_ratio(image, face_box, target_ratio=4/5):
    """
    Melakukan crop pada gambar dengan aspect ratio target (default 4:5),
    dan memastikan kotak wajah (face_box) sebisa mungkin berada di tengah-tengah crop.
    """
    h, w, _ = image.shape
    fx, fy, fw, fh = face_box
    
    # Cari titik pusat wajah
    face_center_x = fx + fw // 2
    face_center_y = fy + fh // 2

    current_ratio = w / h
    
    if current_ratio > target_ratio:
        # Gambar terlalu lebar (landscape), harus potong kiri-kanan
        new_h = h
        new_w = int(h * target_ratio)
    else:
        # Gambar terlalu tinggi (portrait ekstrim), harus potong atas-bawah
        new_w = w
        new_h = int(w / target_ratio)
        
    # Hitung titik awal crop agar wajah ada di tengah
    start_x = face_center_x - new_w // 2
    # Offset Y sedikit ke atas (0.45 bukan 0.5) agar wajah tidak tertutup ikon/gradient di bawah
    start_y = face_center_y - int(new_h * 0.45) 
    
    # Koreksi jika crop melewati batas gambar
    if start_x < 0:
        start_x = 0
    elif start_x + new_w > w:
        start_x = w - new_w
        
    if start_y < 0:
        start_y = 0
    elif start_y + new_h > h:
        start_y = h - new_h
        
    return image[start_y:start_y+new_h, start_x:start_x+new_w]

def process_images():
    raw_dir = 'raw_assets'
    out_dir = os.path.join('public', 'assets')
    
    # Pastikan folder sumber ada
    if not os.path.exists(raw_dir):
        print(f"⚠️ Folder '{raw_dir}' tidak ditemukan. Membuat folder...")
        os.makedirs(raw_dir)
        print(f"👉 Silakan masukkan foto-foto asli Anda ke dalam folder '{raw_dir}' dan jalankan ulang script ini.")
        return
        
    # Buat folder output jika belum ada
    os.makedirs(out_dir, exist_ok=True)
    
    # Download Haar Cascade model secara otomatis jika belum ada di folder
    cascade_filename = 'haarcascade_frontalface_default.xml'
    if not os.path.exists(cascade_filename):
        print(f"⬇️ Mendownload model deteksi wajah ({cascade_filename})...")
        import urllib.request
        url = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml"
        try:
            urllib.request.urlretrieve(url, cascade_filename)
            print("✅ Model berhasil didownload.")
        except Exception as e:
            print(f"❌ Error saat mendownload model: {e}")
            return

    face_cascade = cv2.CascadeClassifier(cascade_filename)
    
    if face_cascade.empty():
        print("❌ Error: Gagal memuat Haar Cascade model.")
        return

    valid_extensions = ('.png', '.jpg', '.jpeg', '.webp')
    files = [f for f in os.listdir(raw_dir) if f.lower().endswith(valid_extensions)]
    
    if not files:
        print(f"Tidak ada gambar ditemukan di folder '{raw_dir}'.")
        return
        
    print(f"Memproses {len(files)} gambar...\n")
    
    for filename in files:
        file_path = os.path.join(raw_dir, filename)
        image = cv2.imread(file_path)
        
        if image is None:
            print(f"❌ Gagal membaca: {filename}")
            continue
            
        # OpenCV mendeteksi lebih baik di gambar grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Deteksi wajah
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        h, w, _ = image.shape
        
        if len(faces) == 0:
            print(f"⚠️ Wajah tidak terdeteksi di {filename}. Crop dari tengah (default).")
            face_box = (w//4, h//4, w//2, h//2)
        else:
            # Ambil wajah pertama yang terdeteksi
            (fx, fy, fw, fh) = faces[0]
            face_box = (fx, fy, fw, fh)
            print(f"🔍 Wajah terdeteksi di {filename}")
            
        # Crop ke aspect ratio 4:5
        cropped_image = crop_to_aspect_ratio(image, face_box, target_ratio=4/5)
        
        # Simpan hasil crop ke public/assets
        out_path = os.path.join(out_dir, filename)
        cv2.imwrite(out_path, cropped_image)
        print(f"✅ Tersimpan: {out_path}")

    print("\n🎉 Proses smart crop selesai! Hasil gambar dengan proporsi 4:5 telah tersimpan di public/assets.")

if __name__ == "__main__":
    process_images()
