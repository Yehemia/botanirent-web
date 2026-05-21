# **Product Requirements Document (PRD)**

**Proyek:** BotaniRent (Sistem Manajemen Rental & Retail Outdoor)

| Meta Data | Keterangan |
| :---- | :---- |
| **Versi** | 5.3 (SvelteKit \+ Supabase \+ Midtrans, Penambahan Hak Akses Aktor) |
| **Status** | Approved |
| **Penulis** | Kelompok 2 |
| **Tanggal** | 21 Mei 2026 |

## **1\. Ringkasan Eksekutif (Executive Summary)**

* **Tujuan:** Menyelesaikan masalah pencatatan manual yang terpisah antara barang sewa dan barang jual, mengurangi *human error*, serta mengotomatisasi perhitungan denda dan pengelolaan aset.  
* **Visi Produk:** BotaniRent akan menjadi solusi POS dan manajemen inventaris terpadu **berbasis multi-cabang**. Sistem ini memastikan ketersediaan alat akurat, transaksi (sewa & jual) tergabung dalam satu platform, dan *owner* dapat memantau performa seluruh cabang secara *real-time*.

## **2\. Target Pengguna (User Personas & Hak Akses)**

*Sistem ini menggunakan Role-Based Access Control (RBAC). Setiap aktor memiliki batasan fitur yang dapat diaksesnya sesuai dengan peran mereka di toko.*

* **Persona 1: Kasir / Admin Cabang**  
  * Mengutamakan kecepatan saat melayani pelanggan.  
  * **Fitur yang dapat diakses (Hak Akses):**  
    * Mengakses layar POS (Point of Sales) khusus untuk cabang tempat ia ditugaskan.  
    * Membuat transaksi baru (memasukkan barang sewa & ritel ke *cart*).  
    * Mengecek ketersediaan barang di Kalender Booking.  
    * Memproses pembayaran (Kalkulator Tunai & scan QRIS Midtrans).  
    * Mencetak struk bukti transaksi.  
    * Memproses pengembalian barang sewa dari pelanggan (mengenakan denda jika telat/rusak).  
* **Persona 2: Admin Gudang / Maintenance**  
  * Bertanggung jawab atas ketersediaan dan kondisi fisik barang di belakang layar.  
  * **Fitur yang dapat diakses (Hak Akses):**  
    * Mengakses menu Inventaris & Aset Cabang.  
    * Melakukan *Bulk Upload* (Excel/CSV) untuk menambah barang masal.  
    * Menambah, mengedit, atau menghapus item satuan.  
    * Membuat dan mengatur harga Paket Sewa (Bundling).  
    * Mengubah status operasional aset sewa (misal: memindahkan status tenda yang baru dikembalikan dari "Disewa" menjadi "Maintenance/Dicuci", dan mengembalikannya ke "Ready" jika sudah siap).  
* **Persona 3: Owner**  
  * Bertindak sebagai pengambil keputusan tingkat manajerial.  
  * **Fitur yang dapat diakses (Hak Akses):**  
    * Mengakses *Dashboard* Laporan Terpusat (melihat omzet harian/bulanan dari **semua cabang**).  
    * Melihat statistik barang yang paling sering disewa atau rusak/hilang.  
    * Manajemen Cabang (Membuka cabang baru di sistem, atau menonaktifkan cabang).  
    * Mengatur nominal dan aturan Master Data untuk "Denda Dinamis".  
    * Melihat log aktivitas transaksi dari seluruh kasir.

## **3\. Fitur Utama (Functional Requirements)**

*Penjelasan: Kebutuhan Fungsional (Functional Requirements) mendefinisikan **"apa yang harus bisa dilakukan oleh sistem"**. Ini adalah daftar fitur-fitur dan fungsi spesifik yang akan langsung berinteraksi dengan pengguna (kasir, admin, atau owner) untuk menyelesaikan pekerjaan mereka.*

| ID | Fitur | Deskripsi | Prioritas |
| :---- | :---- | :---- | :---- |
| FR-01 | Transaksi Hybrid | Kasir bisa memasukkan barang sewa dan barang ritel dalam satu struk/nota transaksi yang sama. | P1 |
| FR-02 | Kalender Booking | Sistem menampilkan kalender visual untuk mengecek ketersediaan aset spesifik. | P1 |
| FR-03 | Denda Dinamis | Admin dapat mengatur (*setting*) sendiri aturan dan nominal denda (keterlambatan/kerusakan), lalu sistem merekam tagihannya otomatis. | P1 |
| FR-04 | Pelacakan Aset & Kategori | Setiap aset bisa dilacak. Tersedia pemisahan kategori barang: Barang Sewa, Retail Home Industry, dan Retail Reseller. | P1 |
| FR-05 | Status Maintenance | Barang yang baru kembali otomatis berstatus "Dicuci/Maintenance" sebelum bisa disewakan lagi. | P2 |
| FR-06 | Multi-Cabang | Satu sistem untuk banyak toko. Data stok terpisah per cabang, tetapi laporan keuangan dapat dilihat terpusat oleh *Owner*. | P1 |
| FR-07 | Bulk Upload Barang | Admin dapat mengunggah daftar barang sekaligus menggunakan format Excel/CSV agar tidak perlu *input* manual satu per satu. | P1 |
| FR-08 | Sewa Satuan & Paket (Bundling) | Sistem mendukung penyewaan alat secara **satuan** maupun dalam bentuk **paket**. Admin dapat membuat paket dari beberapa barang satuan dengan harga khusus. | P1 |
| FR-09 | Metode Pembayaran (Cash & Cashless) | Sistem mendukung pembayaran **Tunai** (dengan fitur kalkulator kembalian) dan **Cashless** yang terintegrasi dengan **Midtrans** (QRIS, GoPay, VA bank). | P1 |

