# 🎨 Layer 2: Komponen UI & Utilitas Helper

Layer 2 berfokus pada penyajian antarmuka pengguna (User Interface) dan fungsi-fungsi pembantu (utility helpers) yang mempercepat proses render halaman serta menjaga konsistensi visual di seluruh aplikasi.

---

## 📁 Struktur Layer 2

```
src/lib/
├── components/
│   ├── layout/
│   │   ├── Sidebar.svelte       ← Navigasi utama aplikasi
│   │   └── TopBar.svelte        ← Header halaman & dropdown pemindahan cabang
│   └── ui/
│       ├── Button.svelte        ← Komponen tombol reusable (primary, secondary, danger)
│       ├── Card.svelte          ← Komponen penampung konten (box styling)
│       ├── Modal.svelte         ← Komponen popup dialog interaktif
│       ├── Input.svelte         ← Input text terstandarisasi
│       ├── Select.svelte        ← Dropdown select terstandarisasi
│       └── Badge.svelte         ← Status indicator (ready, rented, unpaid, dll)
└── utils/
    ├── format.js                ← Formatting angka (Rupiah), tanggal, & waktu
    ├── image.js                 ← Helper upload berkas gambar ke Supabase Storage
    └── mobileBridge.js          ← Komunikasi interaktif dengan aplikasi mobile wrapper
```

---

## 🎨 1. Komponen UI Reusable (`src/lib/components/ui/`)

Komponen UI dirancang dengan pola **Reusable Component** (Komponen yang dapat digunakan kembali). Tujuannya adalah untuk menghindari penulisan kode CSS yang berulang dan menjaga agar desain tombol, input, dan modal di semua halaman terlihat seragam.

### A. Button.svelte (Tombol Reusable)
*   **Fungsi:** Menyediakan tombol standar dengan variasi warna (Primary, Secondary, Outline, Danger), ukuran (Small, Medium, Large), serta status loading spinner.
*   **Konsep Svelte 5:** Menggunakan **runes** (`$props()`) untuk menerima properti eksternal seperti `type`, `variant`, `disabled`, dan event `onclick`.

### B. Card.svelte (Konten Container)
*   **Fungsi:** Wadah bergaya kotak moderen (shadow halus, border tipis, latar belakang putih/glassmorphic) untuk membungkus statistik, tabel, atau form input.

### C. Modal.svelte (Dialog Pop-up)
*   **Fungsi:** Menampilkan pop-up dialog di atas halaman aktif (misalnya konfirmasi pembayaran, detail denda, atau form undang staff baru).
*   **Aksesibilitas:** Menangani event penutupan saat tombol `Escape` ditekan atau area luar modal diklik.

### D. Input.svelte & Select.svelte
*   **Fungsi:** Form input yang memiliki label, placeholder, dan styling error border yang terintegrasi secara otomatis saat validasi form gagal.

### E. Badge.svelte
*   **Fungsi:** Label berwarna kecil untuk menunjukkan status entitas secara visual (hijau untuk `ready` / `paid`, kuning untuk `rented` / `pending`, merah untuk `broken` / `unpaid`).

---

## 🖥️ 2. Komponen Layout (`src/lib/components/layout/`)

Layout adalah kerangka aplikasi utama yang membungkus semua halaman dalam grup `(app)`.

### A. Sidebar.svelte
*   **Fungsi:** Menu navigasi utama di sebelah kiri layar.
*   **Fitur Notifikasi:** Membaca jumlah denda tertunda (`unpaidDendaCount`) dari server layout dan menampilkannya sebagai badge lingkaran merah kecil di samping menu "Denda" sebagai notifikasi bagi kasir.
*   **Otorisasi Role:** Sidebar secara dinamis menyembunyikan menu yang tidak boleh diakses oleh kasir/staf gudang (seperti menu "Log Aktivitas" dan "Statistik" yang hanya muncul jika role user adalah `owner`).

### B. TopBar.svelte
*   **Fungsi:** Header di bagian atas layar untuk menampilkan profil user aktif, status cabang saat ini, dan tombol logout.
*   **Switch Cabang (Owner Only):** Menampilkan dropdown pilihan cabang toko hanya untuk pengguna ber-role `owner`. Jika diubah, TopBar akan memicu request POST ke `/api/change-branch` untuk memperbarui scope data owner di server.

---

## 🔧 3. Utilitas Helper (`src/lib/utils/`)

Fungsi pembantu non-UI yang digunakan oleh backend maupun frontend.

### A. format.js (Format Mata Uang & Waktu)
*   **formatRupiah(number):** Mengubah angka mentah (`45000`) menjadi string terformat (`Rp 45.000`). Penting untuk kenyamanan kasir dan kejelasan kwitansi.
*   **formatDate(date):** Memformat timestamp ISO database menjadi tanggal lokal Indonesia (`21 Juni 2026`).

### B. image.js (Supabase Storage Helper)
*   **Fungsi:** Mengambil file biner gambar dari input file HTML, mengompresnya (opsional), lalu mengunggahnya ke bucket Supabase Storage (`items-bucket`), dan mengembalikan URL publik gambar tersebut. Digunakan saat mengunggah foto alat outdoor baru atau memperbarui foto profil.

### C. mobileBridge.js (Web-to-App Bridge)
*   **Fungsi:** Menyediakan fungsi pengirim pesan (postMessage) untuk berkomunikasi dengan aplikasi mobile wrapper (hybrid wrapper) jika Botanirent dijalankan di dalam smartphone (misalnya memicu getaran perangkat, scan barcode kamera fisik, atau cetak struk via bluetooth).
