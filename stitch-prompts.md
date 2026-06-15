# 🎨 BotaniRent — Prompt Guide untuk Stitch

> **Cara Pakai:** Copy-paste setiap prompt di bawah ke Stitch satu per satu untuk generate setiap screen.
> Pastikan file `design.md` sudah di-upload/attach sebagai konteks ke Stitch sebelum mulai.

---

## 🔑 System Prompt (Paste ini PERTAMA sebelum generate screen apapun)

```
Kamu adalah UI/UX designer profesional. Saya sedang membangun web app bernama "BotaniRent" — sebuah Sistem Manajemen Rental & Retail untuk toko outdoor/camping.

Berikut aturan design yang WAJIB diikuti di SEMUA screen:

TEMA: "Alpine Earth" — Earthy, warm, natural, premium.
WARNA UTAMA:
- Primary: Forest Green #2D5016
- Primary Light: Sage Green #6B8F4E
- Secondary: Warm Amber #D4A843
- Accent: Terracotta #C85A3A
- Background: Warm Cream #FAF6F0
- Surface/Card: #F0E8D8 atau #FFFFFF
- Text Primary: #2C2418
- Text Secondary: #7A7062
- Border: #D6CBBB
- Success: #4A7C3F | Warning: #E8A820 | Error: #C44032 | Info: #3B82B0

TYPOGRAPHY:
- Heading: "Outfit" (Google Fonts), bold/semibold
- Body text: "Inter" (Google Fonts)
- Angka & harga: "JetBrains Mono" (monospace)

STYLE RULES:
- Border-radius: 6px (buttons/input), 8px (cards), 12px (modals)
- Shadow subtle: earthy tone rgba(44,36,24,0.06)
- Spacing konsisten: kelipatan 4px/8px
- Semua tombol & elemen interaktif minimal 44x44px (touch-friendly untuk tablet)
- Ikon: style outlined/line, stroke 1.5px (Lucide Icons style)
- Tidak boleh ada warna neon atau warna yang tidak ada di palette
- Kesan visual: premium, bersih, hangat, profesional — bukan playful/kartun

Gunakan aturan ini secara KONSISTEN di setiap screen yang saya minta.
```

---

## Screen A1 — Login Page

```
Buatkan halaman Login untuk web app "BotaniRent".

Layout: Split screen horizontal.
- KIRI (55%): Area branding visual. Background foto pemandangan gunung/hutan dengan dark overlay 40%. Di tengah area ini tampilkan logo "BotaniRent" besar berwarna putih, dengan ikon daun+tenda. Di bawah logo ada tagline "Sistem Manajemen Rental & Retail Outdoor" dalam font putih.
- KANAN (45%): Area form login dengan background Warm Cream #FAF6F0.

Form login (centered, max-width 380px):
- Heading: "Selamat Datang" — font Outfit, bold, 24px, warna #2C2418
- Subtext: "Masuk ke akun BotaniRent Anda" — font Inter, 14px, warna #7A7062
- Field Email: label + input field, placeholder "nama@email.com"
- Field Password: label + input field dengan toggle icon show/hide
- Row: checkbox "Ingat saya" (kiri) dan link "Lupa Password?" (kanan, warna #6B8F4E)
- Tombol "Masuk" — full width, background #2D5016, teks putih, tinggi 48px, border-radius 6px
- Divider dengan teks "atau"
- Tombol "Masuk dengan Google" — full width, outline style, dengan Google icon

Tambahkan subtle watermark pattern daun/gunung di panel kanan dengan opacity sangat rendah (3%). Kesan keseluruhan: warm, premium, profesional.

Resolusi: 1440x900px (desktop)
```

---

## Screen A2 — Forgot Password

```
Buatkan halaman Forgot Password / Reset Password untuk "BotaniRent".

Layout: Centered card di atas background Warm Cream #FAF6F0.

Konten (max-width 420px, centered vertikal & horizontal):
- Link "← Kembali ke Login" di atas (warna #6B8F4E)
- Icon amplop/email dalam lingkaran 64px, background #6B8F4E1A, icon warna #2D5016
- Heading: "Reset Password" — Outfit, bold, 24px
- Subtext: "Masukkan email Anda untuk menerima link reset password" — Inter, 14px, #7A7062
- Input field Email
- Tombol "Kirim Link Reset" — full width, primary green #2D5016

Card memiliki background putih, border-radius 12px, shadow subtle. Kesan: clean, simple, trustworthy.

Resolusi: 1440x900px
```

---

## Screen B1+B2+B3 — POS Kasir (Main View)

