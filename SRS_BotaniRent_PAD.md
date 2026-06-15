## _**Software Requirements Specification**_

## **for Botani Outdoor Rent App**

**Version 1.0 approved**

**Prepared by 682024030 – Bellatrix Jessica Victory Putri 682024031 – Yehemia Gauand Rizki Mihing Sera 682024039 - Dwi Agus Kurniawan**

**21 May 2026**

## **Table of Contents**

| **Table of Contents**                                                                                                                                     | **Table of Contents**                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1.** **Pendahuluan ............................................................................................................................. 3**    |                                                                                                                                                         |
| **1.1**                                                                                                                                                   | Tujuan Penulisan Dokumen ............................................................................................................... 3              |
| **1.2**                                                                                                                                                   | Audien yang Dituju dan Pembaca yang Disarankan ........................................................................... 3                            |
| **1.3**                                                                                                                                                   | Batasan Produk .................................................................................................................................. 3     |
| **1.4**                                                                                                                                                   | Referensi ........................................................................................................................................... 4 |
| **2.** **Deskripsi Keseluruhan ............................................................................................................. 5**          |                                                                                                                                                         |
| **2.1**                                                                                                                                                   | Deskripsi Produk ............................................................................................................................... 5      |
| **2.2**                                                                                                                                                   | Fungsi Produk.................................................................................................................................... 5     |
| **2.3**                                                                                                                                                   | Penggolongan Karakterik Pengguna .................................................................................................. 5                   |
| **2.4**                                                                                                                                                   | Keunggulan Produk ........................................................................................................................... 6         |
| **2.5**                                                                                                                                                   | Business Process Modeling (BPM) .................................................................................................... 7                  |
| 2.5.1                                                                                                                                                     | Pembelian dan Peminjaman ............................................................................................................. 14               |
| 2.5.2                                                                                                                                                     | Pengembalian .................................................................................................................................. 15      |
| **3.** **KebutuhanAntarmuka Eksternal ............................................................................................. 8**                   |                                                                                                                                                         |
| **3.1**                                                                                                                                                   | User Interfaces ................................................................................................................................... 8   |
| **3.2**                                                                                                                                                   | Hardware Interface ............................................................................................................................ 8       |
| **3.3**                                                                                                                                                   | Communication Interface................................................................................................................... 9            |
| **4.** **Functional Requirement ......................................................................................................... 10**            |                                                                                                                                                         |
| **4.1**                                                                                                                                                   | Use Case Diagram ........................................................................................................................... 12         |
| **4.2**                                                                                                                                                   | Class Diagram ................................................................................................................................ 13       |
| **5.** **Non**                                                                                                                                            | **Functional Requirements ................................................................................................ 16**                         |
| **6.** **Timeline .................................................................................................................................. 16** |                                                                                                                                                         |

## **Revision History**

**Name Date Reason For Changes Version**

## **1. Pendahuluan**

## **1.1 Tujuan Penulisan Dokumen**

Dokumen ini bertujuan untuk mendefinisikan spesifikasi kebutuhan perangkat lunak (Software Requirements Specification) untuk pengembangan aplikasi BotaniRent. BotaniRent merupakan sistem manajemen rental dan retail outdoor yang bertujuan menyelesaikan masalah pencatatan manual yang terpisah. Sistem ini dikembangkan untuk mengurangi kesalahan manusia (human error) serta mengotomatisasi perhitungan denda dan pengelolaan aset.

## **1.2 Audien yang Dituju dan Pembaca yang Disarankan**

Dokumen ini ditujukan kepada pihak-pihak yang terlibat dalam siklus hidup pengembangan sistem ( _Software Development Life Cycle_ - SDLC) :

- **Analis Sistem (** _**System Analyst**_ **):** Menggunakan dokumen ini untuk memastikan keselarasan alur pemodelan proses bisnis dengan arsitektur sistem yang dirancang.

- **Tim Pengembang (** _**Developer**_ **):** Sebagai panduan teknis utama dalam mentransformasikan kebutuhan fungsional menjadi baris kode program, perancangan basis data, dan integrasi antarmuka.

- **Penguji Sistem (** _**Quality Assurance / Tester**_ **):** Sebagai landasan dalam penyusunan skenario pengujian ( _test case_ ) guna memvalidasi fungsionalitas sistem sebelum didemonstrasikan.

- **Dosen Pengampu / Tim Penilai:** Sebagai dokumen pertanggungjawaban akademis untuk mengevaluasi kelayakan metode analisis, perancangan sistem, dan pemenuhan spesifikasi teknis.

