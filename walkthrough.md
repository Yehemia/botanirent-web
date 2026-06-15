# Walkthrough: E2E Automation Testing BotaniRent

Kami telah mengimplementasikan sistem pengujian otomatis end-to-end (E2E) menggunakan **Playwright** untuk memastikan seluruh alur bisnis utama pada aplikasi **BotaniRent** berjalan dengan benar sebelum proses build dilakukan.

Semua pengujian telah berhasil dijalankan secara lokal dan aplikasi dapat dibangun (`npm run build`) dengan sukses setelah melalui validasi.

---

## 🛠️ Ringkasan Implementasi

### 1. Konfigurasi Lingkungan (`playwright.config.js` & `package.json`)
* **`playwright.config.js`**:
  * Menggunakan alamat IP IPv4 `127.0.0.1` (bukan `localhost`) untuk menghindari jeda/kegagalan resolusi IPv6 pada sistem Windows.
  * Menyesuaikan parameter `timeout` pengujian menjadi **90 detik** (`90 * 1000` ms) guna menoleransi latensi jaringan dan pemrosesan database Supabase.
  * Konfigurasi server lokal otomatis (`webServer`) yang menjalankan `npm run dev -- --host 127.0.0.1` sebelum pengujian dimulai.
* **`package.json`**:
  * Menambahkan dependensi `@playwright/test` dan `dotenv`.
  * Menambahkan perintah penunjang:
    * `npm run test:setup`: Menyiapkan akun pengujian.
    * `npm run test:cleanup`: Membersihkan sisa transaksi/data pengujian.
    * `npm run test:e2e`: Menjalankan alur lengkap (setup -> tests -> cleanup).
    * `npm run test:e2e:ui`: Menjalankan test suite dengan Playwright UI mode.
    * `npm run prebuild`: Memastikan type-check (`svelte-check`) dan seluruh E2E tests lulus sebelum kompilasi build dilanjutkan.

### 2. Utilitas & Otomatisasi Database (`tests/`)
* **`tests/setup-test-db.js`**:
  * Otomatis membuat atau mereset kata sandi 3 akun pengujian utama (`test_owner@botanirent.com`, `test_kasir@botanirent.com`, `test_gudang@botanirent.com`) menjadi `PasswordTest123!` dan memetakan hak akses (role) masing-masing melalui Supabase Admin API.
* **`tests/cleanup-test-db.js`**:
  * Menghapus transaksi dan pelanggan pengujian yang dibuat selama E2E berjalan.
  * Mereset status aset-aset Tenda Dome di cabang Bogor kembali ke status `ready`.
* **`tests/helpers/auth.js`**:
  * Fungsi penunjang reusable untuk menangani proses login dan logout secara dinamis di halaman web.

---

## 🧪 Skenario Pengujian yang Ditanggung

Berikut adalah detail skenario pengujian E2E yang telah dibuat:

1. **`tests/01-auth-rbac.spec.js` (Role-Based Access Control)**
   * Memastikan pengguna tanpa login diarahkan kembali ke `/login`.
   * Memastikan login dengan akun **Kasir** membatasi akses menu hanya untuk POS, Transaksi, Pengembalian, Denda, dan Pelanggan.
   * Memastikan login dengan akun **Gudang** membatasi akses hanya ke Kanban Status Aset.
   * Memastikan login dengan akun **Owner** memiliki akses penuh ke seluruh menu (Dashboard, Statistik, Inventaris, Paket, Staf, Cabang, dll.).

2. **`tests/02-pos-hybrid.spec.js` (Transaksi POS Hybrid)**
   * Menambahkan item sewa (rental) dan item jual (retail) secara bersamaan ke dalam keranjang belanja.
   * Mengatur durasi sewa, menentukan kuantitas barang, dan memilih pelanggan.
   * Melakukan checkout transaksi dan memvalidasi bahwa struk cetak / detail pembayaran berhasil digenerasikan dengan informasi yang valid.

3. **`tests/03-warehouse-status.spec.js` (Kanban Gudang & Status Aset)**
   * Masuk sebagai staf gudang dan membuka Kanban board status aset.
   * Memvalidasi transisi kartu aset dari satu kolom status ke kolom status lainnya (misal dari *Ready* ke *Maintenance*).

4. **`tests/04-returns-penalties.spec.js` (Pengembalian & Perhitungan Denda)**
   * Melakukan checkout barang sewa baru.
   * Membuka panel pengembalian, mengubah kondisi barang menjadi rusak/hilang, dan memvalidasi perhitungan biaya denda secara otomatis di UI.
   * Memproses checkout pengembalian dan memastikan status transaksi serta aset diperbarui dengan benar.

---

## 📈 Hasil Pengujian & Verifikasi Build

Semua 7 pengujian dari 4 file spesifikasi berhasil dijalankan berturut-turut dengan hasil **100% Lulus**:

```bash
Running 7 tests using 1 worker

  ok 1 [chromium] › tests\01-auth-rbac.spec.js:6:2 › should redirect unauthenticated users to login page (3.9s)
  ok 2 [chromium] › tests\01-auth-rbac.spec.js:11:2 › should login as Kasir and only see Kasir menus (7.4s)
  ok 3 [chromium] › tests\01-auth-rbac.spec.js:32:2 › should login as Gudang and only see Gudang menus (4.2s)
  ok 4 [chromium] › tests\01-auth-rbac.spec.js:51:2 › should login as Owner and only see Owner menus (5.4s)
  ok 5 [chromium] › tests\02-pos-hybrid.spec.js:6:2 › should successfully execute a hybrid rental & retail transaction (18.4s)
  ok 6 [chromium] › tests\03-warehouse-status.spec.js:6:2 › should display Kanban board and allow status transitions (4.6s)
  ok 7 [chromium] › tests\04-returns-penalties.spec.js:6:2 › should successfully process returns and calculate penalties (10.5s)

  7 passed (2.4m)
```

Proses build produksi via `npm run build` juga sukses dijalankan dan berjalan dengan mulus:
```bash
✓ built in 15.29s
> Using @sveltejs/adapter-vercel
✔ done
```

---

## 🚀 Cara Menjalankan Secara Mandiri

1. **Unduh Browser Playwright** (hanya perlu dijalankan sekali):
   ```bash
   npx playwright install
   ```

2. **Jalankan Uji Coba E2E (Console Mode)**:
   ```bash
   npm run test:e2e
   ```

3. **Jalankan Uji Coba E2E (UI Mode / Interaktif)**:
   ```bash
   npm run test:e2e:ui
   ```

4. **Jalankan Build Produksi (Otomatis melakukan E2E Test)**:
   ```bash
   npm run build
   ```