## **4\. Alur Pengguna (User Flow)**

**Skenario: Transaksi Gabungan (Input Sentuh \+ Scan Barcode) & Pembayaran**

1. Pelanggan datang ke meja kasir membawa barang logistik (Retail) di tangan dan menyebutkan alat sewa yang ingin disewa.  
2. **\[Input Sentuh\]:** Kasir melihat layar Tablet/PC, mencari, dan **mengklik/men-tap kotak "Paket Gunung 1"** dari *Katalog Menu Grid*. Item tersebut langsung berpindah ke kolom *Keranjang (Cart)*.  
3. **\[Input Scan\]:** Untuk barang ritel (logistik) yang dibawa pelanggan, kasir tidak perlu menyentuh layar. Kasir langsung **menembakkan *Barcode Scanner*** ke barang tersebut. Sistem secara otomatis mendeteksi kode dan menambahkannya ke *Keranjang (Cart)* yang sama.  
4. Sistem secara otomatis: memotong stok logistik ritel dan memblokir tanggal ketersediaan untuk seluruh aset sewa di kalender.  
5. Sistem memunculkan total harga. Pelanggan memilih metode pembayaran: **Tunai** atau **QRIS (Midtrans)**.  
6. **Jika Tunai:** Kasir menginput nominal uang yang diberikan pelanggan, sistem otomatis menampilkan uang kembalian.  
7. **Jika QRIS:** Aplikasi Web menembak *Edge Function*, lalu menampilkan antarmuka pembayaran Snap Midtrans atau QR Code statis di layar kasir.  
8. Setelah pembayaran selesai/berhasil, sistem Web mencetak struk secara *silent* (tanpa dialog print browser) menggunakan integrasi *hardware bridge* (QZ Tray/Local Print Server) ke Thermal Printer.

## **5\. Kebutuhan Teknis (Technical Requirements)**

* **Frontend:** **SvelteKit**. Dipilih karena performa tinggi tanpa *virtual DOM* overhead dan kapabilitas SSR/CSR yang sangat fleksibel. Di-deploy di **Vercel**.  
* **Backend/Database/Auth:** **Supabase**.  
  * Menggunakan **PostgreSQL** bawaan Supabase.  
  * Autentikasi menggunakan **Supabase Auth**.  
  * Keamanan isolasi data multi-cabang diatur murni menggunakan **Row Level Security (RLS)** di level *database*.  
* **Payment Gateway:** API **Midtrans** (Core API / Snap API). Logika pembayaran dan pengamanan *Server Key* Midtrans diletakkan di **Supabase Edge Functions** (Deno) agar tidak terekspos di Frontend.  
* **Integrasi Hardware:** Fitur cetak otomatis ke **Thermal Printer** menggunakan *bridge software* lokal (seperti **QZ Tray**) di PC Kasir.

## **6\. Kebutuhan Non-Fungsional (Non-Functional Requirements)**

*Penjelasan: Kebutuhan Non-Fungsional (Non-Functional Requirements) mendefinisikan **"bagaimana sistem harus bekerja"** di balik layar. Ini tidak berwujud tombol atau halaman antarmuka, melainkan standar kualitas, performa, dan keamanan yang menjamin aplikasi bisa berjalan dengan stabil, cepat, dan aman dari peretasan.*

* **Kinerja (Performance):** *Load time* awal aplikasi Web harus sangat cepat. Operasi *database* (CRUD) memanfaatkan *Supabase JS Client* dengan respons \< 200ms. Tombol-tombol di kasir tidak boleh memiliki jeda respons saat ditekan.  
* **Keandalan Integrasi:** *Callback* (Webhook) dari Midtrans ditangkap dengan aman oleh Supabase Edge Functions. Status pembayaran diteruskan ke antarmuka Kasir secara *real-time* menggunakan **Supabase Realtime** (WebSockets) tanpa perlu kasir me-*refresh* halaman.  
* **Keamanan:** Menerapkan *Role-Based Access Control* (RBAC) yang ketat. Selain itu, **RLS Supabase** memastikan di level server bahwa Kasir dari Cabang 'A' tidak akan pernah bisa melakukan SELECT (melihat) atau UPDATE (mengubah) data stok dan transaksi yang merupakan milik Cabang 'B'.

## **7\. Desain & Antarmuka (UI/UX)**