## **1.3 Batasan Produk**

- **Deskripsi Perangkat Lunak:** Botani OutdoorRent App adalah platform manajemen operasional dan reservasi persewaan alat kegiatan alam terbuka ( _outdoor_ ) berbasis aplikasi mobile webview.

- **Tujuan & Manfaat:** Mengotomatiskan manajemen inventarisasi aset, mendigitalisasi pencatatan sirkulasi barang (pengambilan/pengembalian), serta menyajikan kalkulasi denda keterlambatan secara akurat guna optimalisasi efisiensi operasional.

- **Batasan Proyek:** Ruang lingkup proyek ini difokuskan pada analisis kebutuhan pengguna, pemodelan arsitektur sistem, perancangan basis data, desain antarmuka

( _wireframing_ ), dan pembangunan prototipe fungsional untuk pemenuhan studi kasus.

## **1.4 Referensi**

_Anggraini, L., Kurniawan, N., Cahyono, Y., & Susanto. (2024). Aplikasi Penyewaan Peralatan Camping dan Hiking pada Pandanaran Outdoor Berbasis Web. Jurnal Ilmiah Teknologi Informasi dan Komunikasi (JTIK), 15(1), 112-124. https://doi.org/10.51903/jtikp.v15i1.830_

## **2. Deskripsi Keseluruhan**

## **2.1 Deskripsi Produk**

BotaniRent adalah sistem POS dan manajemen inventaris terpadu yang memastikan ketersediaan alat tercatat secara akurat. Aplikasi ini memusatkan transaksi penyewaan dan penjualan, serta memungkinkan pemilik bisnis untuk memantau kinerja operasional dan keuangan dari seluruh cabang secara waktu nyata (real-time).

## **2.2 Fungsi Produk**

- Memproses transaksi hybrid (barang sewa dan ritel) di dalam satu struk.

- Menyediakan kalender visual untuk memeriksa ketersediaan aset.

- Merekam tagihan denda keterlambatan atau kerusakan secara dinamis dan otomatis.

- Melacak aset berdasarkan kategori barang sewa, retail home industry, dan reseller.

- Memfasilitasi pembayaran tunai dan non-tunai (QRIS/Cashless).

## **2.3 Penggolongan Karakterik Pengguna**

Berikut adalah Tabel yang memuat penggolongan karakteristik pengguna :

**Tabel1 Karakteristik Pengguna**

| **Kategori**       | **Tugas**                                                                                   | **Hak Akses ke Aplikasi**                                                                                                               | **Kemampuan yang**                                   |
| ------------------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **Pengguna**       |                                                                                             |                                                                                                                                         | **harus dimiliki**                                   |
| Kasir              | Melayani pelanggan,<br>memproses transaksi,<br>dan menangani<br>pengembalian barang<br>sewa | Mengakses layar POS cabang<br>spesifik, membuat transaksi,<br>mengecek kalender booking,<br>memproses pembayaran, dan<br>mencetak struk | Kecepatan dalam<br>melayani dan menginput<br>pesanan |
| Karyawan<br>Gudang | Menjaga<br>ketersediaan stok<br>dan mengelola<br>kondisi fisik<br>barang                    | Mengakses menu Inventaris,<br>manajemen item satuan,<br>mengatur paket*bundling*, dan<br>mengubah status operasional<br>aset            | Manajemen aset<br>inventaris secara<br>teliti        |

| Owner | Mengambil keputusan<br>manajerial dan<br>memantau performa<br>cabang | Mengakses Dashboard laporan<br>terpusat, manajemen multi-<br>cabang, mengatur master data<br>denda dinamis, dan melihat log<br>kasir | Kemampuan analisis<br>data statistik dan<br>manajerial operasional |
| ----- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |

## **2.4 Keunggulan Produk**

Kebanyakan aplikasi kasir hanya menangani penjualan, sehingga toko yang juga menyewakan barang terpaksa mencatat di tempat terpisah. BotaniRent menangani keduanya dalam satu sistem transaksi sewa dan jual selesai dalam satu nota tanpa aplikasi tambahan. Kalender ketersediaan barang sudah terintegrasi langsung, sehingga pemesanan dobel tidak bisa terjadi. Denda keterlambatan dihitung otomatis oleh sistem, bukan manual. Pembayaran QRIS sudah terhubung langsung tanpa biaya langganan tambahan. Laporan seluruh cabang bisa dipantau dari satu tempat, tanpa harus datang ke masing-masing toko .

## **2.5 Business Process Modeling (BPM)**

