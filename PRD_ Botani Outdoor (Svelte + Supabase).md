# **Product Requirements Document (PRD)**

**Proyek:** BotaniRent (Sistem Manajemen Rental & Retail Outdoor)

| Meta Data   | Keterangan                                                          |
| :---------- | :------------------------------------------------------------------ |
| **Versi**   | 5.3 (SvelteKit \+ Supabase \+ Midtrans, Penambahan Hak Akses Aktor) |
| **Status**  | Approved                                                            |
| **Penulis** | Kelompok 2                                                          |
| **Tanggal** | 21 Mei 2026                                                         |

## **1\. Ringkasan Eksekutif (Executive Summary)**

- **Tujuan:** Menyelesaikan masalah pencatatan manual yang terpisah antara barang sewa dan barang jual, mengurangi _human error_, serta mengotomatisasi perhitungan denda dan pengelolaan aset.
- **Visi Produk:** BotaniRent akan menjadi solusi POS dan manajemen inventaris terpadu **berbasis multi-cabang**. Sistem ini memastikan ketersediaan alat akurat, transaksi (sewa & jual) tergabung dalam satu platform, dan _owner_ dapat memantau performa seluruh cabang secara _real-time_.

## **2\. Target Pengguna (User Personas & Hak Akses)**

_Sistem ini menggunakan Role-Based Access Control (RBAC). Setiap aktor memiliki batasan fitur yang dapat diaksesnya sesuai dengan peran mereka di toko._

- **Persona 1: Kasir / Admin Cabang**
  - Mengutamakan kecepatan saat melayani pelanggan.
  - **Fitur yang dapat diakses (Hak Akses):**
    - Mengakses layar POS (Point of Sales) khusus untuk cabang tempat ia ditugaskan.
    - Membuat transaksi baru (memasukkan barang sewa & ritel ke _cart_).
    - Mengecek ketersediaan barang di Kalender Booking.
    - Memproses pembayaran (Kalkulator Tunai & scan QRIS Midtrans).
    - Mencetak struk bukti transaksi.
    - Memproses pengembalian barang sewa dari pelanggan (mengenakan denda jika telat/rusak).
- **Persona 2: Admin Gudang / Maintenance**
  - Bertanggung jawab atas ketersediaan dan kondisi fisik barang di belakang layar.
  - **Fitur yang dapat diakses (Hak Akses):**
    - Mengakses menu Inventaris & Aset Cabang.
    - Melakukan _Bulk Upload_ (Excel/CSV) untuk menambah barang masal.
    - Menambah, mengedit, atau menghapus item satuan.
    - Membuat dan mengatur harga Paket Sewa (Bundling).
    - Mengubah status operasional aset sewa (misal: memindahkan status tenda yang baru dikembalikan dari "Disewa" menjadi "Maintenance/Dicuci", dan mengembalikannya ke "Ready" jika sudah siap).
- **Persona 3: Owner**
  - Bertindak sebagai pengambil keputusan tingkat manajerial.
  - **Fitur yang dapat diakses (Hak Akses):**
    - Mengakses _Dashboard_ Laporan Terpusat (melihat omzet harian/bulanan dari **semua cabang**).
    - Melihat statistik barang yang paling sering disewa atau rusak/hilang.
    - Manajemen Cabang (Membuka cabang baru di sistem, atau menonaktifkan cabang).
    - Mengatur nominal dan aturan Master Data untuk "Denda Dinamis".
    - Melihat log aktivitas transaksi dari seluruh kasir.

## **3\. Fitur Utama (Functional Requirements)**

_Penjelasan: Kebutuhan Fungsional (Functional Requirements) mendefinisikan **"apa yang harus bisa dilakukan oleh sistem"**. Ini adalah daftar fitur-fitur dan fungsi spesifik yang akan langsung berinteraksi dengan pengguna (kasir, admin, atau owner) untuk menyelesaikan pekerjaan mereka._