```
Buatkan halaman utama POS (Point of Sale) untuk kasir toko outdoor "BotaniRent". Ini adalah screen yang PALING PENTING.

Layout: Fullscreen, TANPA sidebar. Split menjadi 2 area.

TOP BAR (tinggi 56px):
- Background: Forest Green #2D5016
- Kiri: Logo "BotaniRent" kecil dalam warna #D4A843 (amber)
- Tengah: Badge nama cabang "Cabang Bandung" (pill, bg rgba(255,255,255,0.15), teks putih)
- Kanan: Jam digital (monospace, putih), avatar user kecil 32px, icon hamburger menu

AREA KIRI (60% lebar — Katalog Produk):
- Background: #FAF6F0
- Atas: Search bar besar (tinggi 48px), placeholder "Cari barang atau scan barcode...", icon search di kiri
- Di bawah search: Horizontal scrollable category pills/tabs:
  "Semua" (active, bg #2D5016, teks putih), "⛺ Paket Sewa", "🎒 Sewa Satuan", "🏭 Retail Home Industry", "🏪 Retail Reseller" (inactive, bg #F0E8D8, teks #7A7062)
- Grid produk (3-4 kolom, gap 12px, scrollable):
  Setiap product card: background putih, border 1px solid #E8DFC8, border-radius 8px.
  - Foto produk di atas (aspect ratio 1:1)
  - Nama produk: Inter, 14px, semibold, max 2 baris
  - Category badge kecil (pill): "Sewa" hijau atau "Retail" amber
  - Harga: JetBrains Mono, 16px, bold, warna #2D5016. Format "Rp 50.000/hari" untuk sewa, "Rp 25.000" untuk retail
  - Stok: caption kecil "Stok: 12", warna #7A7062

Contoh produk yang ditampilkan: "Paket Gunung 1", "Tenda Dome 4P", "Sleeping Bag", "Kompor Portable", "Headlamp", "Trekking Pole", "Carrier 60L", "Matras", "Gas Kaleng", "Karabiner", "Sarung Tangan", "Raincoat"

AREA KANAN (40% lebar — Keranjang/Cart):
- Background: #FFFFFF, border-left 1px solid #E8DFC8
- Header: "Keranjang" dengan icon cart dan badge merah "3" (jumlah item)
- Daftar item di cart (scrollable):
  Setiap item: thumbnail kecil 48x48, nama, badge tipe ("Sewa"/"Retail"), info tanggal sewa jika sewa "12 Jun-15 Jun (3 hari)", qty controls [-][1][+], subtotal (monospace, green), icon trash merah
- Tampilkan 3 contoh item di cart

Footer cart (sticky bawah):
- Border-top 1px solid #D6CBBB
- Subtotal: label kiri, nilai kanan (monospace)
- Diskon: -Rp 25.000 (warna terracotta)
- Garis pemisah
- TOTAL: font besar 20px, bold, monospace, warna #2D5016 "Rp 325.000"
- 2 tombol: "Diskon" (secondary/outline) dan "Bayar — Rp 325.000" (primary hijau besar)

Kesan: Bersih, profesional, mudah dibaca cepat, touch-friendly. Seperti POS modern premium.

Resolusi: 1440x900px
```

---

## Screen B4 — Modal Detail Sewa

```
Buatkan modal/popup "Detail Penyewaan" untuk POS BotaniRent, yang muncul ketika kasir menambahkan barang sewa ke keranjang.

Modal: Lebar 500px, centered, dengan overlay gelap di belakang (rgba(44,36,24,0.5) + blur).
Background modal: putih, border-radius 12px, shadow besar.

Konten modal:
- Header: "Detail Penyewaan" — Outfit, semibold, 20px. Tombol X (close) di kanan atas.
- Preview item: thumbnail kecil + nama "Tenda Dome 4P" + "Rp 75.000/hari" (monospace, hijau)
- Spacer
- 2 date picker input berdampingan:
  - "Tanggal Mulai Sewa" — input tanggal, tinggi 48px (touch-friendly)
  - "Tanggal Kembali" — input tanggal, tinggi 48px
- Auto-calculated info: "Durasi: 3 hari" (badge hijau)
- Auto-calculated: "Subtotal: Rp 225.000" (font besar, monospace, bold, hijau)
- Quantity stepper: label "Jumlah" + controls [-][1][+]
- Footer modal: tombol "Batal" (secondary) + tombol "Tambah ke Keranjang" (primary hijau)

Ikuti color palette Alpine Earth. Resolusi: 1440x900px (tampilkan dengan background POS yang di-blur di belakang modal)
```