## **Peminjaman Alat & Pembelian Ritel (Hybrid POS)**

1. Pelanggan datang ke kasir dengan barang ritel (contoh: gas portabel, jas hujan) dan menyebutkan daftar alat sewa beserta durasi/tanggal pemakaian.

2. Kasir memeriksa ketersediaan alat sewa melalui kalender sistem.

3. Kasir meminta kartu identitas (KTP/SIM) sebagai jaminan dan mencatat nomor kontak pelanggan.

4. Kasir menghitung total biaya belanja ritel + sewa, lalu mengonfirmasi nominal ke pelanggan.

5. Pelanggan melakukan pembayaran (tunai atau QRIS).

6. Kasir menyerahkan struk pembayaran dan menyimpan kartu identitas di laci jaminan.

7. Pelanggan diarahkan ke loket gudang dengan membawa struk untuk pengambilan barang sewa.

## **Pengambilan Barang di Gudang**

1. Pelanggan menunjukkan struk pembayaran ke staf gudang.

2. Staf gudang memverifikasi struk dan mengambil unit alat sesuai kode dari rak penyimpanan.

3. Staf gudang bersama pelanggan mengecek kondisi barang (kelengkapan, kebersihan, tidak rusak).

4. Pelanggan menandatangani lembar serah terima barang.

5. Staf gudang menyerahkan barang sewa, pelanggan membawa perlengkapan keluar toko.

## **Pengembalian Alat & Jaminan**

1. Pelanggan mengembalikan barang sewa ke kasir/meja pengembalian.

2. Kasir mencocokkan kode fisik barang dengan nota sewa.

3. Kasir mengecek waktu pengembalian:

- Jika terlambat → hitung denda keterlambatan.

4. Kasir memeriksa kondisi barang:

- Jika kotor/rusak/hilang → hitung denda cuci, kerusakan, atau kehilangan.

5. Kasir menagih total denda (jika ada).

6. Pelanggan membayar denda.

7. Kasir mengembalikan kartu identitas jaminan kepada pelanggan.

## **Perawatan Alat Pasca-Sewa (Gudang)**

1. Staf gudang membawa barang yang dikembalikan ke ruang perawatan.

2. Perawatan dilakukan sesuai kondisi:

- **Normal/kotor:** dicuci, dibersihkan, dijemur hingga kering.

- **Rusak:** diperbaiki (ganti tali, tambal kain, dll.).

3. Staf gudang melakukan kontrol kualitas (QC) akhir.

4. Barang dikembalikan ke rak penyimpanan stok utama.

5. Status barang di sistem diperbarui menjadi “ **Siap Disewa** ”.

## **Pemantauan Bisnis oleh Owner**

1. Owner membuka dasbor manajerial dari perangkat pribadi.

2. Owner melihat laporan: omzet harian, jumlah transaksi, kerugian akibat barang rusak/hilang.

3. Owner menganalisis performa staf (kasir aktif) dan statistik barang (alat paling laku). 4. Owner menyesuaikan kebijakan toko (durasi paket sewa, tarif denda, dll.) langsung melalui aplikasi.

## **3. Kebutuhan Antarmuka Eksternal**

## **3.1 User Interfaces**

Menu yang tampil di sidebar menyesuaikan role pengguna yang login Kasir hanya mengakses POS, Data Penyewa, Kalender Booking, Pengembalian, dan Riwayat; Admin Gudang hanya mengakses Inventaris, Paket Bundling, dan Status Aset; Owner dapat mengakses dashboard laporan terpusat seluruh cabang, menu statistik, manajemen cabang, staf, pengaturan sistem, serta log aktivitas. Dashboard menjadi halaman utama setelah login, berisi ringkasan pendapatan bulan ini, jumlah transaksi sukses, grafik tren 7 hari terakhir, dan status fisik aset gudang. Di POS, produk ditampilkan dalam bentuk grid dengan filter Sewa Alat, Paket Bundling, dan Retail/Jual; item yang dipilih langsung masuk ke keranjang di sisi kanan. Data Penyewa mencatat daftar pelanggan lengkap dengan status, dan riwayat sewa mereka. Kalender Booking memberi gambaran visual jadwal penyewaan per bulan atau minggu. Pengembalian dipakai kasir untuk memproses barang kembali sekaligus menghitung denda jika terlambat. Riwayat Transaksi merekam semua transaksi dengan kode, waktu, nama pelanggan, tipe, total tagihan, dan status pembayaran. Di sisi Gudang, Inventaris mengelola data barang dengan kategori, harga, dan stok; Status Aset memperlihatkan posisi setiap unit fisik dalam Kanban empat kolom (Siap Disewa, Sedang Disewa, Dicuci, Perbaikan). Khusus Owner, Manajemen Cabang mengelola data dan status tiap cabang, Manajemen Staff mengatur role dan penempatan staf, Pengaturan Sistem dipakai untuk mengatur durasi siklus sewa dan nominal denda harian, dan Log Aktivitas mencatat semua aksi pengguna di seluruh cabang secara real-time.