| ID    | Fitur                               | Deskripsi                                                                                                                                                   | Prioritas |
| :---- | :---------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------- |
| FR-01 | Transaksi Hybrid                    | Kasir bisa memasukkan barang sewa dan barang ritel dalam satu struk/nota transaksi yang sama.                                                               | P1        |
| FR-02 | Kalender Booking                    | Sistem menampilkan kalender visual untuk mengecek ketersediaan aset spesifik.                                                                               | P1        |
| FR-03 | Denda Dinamis                       | Admin dapat mengatur (_setting_) sendiri aturan dan nominal denda (keterlambatan/kerusakan), lalu sistem merekam tagihannya otomatis.                       | P1        |
| FR-04 | Pelacakan Aset & Kategori           | Setiap aset bisa dilacak. Tersedia pemisahan kategori barang: Barang Sewa, Retail Home Industry, dan Retail Reseller.                                       | P1        |
| FR-05 | Status Maintenance                  | Barang yang baru kembali otomatis berstatus "Dicuci/Maintenance" sebelum bisa disewakan lagi.                                                               | P2        |
| FR-06 | Multi-Cabang                        | Satu sistem untuk banyak toko. Data stok terpisah per cabang, tetapi laporan keuangan dapat dilihat terpusat oleh _Owner_.                                  | P1        |
| FR-07 | Bulk Upload Barang                  | Admin dapat mengunggah daftar barang sekaligus menggunakan format Excel/CSV agar tidak perlu _input_ manual satu per satu.                                  | P1        |
| FR-08 | Sewa Satuan & Paket (Bundling)      | Sistem mendukung penyewaan alat secara **satuan** maupun dalam bentuk **paket**. Admin dapat membuat paket dari beberapa barang satuan dengan harga khusus. | P1        |
| FR-09 | Metode Pembayaran (Cash & Cashless) | Sistem mendukung pembayaran **Tunai** (dengan fitur kalkulator kembalian) dan **Cashless** yang terintegrasi dengan **Midtrans** (QRIS, GoPay, VA bank).    | P1        |

## **4\. Alur Pengguna (User Flow)**

**Skenario: Transaksi Gabungan (Input Sentuh \+ Scan Barcode) & Pembayaran**

1. Pelanggan datang ke meja kasir membawa barang logistik (Retail) di tangan dan menyebutkan alat sewa yang ingin disewa.
2. **\[Input Sentuh\]:** Kasir melihat layar Tablet/PC, mencari, dan **mengklik/men-tap kotak "Paket Gunung 1"** dari _Katalog Menu Grid_. Item tersebut langsung berpindah ke kolom _Keranjang (Cart)_.
3. **\[Input Scan\]:** Untuk barang ritel (logistik) yang dibawa pelanggan, kasir tidak perlu menyentuh layar. Kasir langsung **menembakkan _Barcode Scanner_** ke barang tersebut. Sistem secara otomatis mendeteksi kode dan menambahkannya ke _Keranjang (Cart)_ yang sama.
4. Sistem secara otomatis: memotong stok logistik ritel dan memblokir tanggal ketersediaan untuk seluruh aset sewa di kalender.
5. Sistem memunculkan total harga. Pelanggan memilih metode pembayaran: **Tunai** atau **QRIS (Midtrans)**.
6. **Jika Tunai:** Kasir menginput nominal uang yang diberikan pelanggan, sistem otomatis menampilkan uang kembalian.
7. **Jika QRIS:** Aplikasi Web menembak _Edge Function_, lalu menampilkan antarmuka pembayaran Snap Midtrans atau QR Code statis di layar kasir.
8. Setelah pembayaran selesai/berhasil, sistem Web mencetak struk secara _silent_ (tanpa dialog print browser) menggunakan integrasi _hardware bridge_ (QZ Tray/Local Print Server) ke Thermal Printer.

## **5\. Kebutuhan Teknis (Technical Requirements)**