---

## Screen B5 — Modal Pembayaran Tunai

```
Buatkan modal pembayaran tunai untuk POS kasir BotaniRent.

Modal: Lebar 540px, centered, overlay gelap + blur di belakang.

Konten:
- Header: "Pembayaran Tunai" — icon uang, Outfit bold
- Total section:
  - Label "Total Pembayaran"
  - Angka besar: "Rp 325.000" — font 36px, JetBrains Mono, bold, warna #2D5016
- Input "Nominal Uang Pelanggan":
  - Input field besar (tinggi 56px, font 24px, monospace, rata kanan)
  - Prefix "Rp" di dalam input
  - Sudah terisi: "Rp 500.000"
- Quick amount buttons (grid 3 kolom):
  - "Rp 350.000", "Rp 400.000", "Rp 500.000", "Rp 1.000.000", "Uang Pas"
  - Style: ghost button, border 1px solid #D6CBBB
- Section Kembalian (highlighted box):
  - Background: #4A7C3F1A (hijau muda transparan), border-radius 8px, padding 16px
  - Label "Kembalian"
  - Angka: "Rp 175.000" — font 24px, JetBrains Mono, bold, warna #4A7C3F (hijau)
- Footer: tombol "Batal" (secondary) + tombol "Proses & Cetak Struk" (primary, icon printer)

Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen B6 — Modal Pembayaran QRIS

```
Buatkan modal pembayaran QRIS/cashless untuk POS kasir BotaniRent.

Modal: Lebar 500px, centered, overlay gelap blur.

Konten:
- Header: "Pembayaran QRIS"
- Total: "Rp 325.000" — H3, monospace, bold
- QR Code area di tengah:
  - QR code placeholder 240x240px (kotak hitam-putih)
  - Di bawah QR: "Scan menggunakan aplikasi e-wallet Anda" — teks kecil #7A7062
  - Row logo e-wallet kecil: GoPay, OVO, DANA, ShopeePay
- Status section:
  - Animated indicator (titik hijau berkedip/pulse) + teks "Menunggu pembayaran..."
  - Warna teks: #7A7062
- Timer: "Berlaku hingga: 14:55:30" — caption, monospace
- Footer: link "Bayar Tunai" (ghost) + tombol "Batal"

Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen B7 — Struk Preview

```
Buatkan modal preview struk thermal untuk POS BotaniRent.

Modal: Lebar 380px, centered. Styled seperti struk kertas thermal printer.

Konten struk (font monospace seluruhnya, background putih):
- Logo "BotaniRent" centered, bold
- "Cabang Bandung" | "Jl. Raya Lembang No. 45" | "Telp: 022-1234567" — centered, kecil
- Garis putus-putus "- - - - - - - - - - - -"
- No: TRX-2026-0042 | Tanggal: 21/05/2026 | Kasir: Ahmad
- Garis putus-putus
- Daftar item (rata kiri nama, rata kanan harga):
  - "Paket Gunung 1      Rp 200.000"
  - "  12 Jun - 15 Jun (3 hari)"
  - "Gas Kaleng x2        Rp  30.000"
  - "Sarung Tangan        Rp  25.000"
- Garis putus-putus
- Subtotal, Diskon, TOTAL (bold besar)
- Bayar: Tunai Rp 500.000 | Kembali: Rp 175.000
- Garis putus-putus
- "Terima kasih sudah berbelanja!" centered
- Barcode kecil di bawah

Di bawah struk (area modal footer):
- Tombol "Tutup" (secondary) + tombol "Cetak Struk" (primary, icon printer)

Resolusi: 1440x900px
```

---

## Screen B8 — Kalender Booking

```
Buatkan halaman Kalender Booking untuk web app BotaniRent.

Layout: Standard layout dengan sidebar navigasi di kiri (background #2D5016, menu items putih) dan top bar di atas (putih, 64px).

Konten utama:
- Page header: "Kalender Booking" — Outfit, bold, 24px
- Filter bar:
  - Dropdown "Pilih Aset": value "Tenda Dome 4P"
  - Category pills filter
  - Toggle: "Bulan" (active) / "Minggu"
- Navigasi bulan: "← Juni 2026 →" dengan panah kiri/kanan
- Grid kalender bulanan (7 kolom: Sen-Min):
  - Header kolom: nama hari, font 12px, uppercase, #7A7062
  - Setiap sel tanggal:
    - Nomor tanggal di kiri atas
    - Tanggal hari ini: border 2px solid #2D5016
    - Tanggal available: background putih
    - Tanggal booked/disewa: bar horizontal warna #3B82B01A dengan teks biru "Sewa - Budi"
    - Tanggal maintenance: bar horizontal warna #E8A8201A dengan teks amber "Maintenance"
  - Tampilkan beberapa booking yang span beberapa hari (bar memanjang)
- Legend di bawah kalender: 3 warna swatch + label "Available", "Disewa", "Maintenance"

Sidebar kiri tampilkan menu: POS, Kalender Booking (active/highlighted), Pengembalian, Riwayat.
Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen B9 — Pengembalian Barang Sewa

```
Buatkan halaman Pengembalian Barang Sewa untuk BotaniRent.