## **3.2 Hardware Interface**

Bagian ini menjelaskan perangkat keras (hardware) yang digunakan dalam

operasional aplikasi BotaniRent beserta fungsinya.

1. Tablet

Tipe Perangkat:

Tablet berbasis Android atau iOS (iPad) dengan ukuran layar minimal 10 inci.

Cara Penggunaan:

Digunakan sebagai perangkat utama pada bagian Kasir untuk mencatat

transaksi sewa dan penjualan barang, serta digunakan oleh Admin Gudang untuk mengelola stok barang dan status pemeliharaan alat. Pengoperasian dilakukan melalui layar sentuh (touchscreen).

2. Smartphone

Tipe Perangkat:

Smartphone berbasis Android atau iOS milik Owner (pemilik toko). Cara Penggunaan:

Digunakan untuk memantau dashboard laporan keuangan, omzet harian, dan

performa toko secara portabel. Tampilan aplikasi menyesuaikan ukuran layar HP (responsive layout).

3. Thermal Printer

Tipe Perangkat:

Printer thermal kasir dengan ukuran kertas 58 mm atau 80 mm yang terhubung melalui Bluetooth atau Wi-Fi.

Cara Penggunaan:

Mendukung dua cara cetak struk:

- Di HP/Tablet: Otomatis konek ke Printer Bluetooth lewat aplikasi mobile.

- Di Laptop/Komputer: Memakai dialog cetak bawaan browser (window.print).

## **3.3 Communication Interface**

Bagian ini menjelaskan bagaimana aplikasi bertukar data dengan database dan layanan eksternal melalui jaringan internet.

1. Akses Browser dan HTTPS

Pengguna mengakses aplikasi melalui browser seperti Google Chrome atau Safari menggunakan protokol HTTPS agar data pengguna lebih aman karena terenkripsi.

## 2. Format Data JSON

Data seperti transaksi, informasi pelanggan, dan stok barang dikirim dalam format

JSON agar proses pertukaran data menjadi lebih cepat dan ringan.

3. Koneksi Real-Time (Supabase Realtime)

Sistem menggunakan fitur realtime dari Supabase agar perubahan data, seperti status pembayaran QRIS, dapat langsung diperbarui secara otomatis tanpa perlu melakukan refresh halaman.

## 4. Pengiriman Email (SMTP)

Sistem menggunakan layanan SMTP untuk mengirim email otomatis, seperti

verifikasi akun dan reset password.

5. Gateway Pembayaran (Midtrans Webhook)

Sistem terhubung dengan Midtrans untuk menerima notifikasi otomatis ketika

pembayaran QRIS atau e-wallet berhasil dilakukan.

## 6. Kebutuhan Internet

Sistem memerlukan koneksi internet yang stabil, baik melalui Wi-Fi maupun data seluler, agar proses transaksi dan sinkronisasi data berjalan lancar.

## **4. Functional Requirement**

| **ID** | **Kebutuhan Fungsional** | **Penjelasan**                                                                                      |
| ------ | ------------------------ | --------------------------------------------------------------------------------------------------- |
| FR-01  | Transaksi Hybrid         | Kasir bisa memasukkan barang<br>sewa dan barang ritel dalam satu<br>struk/nota transaksi yang sama. |
| FR-02  | Kalender Booking         | Sistem menampilkan kalender                                                                         |

