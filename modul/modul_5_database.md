# 🗄️ Layer 5: Database & Keamanan Data (Supabase/PostgreSQL)

Layer 5 adalah basis penyimpanan dan pertahanan data Botanirent. Seluruh integritas relasi tabel, RLS (Row Level Security), trigger otomatisasi, dan data awal dideklarasikan langsung di tingkat database PostgreSQL.

---

## 🗺️ Skema Relasi Tabel (Database Schema)

Database Botanirent menggunakan PostgreSQL dengan 11 tabel utama yang saling berelasi:

```
                  ┌──────────────┐          ┌───────────────┐
                  │   branches   │          │   profiles    │ (staf/owner)
                  └──────┬───────┘          └───────┬───────┘
                         │ 1                        │ 1
                         │                          │
         ┌───────────────┼───────────────┬──────────┼───────────────┐
         │ 1             │ 1             │ 1        │ 1             │ 1
  ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐┌──▼───┐    ┌──────▼───────┐
  │    items    │ │  packages   │ │  customers  ││ txs  │    │ activity_log │
  └──────┬──────┘ └──────┬──────┘ └─────────────┘└──┬───┘    └──────────────┘
         │ 1             │ 1                        │ 1
         │               │                          │
  ┌──────▼──────┐ ┌──────▼──────┐          ┌────────▼──────┐
  │rental_assets│ │package_items│          │  tx_items     │
  └──────┬──────┘ └─────────────┘          └────────┬──────┘
         │ 1                                        │ 1
         │                                          │
  ┌──────▼──────┐                          ┌────────▼──────┐
  │  bookings   │                          │   penalties   │
  └─────────────┘                          └───────────────┘
```

### Penjelasan Relasi & Fungsi Tabel:
1.  **branches**: Menyimpan daftar cabang toko. Menjadi root utama isolasi data.
2.  **profiles**: Menyimpan data staf (nama, role kasir/gudang/owner, dan branch_id tempat bekerja). Referensi asing ke tabel internal `auth.users` milik Supabase Auth.
3.  **categories**: Kategori item (sewa vs retail).
4.  **items**: Katalog utama alat outdoor (seperti tenda dome, kompor camp, sleeping bag) dan barang retail (seperti gas kaleng hi-cook, kaos kaki outdoor).
5.  **rental_assets**: Unit fisik individual dari item sewa. Satu item "Tenda Dome 4 Orang" bisa memiliki 5 baris unit fisik nyata dengan kode aset unik (TND-001-A, TND-001-B, dst).
6.  **packages & package_items**: Mengelola paket bundling hemat (misalnya paket kemping keluarga).
7.  **customers**: Menyimpan identitas pelanggan penyewa alat.
8.  **transactions & transaction_items**: Nota transaksi header dan detail item sewa/retail yang keluar.
9.  **bookings**: Memblokir kalender unit aset yang disewa per tanggal tertentu untuk mencegah penyewaan ganda (double-booking).
10. **penalty_rules & penalties**: Aturan tarif denda (denda telat per hari, denda barang sobek/hilang) dan pencatatan tagihan denda riil milik pelanggan.
11. **activity_logs**: Pencatatan riwayat audit tindakan staf untuk dipantau oleh Owner.

---

## ⚡ 2. Stored Functions & Triggers (Otomatisasi DB)

Kita memindahkan beberapa logika sederhana ke dalam database agar berjalan secara otomatis sesaat setelah database dimodifikasi:

*   **Fungsi `handle_new_user()` & Trigger `on_auth_user_created`**:
    Dijalankan secara otomatis sesaat setelah ada akun baru mendaftar di Supabase Auth (`auth.users`). Trigger ini menduplikasi data user ke tabel profil publik (`public.profiles`) agar user bisa ditetapkan role & cabang kerjanya.
*   **Fungsi `handle_updated_at()` & Trigger `set_updated_at`**:
    Menulis ulang kolom `updated_at` dengan waktu presisi saat ini (`now()`) secara otomatis setiap kali kasir mengedit data (misal: mengupdate alamat pelanggan atau mengganti status alat).

---

## 🔐 3. Row Level Security (RLS) & Policies

Untuk mencegah kasir dari Cabang Bogor melihat atau mengedit transaksi dari Cabang Jakarta, database mengaktifkan fitur **Row Level Security (RLS)**.

### Helper Functions Keamanan:
*   **`user_branch_id()`**: Mengambil ID Cabang dari profil user yang sedang login via token JWT (`auth.uid()`).
*   **`user_role()`**: Mengambil peran (kasir/gudang/owner) user yang sedang login.

### Contoh Penerapan Aturan RLS:
Pada tabel `transactions`, RLS membatasi akses query dengan formula:
```sql
create policy "transactions_select" on public.transactions
  for select using (
    public.user_role() = 'owner' -- Owner boleh melihat semua transaksi global
    or branch_id = public.user_branch_id() -- Kasir hanya boleh melihat transaksi cabang tempat ia ditugaskan
  );
```

---

## 🧪 4. Migrations & Seed Data Pipeline

*   **Migrations (`supabase/migrations/`)**: Berisi file-file `.sql` berurutan yang mencatat riwayat perubahan skema database secara historis untuk memudahkan sinkronisasi antar server developer di tim.
*   **Seed Data (`supabase/seed.sql`)**: Berisi data dummy/simulasi standar (Bogor/Jakarta branches, tenda dome sewa, gas kaleng retail, unit aset A/B/C/D/E) yang di-insert langsung saat database dideploy pertama kali untuk mempercepat pengujian.
