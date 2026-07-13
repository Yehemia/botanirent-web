# 📱 Layer 4: Fitur Halaman & Konten Halaman (SvelteKit Routes)

Layer 4 berisi seluruh halaman antarmuka kasir/owner dan logika pemrosesan form (*Form Actions*) yang menangani interaksi pengguna secara langsung di browser.

---

## 🛤️ Arsitektur Routing SvelteKit

SvelteKit menggunakan **file-based routing** (routing berbasis file di dalam folder `src/routes/`):
*   `+page.svelte` (berjalan di Browser): Mengatur tampilan antarmuka (HTML/CSS/JS).
*   `+page.server.js` (berjalan di Server): Memuat data sebelum halaman dirender (`load` function) dan memproses pengiriman form (`actions`).
*   `+layout.svelte` & `+layout.server.js`: Menjadi kerangka pembungkus (layout) halaman di bawahnya. Layout di SvelteKit mewariskan datanya ke halaman-halaman anak secara otomatis.

---

## 🔑 1. Grup Autentikasi `(auth)`
Grup rute khusus yang mengisolasi halaman login dari layout dashboard utama (tanpa sidebar).

*   **login/ (`+page.server.js` & `+page.svelte`)**: Menerima input email & password, atau login menggunakan tautan OAuth (Google/Github). Server memvalidasi kredensial ke Supabase Auth dan menyimpan token session.
*   **logout/ (`+server.js`)**: API Endpoint (GET/POST) untuk menghapus session user aktif di browser dan mengembalikan user ke halaman `/login`.
*   **forgot-password/ & set-password/**: Halaman untuk pemulihan akun jika staf lupa password atau saat owner mengundang staf baru untuk membuat password pertama kali.
*   **callback/ (`+server.js`)**: Endpoint penangkap callback dari tautan email konfirmasi Supabase (magic link / password reset).

---

## 📱 2. Grup Aplikasi Utama `(app)`
Menangani seluruh operasional harian persewaan outdoor.

*   **dashboard/**: Halaman beranda utama. Memuat ringkasan visual seperti total rental aktif, barang terlaris, dan jumlah alat yang rusak/maintenance hari ini.
*   **pos/ (Point of Sale)**: Layar utama kasir. Kasir bisa memilih alat outdoor (tenda, carrier, dll), memilih paket, memilih data pelanggan, mengatur tanggal sewa (mulai/kembali), dan memasukkan diskon.
*   **pos/checkout/**: Menampilkan rangkuman keranjang POS sebelum pembayaran. Kasir memilih metode bayar (Tunai, QRIS, Transfer). Jika memilih QRIS, server akan menghubungi Midtrans Snap untuk memunculkan popup pembayaran online.
*   **returns/**: Digunakan kasir saat pelanggan mengembalikan alat sewaan. Memuat daftar sewa aktif. Kasir bisa mencatat kondisi barang saat dikembalikan (bagus, rusak ringan, rusak berat, atau hilang). Sistem otomatis mengalkulasi denda jika barang terlambat atau rusak.
*   **inventory/ & inventory/new/ & inventory/[id]/**: Halaman CRUD data alat outdoor. Hanya role `owner` dan `gudang` yang boleh menambah barang baru, memperbarui deskripsi, atau menghapus item.
*   **inventory/bulk-upload/**: Memfasilitasi upload massal stok alat outdoor via file spreadsheet (CSV/Excel) untuk efisiensi input barang baru.
*   **booking/**: Blok kalender pemesanan. Kasir bisa melihat visualisasi ketersediaan unit tenda/alat outdoor pada tanggal tertentu untuk mencegah double-booking (sewa ganda pada unit yang sama).
*   **customers/**: Menampilkan data penyewa aktif, riwayat sewa mereka, serta memfasilitasi pelunasan denda tertunda di kemudian hari secara tunai maupun online (QRIS).
*   **transactions/ & transactions/[id]/**: Halaman audit riwayat nota/invoice transaksi lengkap beserta status pembayarannya (paid/pending/failed).
*   **packages/ & packages/new/**: Halaman untuk membuat paket bundling alat outdoor (misal: "Paket Camping Hemat 2 Orang" yang berisi 1 Tenda, 2 Matras, dan 1 Kompor).
*   **penalties/**: Halaman pengaturan tarif denda bagi Owner (misal: denda telat sewa tenda Rp15.000/hari, denda tenda sobek, dll).
*   **staff/**: Manajemen staf. Hanya Owner yang bisa mendaftarkan akun staf baru via admin client Supabase, serta menonaktifkan akun staf yang sudah keluar dari toko.
*   **branches/**: Manajemen multi-cabang. Hanya Owner yang bisa menambah atau mengedit alamat cabang toko.
*   **statistics/**: Grafik analisis keuntungan bisnis, omzet bulanan, dan rasio sewa per cabang yang hanya bisa diakses oleh Owner.
*   **settings/**: Mengonfigurasi pengaturan umum toko (seperti nominal deposit jaminan sewa dan ongkos kirim/ambil barang).
*   **asset-status/**: Memantau kondisi fisik unit individual secara spesifik (misalnya tenda mana saja yang berstatus `ready`, `rented`, `maintenance`, atau sedang dicuci/`washing`).
*   **activity-log/**: Log audit aktivitas yang mencatat seluruh tindakan sensitif staf (siapa yang menghapus transaksi, siapa yang mengedit stok, kapan, dll).