Layout: Standard dengan sidebar + top bar.

Konten:
- Page header: "Pengembalian Barang Sewa"
- Horizontal stepper di atas: Step 1 "Cari Transaksi" (done, hijau) → Step 2 "Cek Barang" (active, hijau) → Step 3 "Konfirmasi" (upcoming, abu)

Tampilkan state Step 2 (Cek Barang):
- Card summary transaksi di atas: ID "TRX-2026-0042", Pelanggan "Budi Santoso", Periode "12-15 Jun 2026"
- Tabel barang yang dikembalikan:
  - Kolom: Nama Barang, Qty, Tgl Kembali Seharusnya, Kondisi (dropdown), Catatan
  - Row 1: "Tenda Dome 4P", 1, "15 Jun 2026", dropdown value "Baik ✓", kosong
  - Row 2: "Sleeping Bag", 2, "15 Jun 2026", dropdown value "Rusak Ringan ⚠️", "Resleting macet"
  - Row 3: "Kompor Portable", 1, "15 Jun 2026" + badge merah "Terlambat 2 hari", dropdown "Baik ✓", kosong
- Card denda (background #E8A8201A, border-left 4px amber):
  - "Denda Keterlambatan: Rp 30.000 (2 hari × Rp 15.000/hari)"
  - "Denda Kerusakan: Rp 50.000"
  - Garis pemisah
  - "Total Denda: Rp 80.000" — bold, monospace, merah

- Tombol "Kembali" (secondary) dan "Lanjut ke Konfirmasi" (primary)

Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen B3a — Modal Pilih Penyewa (di POS Cart)

```
Buatkan modal "Pilih Penyewa" yang muncul di POS kasir BotaniRent saat kasir mengklik area "Pilih Penyewa" di panel keranjang.

Modal: Lebar 540px, centered, overlay gelap blur.

Konten:
- Header: "Pilih Penyewa" — Outfit semibold 20px. Tombol X close di kanan atas.
- Search bar besar (tinggi 48px): placeholder "Cari nama, telepon, atau No. KTP...", icon search kiri
- Di bawah search: link "+ Tambah Penyewa Baru" warna #6B8F4E (klik ini buka form tambah penyewa langsung di modal yang sama)

Hasil pencarian (scrollable list, max-height 360px):
- Setiap customer row:
  - Avatar circle 40px (initials, bg #6B8F4E1A, text #2D5016)
  - Nama: Inter 14px, semibold, #2C2418
  - No. HP: caption 13px, #7A7062
  - No. KTP: caption 12px, #B0A696
  - Status kecil di kanan: badge "Aktif Menyewa" (biru) atau kosong
  - Hover: bg #F0E8D8
  - Border-bottom: 1px solid #E8DFC8

Contoh 5 customer: Budi Santoso (081234567890), Siti Rahayu (085678901234), Ahmad Fadli (087890123456), Dewi Lestari (089012345678), Rizky Pratama (082345678901)

- Klik customer → modal tertutup, customer terpilih ditampilkan di header cart
- State kosong (jika search tidak menemukan): icon user-x + "Penyewa tidak ditemukan" + tombol "Tambah Penyewa Baru"

Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen B11 — Data Penyewa (Daftar)

```
Buatkan halaman Data Penyewa / Daftar Pelanggan untuk kasir BotaniRent.

Layout: Standard dengan sidebar navigasi kiri (background #2D5016) + top bar putih. Menu "Data Penyewa" aktif/highlighted di sidebar.

Konten:
- Header: "Data Penyewa" (H2, kiri) + tombol "Tambah Penyewa" (primary hijau, icon +, kanan)

Stats row (3 metric cards kecil, 1 baris):
1. Icon user dalam lingkaran hijau + "Total Penyewa" + "128" (bold, monospace)
2. Icon package dalam lingkaran biru + "Sedang Menyewa" + "18"
3. Icon alert dalam lingkaran merah + "Penyewa Bermasalah" + "3"

Filter bar:
- Search input: "Cari nama, telepon, atau No. KTP..."
- Status pills: "Semua (128)", "Aktif Menyewa (18)" (biru), "Riwayat (107)" (hijau), "Bermasalah (3)" (merah)
- Sort dropdown: "Terbaru"

Tabel data:
- Header: background #F0E8D8, font uppercase 12px, #7A7062
- Kolom: Avatar (36px circle), Nama Lengkap, No. HP, No. KTP, Total Sewa, Status (badge), Terakhir Sewa, Aksi (icon eye + edit + trash)
- Avatar: circle dengan inisial, bg #6B8F4E1A, text #2D5016
- Status badge: "Aktif Menyewa" pill biru, "Selesai" pill hijau, "Ada Denda" pill merah, "Baru" pill abu
- Tampilkan 8 baris contoh data penyewa dengan nama-nama Indonesia
- Row hover: background #FAF6F0
- Pagination: "Menampilkan 1-20 dari 128 penyewa"

Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen B12 — Form Tambah Penyewa

```
Buatkan modal form Tambah Penyewa Baru untuk BotaniRent.

Modal: Lebar 600px, centered, overlay gelap blur, background putih, border-radius 12px.

Header modal: "Tambah Penyewa Baru" + tombol X close

Form (single column):

SECTION 1 — "Identitas" (label section kecil, uppercase, #7A7062):
- Avatar upload: circle 80px centered, dashed border, icon kamera, teks "Upload Foto" di bawah
- Field "Nama Lengkap" (text input, required * merah)
- Field "No. KTP / NIK" (text input, placeholder "16 digit NIK", required *)
  - Helper text di bawah: "Nomor Induk Kependudukan untuk identifikasi" (12px, #7A7062)

SECTION 2 — "Kontak":
- Field "No. HP / WhatsApp" (text input, icon phone di kiri, required *)
  - Helper: "Untuk konfirmasi dan follow-up pengembalian"
- Field "Email" (text input, optional — tidak ada tanda *)
- Field "Alamat" (textarea 2 baris)

SECTION 3 — "Jaminan":
- Field "Jenis Jaminan" (dropdown: "Tidak Ada", "KTP Asli", "SIM", "Kartu Mahasiswa", "Deposit Uang", "Lainnya") — currently showing "KTP Asli"
- Field "Foto Jaminan" (small dashed border upload box, icon image)
- Field "Catatan" (text input, placeholder "Catatan tambahan...")

Footer modal: tombol "Batal" (secondary) + tombol "Simpan Penyewa" (primary hijau)

Semua label: Inter 13px, medium weight. Input border: #D6CBBB, focus: #6B8F4E.
Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen B13 — Detail Penyewa

```
Buatkan halaman Detail Penyewa untuk BotaniRent.

Layout: Standard dengan sidebar + top bar.

Konten:
- Back link di atas: "← Kembali ke Data Penyewa" (warna #6B8F4E)
- Layout 2 kolom:

KOLOM KIRI (35%) — Profil Penyewa:
Card putih, border-radius 12px, shadow kecil, padding 24px:
- Avatar besar: 96px circle, centered, background #6B8F4E1A, teks inisial "BS" warna #2D5016
- Nama: "Budi Santoso" — H3, centered
- Badge "Aktif Menyewa" (pill biru, centered)
- Garis pemisah
- Info rows (setiap row: icon kiri + label + value kanan):
  - 📱 No. HP: 081234567890
  - 🪪 No. KTP: 3201234567890001
  - ✉️ Email: budi@email.com
  - 📍 Alamat: Jl. Merdeka No. 10, Bandung
  - 🔒 Jaminan: KTP Asli (disimpan)
  - 📅 Terdaftar: 15 Januari 2026
- Garis pemisah
- 2 stat: "Total Sewa: 12 kali" | "Total Transaksi: Rp 3.650.000" (monospace, bold)
- Footer: tombol "Edit" (secondary) + tombol "Hapus" (ghost merah)

KOLOM KANAN (65%) — Riwayat:
- 3 tabs: "Riwayat Sewa" (active) | "Sewa Aktif (2)" | "Denda (1)"

Tab "Riwayat Sewa" aktif — tampilkan tabel:
- Kolom: ID Transaksi, Tanggal, Barang, Durasi, Total, Status
- Status badge: "Selesai" hijau, "Dikembalikan" biru, "Terlambat" merah
- 6 baris data contoh
- Pagination

Di samping tab "Sewa Aktif" ada badge "2" biru dan "Denda" ada badge "1" merah, menandakan ada item yang perlu perhatian.

Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen C1 — Inventaris Daftar Barang

```
Buatkan halaman Inventaris Barang untuk admin gudang BotaniRent.

Layout: Standard dengan sidebar (menu Gudang section active) + top bar.

Konten:
- Header row: "Inventaris Barang" (H2, kiri) + tombol "Bulk Upload" (secondary, icon upload) + tombol "Tambah Barang" (primary hijau, icon +) di kanan
- Filter bar:
  - Search input "Cari nama barang atau barcode..."
  - Category pills: "Semua (156)", "Sewa (48)", "Retail Home Industry (62)", "Retail Reseller (46)" — angka di dalam badge
  - Status dropdown: "Semua Status"
  - Toggle view: icon grid / icon table (table active)
- Tabel data:
  - Header row: background #F0E8D8, font uppercase 12px, #7A7062
  - Kolom: checkbox, Foto (40x40 thumbnail bulat), Nama Barang, Kategori (badge pill), Barcode, Stok Total, Stok Tersedia, Harga, Status (badge), Aksi (icon edit + delete)
  - Tampilkan 8 baris contoh data barang outdoor (tenda, sleeping bag, carrier, kompor, dll)
  - Kategori badge: "Sewa" (pill hijau), "Retail HI" (pill amber), "Retail Reseller" (pill terracotta)
  - Status badge: "Aktif" (pill hijau), "Nonaktif" (pill abu)
  - Row hover: background #FAF6F0
- Pagination di bawah: "Menampilkan 1-20 dari 156 barang" + nomor halaman

Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen C2 — Form Tambah Barang

```
Buatkan modal/form Tambah Barang Baru untuk inventaris BotaniRent.

Modal besar (860px lebar), overlay gelap blur.

Layout 2 kolom di dalam modal:
KIRI (40%):
- Area upload foto: kotak dashed border 200x200px, icon kamera, teks "Upload Foto Produk", subtitle "Drag & drop atau klik untuk browse"
- Di bawah: field "Barcode" (text input) + tombol kecil "Generate"

KANAN (60%):
- Field "Nama Barang" (text input, required asterisk)
- Field "Kategori" (dropdown: "Barang Sewa", "Retail Home Industry", "Retail Reseller")
- Field "Deskripsi" (textarea, 3 baris)
- Field "Harga Sewa per Hari" (number input, prefix "Rp", monospace)
- Field "Harga Jual" (number input, prefix "Rp", monospace)
- Field "Stok Total" (number input)
- Field "Status" (toggle switch: Aktif/Nonaktif, default aktif)

Header modal: "Tambah Barang Baru" + tombol X close
Footer: tombol "Batal" (secondary) + tombol "Simpan Barang" (primary)

Semua label: Inter 13px, medium weight, warna #2C2418. Input: border #D6CBBB, focus border #6B8F4E.
Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen C4+C5 — Paket Bundling

```
Buatkan halaman Buat Paket Bundling Sewa baru untuk BotaniRent.

Layout: Full page dengan sidebar + top bar.

Konten (2 kolom):
KIRI (40%):
- Area upload foto paket (dashed border box)
- Field "Nama Paket": value "Paket Gunung Premium"
- Field "Deskripsi": textarea
- Field "Harga Paket": input "Rp 200.000" (monospace)
- Info perbandingan: card kecil:
  - "Total harga satuan: Rp 275.000" (strikethrough)
  - "Harga paket: Rp 200.000" (hijau, bold)
  - Badge "Hemat 27%" (warna amber)

KANAN (60%):
- Header: "Pilih Barang dalam Paket"
- Search input: "Cari barang..."
- Section "Barang Tersedia" (scrollable list):
  - Setiap item: thumbnail kecil + nama + harga + tombol "+ Tambah" (small, outline)
  - Contoh: Tenda Dome 4P, Sleeping Bag, Matras, Kompor Portable, dll
- Divider
- Section "Barang dalam Paket" (selected items):
  - Setiap item: thumbnail + nama + qty stepper [-][1][+] + tombol hapus (X merah)
  - Contoh 4 barang sudah dipilih
  - Subtotal per item ditampilkan

Footer page: tombol "Batal" (secondary) + tombol "Simpan Paket" (primary)

Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen C6 — Manajemen Status Aset (Kanban)

```
Buatkan halaman Manajemen Status Aset Sewa dengan tampilan Kanban Board untuk BotaniRent.

Layout: Standard dengan sidebar + top bar.

Konten:
- Header: "Status Aset Sewa" — H2 + toggle view "Kanban" (active) / "Tabel"
- Filter: Search input + category pills

Kanban Board (4 kolom horizontal, scrollable):

Kolom 1 — "Ready ✅" (header hijau #4A7C3F, badge count "12"):
- Cards: setiap card berisi thumbnail kecil, nama aset, waktu terakhir diupdate
- Contoh: "Tenda Dome 4P", "Carrier 60L", "Sleeping Bag" — 4 cards

Kolom 2 — "Disewa 📋" (header biru #3B82B0, badge "8"):
- Cards dengan tambahan info: nama penyewa, tanggal kembali
- Contoh: "Kompor Portable - Budi (kembali 15 Jun)" — 3 cards

Kolom 3 — "Maintenance 🔧" (header amber #E8A820, badge "3"):
- Cards dengan catatan: "Perlu ganti tiang"
- Contoh: 2 cards

Kolom 4 — "Dicuci 🧹" (header #7A7062, badge "5"):
- Cards: 3 cards

Setiap card: background putih, border 1px #E8DFC8, border-radius 8px, shadow kecil.
Antar kolom ada visual hint drag-and-drop (dashed border area di bawah cards).
Background keseluruhan: #FAF6F0.

Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen D1 — Dashboard Owner

```
Buatkan halaman Dashboard Laporan Terpusat untuk Owner BotaniRent.

Layout: Standard dengan sidebar (section Owner, Dashboard active) + top bar.

Konten:

WELCOME BANNER (full width):
- Gradient background: dari #2D5016 ke #6B8F4E (kiri ke kanan)
- Teks putih: "Selamat siang, Pak Andi 👋" (H3) + "Berikut ringkasan performa toko Anda hari ini"
- Kanan: dropdown cabang "Semua Cabang" + date range "Mei 2026"
- Border-radius 12px

KPI CARDS ROW (4 cards, 1 baris):
Setiap card: background putih, border-radius 8px, padding 20px, shadow kecil.
1. Icon dollar dalam lingkaran hijau + "Omzet Hari Ini" (label abu) + "Rp 12.500.000" (H2, monospace, bold) + "↑ 15% dari kemarin" (hijau kecil)
2. Icon receipt dalam lingkaran amber + "Total Transaksi" + "47" + "↑ 8%"
3. Icon package dalam lingkaran biru + "Barang Disewakan" + "32" + "↓ 3%" (merah)
4. Icon alert-triangle dalam lingkaran merah + "Denda Terkumpul" + "Rp 750.000" + "↑ 22%"

CHARTS ROW (2 chart, 1 baris):
- Kiri (60%): Line chart "Revenue 30 Hari Terakhir"
  - 3 garis warna berbeda (hijau, amber, terracotta) untuk 3 cabang
  - X-axis tanggal, Y-axis Rupiah
  - Background putih, border-radius 8px
- Kanan (40%): Donut chart "Revenue per Cabang"
  - 3 segment: "Bandung 45%" (hijau), "Jakarta 35%" (amber), "Bogor 20%" (terracotta)
  - Legend di bawah donut

BOTTOM ROW (2 section):
- Kiri (50%): "Transaksi Terbaru" — mini table 5 baris (ID, waktu, total, status badge) + link "Lihat Semua →"
- Kanan (50%): "Barang Paling Populer" — ranked list dengan horizontal progress bar (5 item, hijau gradasi)

Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen D3 — Manajemen Cabang

```
Buatkan halaman Manajemen Cabang untuk Owner BotaniRent.

Layout: Standard dengan sidebar + top bar.

Konten:
- Header: "Manajemen Cabang" (H2) + tombol "Tambah Cabang" (primary, icon +)
- Grid cards 2 kolom:

Card 1 (Aktif):
- Border-left: 4px solid #2D5016
- Header: "Cabang Bandung" (H3) + badge "Aktif" (pill hijau)
- Body: Alamat (icon pin) "Jl. Raya Lembang No. 45, Bandung", Telepon "022-1234567", "3 kasir aktif", "156 barang", "Dibuat: Jan 2025"
- Footer: tombol "Edit" + tombol "Nonaktifkan" (ghost merah)

Card 2 (Aktif):
- "Cabang Jakarta" + badge "Aktif" (hijau)
- Data serupa tapi berbeda

Card 3 (Nonaktif):
- Border-left: 4px solid #D6CBBB (abu)
- "Cabang Bogor" + badge "Nonaktif" (pill abu)
- Slightly muted/faded appearance

Setiap card: background putih, border-radius 8px, shadow kecil, padding 24px.
Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen D4 — Pengaturan Denda Dinamis

```
Buatkan halaman Pengaturan Denda Dinamis untuk Owner BotaniRent.

Layout: Standard dengan sidebar + top bar.

Konten:
- Header: "Pengaturan Denda"
- Info banner (background #3B82B01A, icon info biru, border-radius 8px):
  "Aturan denda yang Anda tetapkan di sini akan berlaku untuk semua cabang secara otomatis."

Cards grid (2 kolom):

Card 1: "Denda Keterlambatan"
- Icon jam dalam lingkaran amber
- Setting: "Rp 15.000 / hari" — besar, monospace, bold
- Subtitle: "Dihitung otomatis per hari keterlambatan"
- Tombol edit (icon pensil) di kanan atas

Card 2: "Denda Kerusakan Ringan"
- Icon warning triangle amber
- "Rp 50.000 (flat)" — monospace
- "Biaya tetap per item yang mengalami kerusakan ringan"

Card 3: "Denda Kerusakan Berat"
- Icon x-circle merah
- "25% dari harga sewa" — monospace
- "Persentase dari total harga sewa item"

Card 4: "Denda Kehilangan"
- Icon alert-octagon merah
- "100% dari harga barang" — monospace
- "Penggantian penuh sesuai harga barang"

Di bawah cards: tombol "+ Tambah Aturan Denda" (secondary, dashed border)

Setiap card: putih, border-radius 8px, border 1px #E8DFC8, shadow kecil.
Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen D5 — Log Aktivitas

```
Buatkan halaman Log Aktivitas untuk Owner BotaniRent.

Layout: Standard dengan sidebar + top bar.

Konten:
- Header: "Log Aktivitas"
- Filter bar: Date range picker + dropdown "Semua Cabang" + dropdown "Semua Kasir" + dropdown "Semua Aksi" + search input

Timeline view (vertikal):
- Garis vertikal tipis di kiri (2px, #E8DFC8)
- Setiap entry:
  - Dot pada timeline (warna sesuai tipe aksi)
  - Timestamp: "14:32 — 21 Mei 2026" (caption, monospace)
  - Avatar kecil + "Ahmad" + badge cabang "Cabang Bandung" (pill kecil)
  - Deskripsi aksi: "Membuat transaksi baru #TRX-2026-0042 — Total Rp 325.000"
  - Icon expand (chevron) untuk lihat detail

Tampilkan 6-8 entries contoh dengan berbagai tipe:
- Transaksi baru (dot hijau)
- Pengembalian barang (dot biru)
- Update stok (dot amber)
- Denda dikenakan (dot merah)

Pagination di bawah.
Palette Alpine Earth. Resolusi: 1440x900px
```

---

## Screen E3 — 404 Error Page

```
Buatkan halaman 404 Not Found untuk BotaniRent.

Layout: Full page centered, tanpa sidebar.
Background: Warm Cream #FAF6F0.

Konten (centered, max-width 480px):
- Ilustrasi: gambar pendaki yang tersesat di gunung dengan kabut, style line art minimalis, warna earthy (hijau, amber, coklat) — BUKAN kartun lucu
- Angka "404" — font 120px, bold, warna #D6CBBB (sangat muted)
- "Halaman Tidak Ditemukan" — H2, Outfit, bold, #2C2418
- "Sepertinya Anda tersesat di gunung. Halaman yang Anda cari tidak ada atau Anda tidak memiliki akses." — Body, #7A7062, text-align center
- Tombol "Kembali ke Beranda" (primary hijau, icon home)
- Link "← Halaman sebelumnya" (ghost, #6B8F4E)

Palette Alpine Earth. Resolusi: 1440x900px
```

---

## 💡 Tips Penggunaan di Stitch

> [!IMPORTANT]
>
> 1. **Paste System Prompt terlebih dahulu** sebelum generate screen apapun agar Stitch memahami design system secara global.
> 2. **Generate satu screen per prompt** untuk hasil terbaik.
> 3. Jika hasilnya tidak presisi, tambahkan detail spesifik seperti "warna tombol harus tepat #2D5016, bukan hijau lain".
> 4. Untuk screen yang saling terkait (misal POS + modal), generate screen utama dulu, lalu modal-modalnya sambil attach screenshot screen utama sebagai konteks.
> 5. Urutan generate yang disarankan: **Login → POS Main → Modal POS → Dashboard Owner → Inventaris → sisanya**.