|       |                                     | visual untuk mengecek ketersediaan<br>aset spesifik.                                                                                                                                                                                            |
| ----- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-03 | Denda Dinamis                       | Sistem memisahkan dua jenis<br>denda:<br>1. **Denda Terlambat:**Diatur<br>lewat menu*Pengaturan*<br>_Sistem_(berlaku global per<br>hari).<br>2. **Denda Rusak/Hilang:**<br>Diatur lewat menu*Aturan*<br>_Denda_(berlaku spesifik per<br>barang) |
| FR-04 | Pelacakan Aset & Kategori           | Setiap aset bisa dilacak. Tersedia<br>pemisahan kategori barang: Barang<br>Sewa, Retail Home Industry, dan<br>Retail Reseller.                                                                                                                  |
| FR-05 | Status Maintenance                  | Barang yang baru kembali otomatis<br>berstatus "Dicuci/Maintenance"<br>sebelum bisa disewakan lagi.                                                                                                                                             |
| FR-06 | Multi-Cabang                        | Satu sistem untuk banyak toko. Data<br>stok terpisah per cabang, tetapi<br>laporan keuangan dapat dilihat<br>terpusat oleh*Owner*.                                                                                                              |
| FR-08 | Sewa Satuan & Paket (Bundling)      | Sistem mendukung penyewaan alat<br>secara**satuan**maupun dalam bentuk<br>**paket**. Admin dapat membuat paket<br>dari beberapa barang satuan dengan<br>harga khusus.                                                                           |
| FR-09 | Metode Pembayaran (Cash & Cashless) | Sistem mendukung pembayaran<br>**Tunai**(dengan fitur kalkulator<br>kembalian) dan**Cashless**yang<br>terintegrasi dengan**Midtrans**<br>(QRIS, GoPay, VA bank).                                                                                |

**4.1 Use Case Diagram**

**==> picture [102 x 13] intentionally omitted <==**

**----- Start of picture text -----**<br>
4.2 Class Diagram<br>**----- End of picture text -----**<br>

## **4.3 BPMN**

## **2.5.1 Pembelian dan Peminjaman**

## **2.5.2 Pengembalian**

## **5. Non Functional Requirements**

| **ID** | **Parameter** | **Kebutuhan**                                                                                                                                                                          |
| ------ | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-01 | Availability  | Aplikasi web dapat diakses dengan andal dengan<br>pengaturan status pembayaran dan pencetakan otomatis<br>yang tangguh terhadap kegagalan respons (_webhook_<br>_callback_).           |
| NFR-02 | Reliability   | Sinkronisasi status pembayaran dari Webhook Midtrans<br>ke layar kasir berjalan stabil dan presisi.                                                                                    |
| NFR-03 | Ergonomy      | Antarmuka POS mendukung penginputan ganda (_dual-_<br>_input support_) yang responsif terhadap ketukan layar<br>sentuh dan pindai kode batang tanpa jeda fokus (tanpa<br>klik manual). |
| NFR-04 | Portability   | Aplikasi ditargetkan sebagai_Web Application_yang<br>dapat diakses portabel melalui peramban mesin kasir<br>standar (Chrome/Safari/Edge).                                              |
| NFR-05 | Memory        | N/A                                                                                                                                                                                    |
| NFR-06 | Response time | Waktu muat (load time) awal sangat cepat; operasi<br>antarmuka tanpa*lag*, kueri basis data (CRUD) harus<br>merespons kurang dari 1000 milidetik.                                      |
| NFR-07 | Safety        | N/A                                                                                                                                                                                    |
| NFR-08 | Security      | Isolasi data multi-cabang dijaga ketat di level pangkalan<br>data menggunakan Row Level Security (RLS) serta<br>Role-Based Access Control (RBAC).                                      |

## **6. Timeline**

Start date: 6 Mei 2026 End date: 1 Juni 2026

|                                                  |        |        |        |           |           |           |           |
| ------------------------------------------------ | ------ | ------ | ------ | --------- | --------- | --------- | --------- |
| Kegiatan                                         | Week 1 | Week 2 | Week 3 | Week<br>4 | Week<br>5 | Week<br>6 | Week<br>7 |
| Requireme<br>nt<br>gathering                     | ✓      |        |        |           |           |           |           |
| Desain..                                         |        | ✓      | ✓      |           |           |           |           |
| Sprint 0(Init<br>commit and<br>setup<br>project) |        |        | ✓      |           |           |           |           |
| Sprint 1(<br>Auth &<br>Manage<br>branch)         |        |        | ✓      |           |           |           |           |

|                                                      |     |     |     |     |     |     |     |
| ---------------------------------------------------- | --- | --- | --- | --- | --- | --- | --- |
| Sprint<br>2(Inventari<br>s & Aset)                   |     |     |     | ✓   |     |     |     |
| Sprint<br>3(POS &<br>Transaksi)                      |     |     |     |     |     |     |     |
| Sprint<br>4(Payment<br>& Penalty)                    |     |     |     |     |     |     |     |
| Sprint<br>5(Dashboa<br>rd, laporan,<br>& finalisasi) |     |     |     |     |     |     |     |
| Testing                                              |     |     |     |     |     |     |     |