- **Frontend:** **SvelteKit**. Dipilih karena performa tinggi tanpa _virtual DOM_ overhead dan kapabilitas SSR/CSR yang sangat fleksibel. Di-deploy di **Vercel**.
- **Backend/Database/Auth:** **Supabase**.
  - Menggunakan **PostgreSQL** bawaan Supabase.
  - Autentikasi menggunakan **Supabase Auth**.
  - Keamanan isolasi data multi-cabang diatur murni menggunakan **Row Level Security (RLS)** di level _database_.
- **Payment Gateway:** API **Midtrans** (Core API / Snap API). Logika pembayaran dan pengamanan _Server Key_ Midtrans diletakkan di **Supabase Edge Functions** (Deno) agar tidak terekspos di Frontend.
- **Integrasi Hardware:** Fitur cetak otomatis ke **Thermal Printer** menggunakan _bridge software_ lokal (seperti **QZ Tray**) di PC Kasir.

## **6\. Kebutuhan Non-Fungsional (Non-Functional Requirements)**

_Penjelasan: Kebutuhan Non-Fungsional (Non-Functional Requirements) mendefinisikan **"bagaimana sistem harus bekerja"** di balik layar. Ini tidak berwujud tombol atau halaman antarmuka, melainkan standar kualitas, performa, dan keamanan yang menjamin aplikasi bisa berjalan dengan stabil, cepat, dan aman dari peretasan._

- **Kinerja (Performance):** _Load time_ awal aplikasi Web harus sangat cepat. Operasi _database_ (CRUD) memanfaatkan _Supabase JS Client_ dengan respons \< 200ms. Tombol-tombol di kasir tidak boleh memiliki jeda respons saat ditekan.
- **Keandalan Integrasi:** _Callback_ (Webhook) dari Midtrans ditangkap dengan aman oleh Supabase Edge Functions. Status pembayaran diteruskan ke antarmuka Kasir secara _real-time_ menggunakan **Supabase Realtime** (WebSockets) tanpa perlu kasir me-_refresh_ halaman.
- **Keamanan:** Menerapkan _Role-Based Access Control_ (RBAC) yang ketat. Selain itu, **RLS Supabase** memastikan di level server bahwa Kasir dari Cabang 'A' tidak akan pernah bisa melakukan SELECT (melihat) atau UPDATE (mengubah) data stok dan transaksi yang merupakan milik Cabang 'B'.

## **7\. Desain & Antarmuka (UI/UX)**

- **Platform Target:** Web Application (Diakses via Chrome/Safari/Edge di mesin kasir).
- **Pendekatan Desain Utama:** **Responsive, Tablet-Optimized, & Dual-Input Support**.
- **Tata Letak Layar Kasir (POS View):**
  - Layar dirancang dalam mode layar penuh (_fullscreen_) dan dibagi menjadi 2 area utama.
  - **Kiri/Tengah (Katalog Menu Grid):** Menampilkan daftar barang/paket sewa dalam bentuk kotak-kotak besar beserta gambar. Area ini dirancang _touch-friendly_ agar kasir bisa langsung memilih barang dengan jari/mouse.
  - **Kanan (Keranjang/Cart):** Menampilkan daftar pesanan yang sudah diinput, subtotal, tombol diskon, dan tombol bayar.
- **Fitur Auto-Focus Scanner:** Halaman POS harus memiliki logika _event listener_ tersembunyi (atau input box yang selalu _auto-focus_) agar setiap kali kasir menembakkan _Barcode Scanner_, sistem langsung membacanya tanpa kasir harus mengklik kolom pencarian terlebih dahulu.

## **8\. Kriteria Keberhasilan (Success Metrics)**