* **Platform Target:** Web Application (Diakses via Chrome/Safari/Edge di mesin kasir).  
* **Pendekatan Desain Utama:** **Responsive, Tablet-Optimized, & Dual-Input Support**.  
* **Tata Letak Layar Kasir (POS View):**  
  * Layar dirancang dalam mode layar penuh (*fullscreen*) dan dibagi menjadi 2 area utama.  
  * **Kiri/Tengah (Katalog Menu Grid):** Menampilkan daftar barang/paket sewa dalam bentuk kotak-kotak besar beserta gambar. Area ini dirancang *touch-friendly* agar kasir bisa langsung memilih barang dengan jari/mouse.  
  * **Kanan (Keranjang/Cart):** Menampilkan daftar pesanan yang sudah diinput, subtotal, tombol diskon, dan tombol bayar.  
* **Fitur Auto-Focus Scanner:** Halaman POS harus memiliki logika *event listener* tersembunyi (atau input box yang selalu *auto-focus*) agar setiap kali kasir menembakkan *Barcode Scanner*, sistem langsung membacanya tanpa kasir harus mengklik kolom pencarian terlebih dahulu.

## **8\. Kriteria Keberhasilan (Success Metrics)**

* **Metric 1:** Frontend SvelteKit merender UI tanpa *lag*, dan pencarian data stok sangat cepat.  
* **Metric 2:** Proses sinkronisasi status pembayaran QRIS Midtrans dari Webhook ke layar kasir berjalan *real-time* (\< 2 detik setelah pelanggan bayar).  
* **Metric 3:** Tidak terjadi kebocoran data antar cabang (RLS berfungsi 100%).

## **9\. Rencana Rilis (Roadmap \- Scrum Epics untuk GitHub Issues)**

**Epic 1: Inisiasi Proyek & Infrastruktur (Sprint 0\)**

* \[Task\] Inisialisasi Repo GitHub botanirent-web.  
* \[Task\] Setup SvelteKit, Tailwind CSS & Deploy ke Vercel.  
* \[Task\] Setup Supabase Project & Desain Skema Database (Tabel Profiles, Branch, Inventory, Assets, Transactions).  
* \[Task\] Implementasi Supabase Row Level Security (RLS) untuk keamanan Multi-Cabang.

**Epic 2: Autentikasi & Manajemen Cabang (Sprint 1\)**

* \[Task\] Integrasi Supabase Auth (Login/Logout) di SvelteKit.  
* \[Task\] Setup *Role-Based Access Control* (Pemetaan Kasir ke ID Cabang tertentu di tabel *Profiles*).  
* \[Task\] Buat CRUD Data Cabang (*Branch Management*) khusus Owner.

**Epic 3: Manajemen Inventaris & Aset (Sprint 2\)**

* \[Task\] Buat UI & Logika SvelteKit untuk Kategori Barang (Sewa, Retail).  
* \[Task\] Buat fitur *Bulk Upload* Barang (Parse file Excel/CSV di klien, *batch insert* ke Supabase).  
* \[Task\] Buat CRUD Inventaris (Barang Jual).  
* \[Task\] Buat CRUD Aset (Barang Sewa Satuan).  
* \[Task\] Buat Manajemen Paket/Bundling Sewa.

**Epic 4: Point of Sales (POS) & Transaksi Kasir (Sprint 3\) \- *Prioritas Utama***

* \[Task\] Desain UI Kasir Web dengan **Layout Terbagi** (Katalog Grid di Kiri, Keranjang/Cart di Kanan).  
* \[Task\] Fungsionalitas *Global Event Listener* untuk Barcode Scanner (Barang otomatis masuk cart saat discan).  
* \[Task\] Fungsionalitas Transaksi Hybrid (Input Sewa Satuan \+ Sewa Paket \+ Retail ke dalam 1 Cart).  
* \[Task\] Integrasi UI Kalender Booking (Kueri data *availability* dari Supabase).  
* \[Task\] Buat *Supabase RPC* (Stored Procedure) untuk *Checkout*: Potong stok Retail & *booking* Aset Sewa dalam satu transaksi atomik.

**Epic 5: Midtrans, Printer Web & Denda (Sprint 4\) \- *Prioritas Utama***

* \[Task\] Buat UI Pembayaran Tunai (Kalkulator kembalian di Web).  
* \[Task\] Buat **Supabase Edge Function** untuk meminta token/QRIS dari API Midtrans secara aman.  
* \[Task\] Buat **Supabase Edge Function** untuk menerima Webhook notifikasi dari Midtrans.  
* \[Task\] Integrasi *Supabase Realtime* di SvelteKit untuk mendengarkan perubahan status pembayaran.  
* \[Task\] Integrasi *Silent Print* Thermal dari Web (Setup konfigurasi QZ Tray).  
* \[Task\] Logika otomatis tagihan denda keterlambatan (Bisa menggunakan *Supabase Cron Jobs / pg\_cron*).

**Epic 6: Laporan Terpusat & Finalisasi (Sprint 5\)**

* \[Task\] Buat UI *Dashboard* Laporan untuk Owner (Grafik dan Tabel Agregasi cabang).  
* \[Task\] Manajemen Status Pengembalian (Ubah status Aset ke "Maintenance").  
* \[Task\] UAT (User Acceptance Testing) & *Bug Fixing*.