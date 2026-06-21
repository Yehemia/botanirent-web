# 🖥️ Layer 3: Backend & Logika Bisnis (Server-Side)

Layer 3 adalah otak dari aplikasi Botanirent. Seluruh logika transaksi, perhitungan denda, optimasi query, dan interaksi langsung dengan database PostgreSQL diisolasi di layer ini untuk memastikan keamanan data dan efisiensi memori.

---

## 🏛️ Arsitektur MVC (Model-Controller) di Server-Side

Botanirent memisahkan kode server-side menjadi dua bagian utama untuk kemudahan pemeliharaan (*maintainability*):
1.  **Models (`src/lib/server/models/`)**: Fokus pada interaksi data mentah (SELECT, INSERT, UPDATE, DELETE) dengan database Supabase. Model tidak tahu apa itu logika denda atau checkout, tugasnya murni membaca/menulis tabel.
2.  **Controllers (`src/lib/server/controllers/`)**: Mengatur aliran logika bisnis (*business logic*). Controller memanggil Model, menghitung kalkulasi matematika (denda, subtotal, diskon), mengoordinasikan transaksi database, dan memformat hasil akhir untuk dikembalikan ke routes halaman.

---

## 📊 1. Models Layer (`src/lib/server/models/`)

Masing-masing dari 9 tabel utama memiliki file model pendamping:

*   **itemModel.js & assetModel.js**: Mengelola master data alat outdoor dan unit fisik di lapangan. Mendukung bulk insert (upload massal) serta pencarian status ketersediaan unit.
*   **bookingModel.js**: Mengelola jadwal rental aktif dan jadwal perbaikan (*maintenance*) alat outdoor yang rusak.
*   **branchModel.js**: Memproses data multi-cabang.
*   **categoryModel.js**: Mengatur kategori pembeda alat sewa vs retail.
*   **customerModel.js**: Menyimpan identitas pelanggan penyewa.
*   **transactionModel.js**: Mengelola detail transaksi penjualan/sewa, mencatat Snap Token pembayaran online, dan memperbarui status pelunasan.
*   **penaltyModel.js**: Mengelola aturan denda dan pembuatan denda baru saat barang rusak/telat.
*   **activityLogModel.js**: Mencatat audit log aktivitas staf di server demi keamanan internal sistem.

---

## 🎮 2. Controllers Layer (`src/lib/server/controllers/`)

Mengandung logika bisnis utama:

*   **posController.js**: Mengatur pembuatan transaksi sewa/beli baru, inisiasi invoice pembayaran online (Snap token), pengurangan stok otomatis, dan konversi order menjadi booking kalender.
*   **returnsController.js**: Memproses pengembalian alat outdoor sewaan. Menghitung hari keterlambatan secara otomatis, memicu denda keterlambatan jika ada, dan mengupdate status fisik unit menjadi `ready` (atau status lain jika dilaporkan rusak/hilang).
*   **statisticsController.js**: Melakukan perhitungan agregasi berat (rata-rata pendapatan bulanan, produk terlaris, rasio keterlambatan) dan menyiapkannya untuk grafik visual.
*   **dashboardController.js**: Mengumpulkan ringkasan data statistik cepat hari ini.

---

## ⚡ 3. Caching Layer (`src/lib/server/cache.js`)

Botanirent menggunakan memori server (Node.js memory cache) untuk mempercepat respons aplikasi dan meminimalkan query redundan ke database.

### Mekanisme Kerja Cache:
1.  **`cacheGet(key, fetchFunction, ttl)`**: Mengambil data dari memori menggunakan kunci `key`. Jika tidak ada (miss), panggil fungsi `fetchFunction()` untuk mengambil data dari Supabase DB, simpan ke cache dengan durasi kedaluwarsa `ttl` (Time-To-Live dalam milidetik), lalu kembalikan datanya.
2.  **`cacheInvalidate(key)`**: Menghapus data spesifik dari memori cache ketika data tersebut diperbarui di database (misal: menghapus cache `'staff_list'` saat owner menambahkan karyawan baru).
3.  **`cacheInvalidatePrefix(prefix)`**: Menghapus semua cache yang diawali string tertentu (misal: `'staff_count_'`) untuk memastikan visualisasi dashboard terupdate seketika.

---

## 🌐 4. API Endpoints (`src/routes/api/`)

Endpoint khusus non-UI yang memfasilitasi komunikasi eksternal (M2M) atau request AJAX backend:

*   **api/change-branch/+server.js**: Dipanggil oleh Topbar ketika Owner beralih dari satu cabang ke cabang lainnya untuk mengupdate kolom `branch_id` di profilnya.
*   **api/midtrans/token/+server.js**: Menghubungi Midtrans Snap API menggunakan Basic Auth server key privat untuk meminta token popup pembayaran online.
*   **api/midtrans/status/[id]/+server.js**: Dipanggil secara polling berkala oleh kasir di frontend untuk memantau status pembayaran QRIS (apakah pelanggan sudah selesai memindai & mentransfer uang).
*   **api/midtrans/webhook/+server.js**: Webhook penerima sinyal status pembayaran resmi dari server Midtrans. Menggunakan pengaman kriptografi SHA-512 Signature Key dan dijalankan menggunakan Supabase Service Role Key (bypassing RLS) untuk menjamin pelunasan transaksi tetap tercatat secara otomatis meskipun browser kasir ditutup.