- **Metric 1:** Frontend SvelteKit merender UI tanpa _lag_, dan pencarian data stok sangat cepat.
- **Metric 2:** Proses sinkronisasi status pembayaran QRIS Midtrans dari Webhook ke layar kasir berjalan _real-time_ (\< 2 detik setelah pelanggan bayar).
- **Metric 3:** Tidak terjadi kebocoran data antar cabang (RLS berfungsi 100%).

## **9\. Rencana Rilis (Roadmap \- Scrum Epics untuk GitHub Issues)**

**Epic 1: Inisiasi Proyek & Infrastruktur (Sprint 0\)**

- \[Task\] Inisialisasi Repo GitHub botanirent-web.
- \[Task\] Setup SvelteKit, Tailwind CSS & Deploy ke Vercel.
- \[Task\] Setup Supabase Project & Desain Skema Database (Tabel Profiles, Branch, Inventory, Assets, Transactions).
- \[Task\] Implementasi Supabase Row Level Security (RLS) untuk keamanan Multi-Cabang.

**Epic 2: Autentikasi & Manajemen Cabang (Sprint 1\)**

- \[Task\] Integrasi Supabase Auth (Login/Logout) di SvelteKit.
- \[Task\] Setup _Role-Based Access Control_ (Pemetaan Kasir ke ID Cabang tertentu di tabel _Profiles_).
- \[Task\] Buat CRUD Data Cabang (_Branch Management_) khusus Owner.

**Epic 3: Manajemen Inventaris & Aset (Sprint 2\)**

- \[Task\] Buat UI & Logika SvelteKit untuk Kategori Barang (Sewa, Retail).
- \[Task\] Buat fitur _Bulk Upload_ Barang (Parse file Excel/CSV di klien, _batch insert_ ke Supabase).
- \[Task\] Buat CRUD Inventaris (Barang Jual).
- \[Task\] Buat CRUD Aset (Barang Sewa Satuan).
- \[Task\] Buat Manajemen Paket/Bundling Sewa.

**Epic 4: Point of Sales (POS) & Transaksi Kasir (Sprint 3\) \- _Prioritas Utama_**

- \[Task\] Desain UI Kasir Web dengan **Layout Terbagi** (Katalog Grid di Kiri, Keranjang/Cart di Kanan).
- \[Task\] Fungsionalitas _Global Event Listener_ untuk Barcode Scanner (Barang otomatis masuk cart saat discan).
- \[Task\] Fungsionalitas Transaksi Hybrid (Input Sewa Satuan \+ Sewa Paket \+ Retail ke dalam 1 Cart).
- \[Task\] Integrasi UI Kalender Booking (Kueri data _availability_ dari Supabase).
- \[Task\] Buat _Supabase RPC_ (Stored Procedure) untuk _Checkout_: Potong stok Retail & _booking_ Aset Sewa dalam satu transaksi atomik.

**Epic 5: Midtrans, Printer Web & Denda (Sprint 4\) \- _Prioritas Utama_**

- \[Task\] Buat UI Pembayaran Tunai (Kalkulator kembalian di Web).
- \[Task\] Buat **Supabase Edge Function** untuk meminta token/QRIS dari API Midtrans secara aman.
- \[Task\] Buat **Supabase Edge Function** untuk menerima Webhook notifikasi dari Midtrans.
- \[Task\] Integrasi _Supabase Realtime_ di SvelteKit untuk mendengarkan perubahan status pembayaran.
- \[Task\] Integrasi _Silent Print_ Thermal dari Web (Setup konfigurasi QZ Tray).
- \[Task\] Logika otomatis tagihan denda keterlambatan (Bisa menggunakan _Supabase Cron Jobs / pg_cron_).

**Epic 6: Laporan Terpusat & Finalisasi (Sprint 5\)**

- \[Task\] Buat UI _Dashboard_ Laporan untuk Owner (Grafik dan Tabel Agregasi cabang).
- \[Task\] Manajemen Status Pengembalian (Ubah status Aset ke "Maintenance").
- \[Task\] UAT (User Acceptance Testing) & _Bug Fixing_.
