# Sequence Diagram — POS Checkout (Transaksi Penyewaan)

> Dibuat berdasarkan format UML Sequence Diagram sesuai [Materi Sequence Collaboration Diagram.pdf](file:///c:/Users/rexzy/botani-app/botanirent-web/Materi%20Sequence%20Collaboration%20Diagram.pdf)

---

## Komponen Diagram

| No | Stereotype | Nama | Keterangan |
|----|------------|------|------------|
| 1 | **Actor** | Kasir | Staff/Admin yang mengoperasikan POS |
| 2 | **«boundary»** | Halaman POS | Antarmuka UI ([+page.svelte](file:///c:/Users/rexzy/botani-app/botanirent-web/src/routes/(app)/pos/+page.svelte)) |
| 3 | **«controller»** | POS Controller | Logic bisnis checkout ([posController.js](file:///c:/Users/rexzy/botani-app/botanirent-web/src/lib/server/controllers/posController.js)) |
| 4 | **«entity»** | Database | Supabase PostgreSQL (tabel: transactions, transaction_items, customers, bookings) |
| 5 | **«boundary»** | Midtrans API | Sistem pembayaran QRIS eksternal |

---

## Diagram 1: Load Halaman POS

```mermaid
sequenceDiagram
    actor Kasir
    participant UI as «boundary»<br/>Halaman POS
    participant Ctrl as «controller»<br/>POS Controller
    participant DB as «entity»<br/>Database

    Note over Kasir, DB: interaction Load Halaman POS

    Kasir->>UI: 1 : buka halaman POS
    UI->>Ctrl: 2 : load(request)
    Ctrl->>Ctrl: 3 : validasi session
    
    alt [tidak terautentikasi]
        Ctrl-->>UI: 4 : redirect ke /login
        UI-->>Kasir: 5 : tampilkan halaman login
    end

    Ctrl->>DB: 6 : getCategories()
    DB-->>Ctrl: 7 : return data kategori
    Ctrl->>DB: 8 : getActiveItems(branch_id)
    DB-->>Ctrl: 9 : return data barang
    Ctrl->>DB: 10 : getActivePackages(branch_id)
    DB-->>Ctrl: 11 : return data paket
    Ctrl->>DB: 12 : getCustomersMinimal(branch_id)
    DB-->>Ctrl: 13 : return data pelanggan
    Ctrl-->>UI: 14 : return tampilan data POS
    UI-->>Kasir: 15 : tampilkan katalog barang dan keranjang
```

---

## Diagram 2: Proses Checkout (Pembayaran Tunai/Transfer)

```mermaid
sequenceDiagram
    actor Kasir
    participant UI as «boundary»<br/>Halaman POS
    participant Ctrl as «controller»<br/>POS Controller
    participant DB as «entity»<br/>Database

    Note over Kasir, DB: interaction Checkout Tunai/Transfer

    Kasir->>UI: 1 : pilih barang dan tambah ke keranjang
    Kasir->>UI: 2 : atur jumlah, tanggal sewa, durasi
    Kasir->>UI: 3 : pilih / input pelanggan baru
    Kasir->>UI: 4 : pilih metode bayar (Tunai/Transfer)
    UI->>UI: 5 : hitung total amount
    Kasir->>UI: 6 : input nominal pembayaran
    Kasir->>UI: 7 : klik tombol Checkout
    UI->>Ctrl: 8 : checkout(payload)
    Ctrl->>Ctrl: 9 : parse JSON payload
    Ctrl->>Ctrl: 10 : generate transaction_code

    alt [pelanggan baru]
        Ctrl->>DB: 11 : createCustomer(name, phone)
        DB-->>Ctrl: 12 : return customer_id baru
    end

    Ctrl->>Ctrl: 13 : validasi paid_amount >= total_amount

    alt [pembayaran kurang]
        Ctrl-->>UI: 14 : return error "Nominal tidak mencukupi"
        UI-->>Kasir: 15 : tampilkan pesan error
    end

    Ctrl->>DB: 16 : RPC checkout_transaction(payload)
    Note right of DB: Stored Procedure:<br/>INSERT transactions,<br/>INSERT transaction_items,<br/>INSERT bookings,<br/>UPDATE rental_assets
    DB-->>Ctrl: 17 : return transaction_id
    Ctrl->>DB: 18 : logActivity("transaction_completed")
    DB-->>Ctrl: 19 : return success
    Ctrl-->>UI: 20 : return redirect /transactions/{id}
    UI-->>Kasir: 21 : tampilkan halaman struk transaksi
```

---

## Diagram 3: Proses Checkout (Pembayaran QRIS via Midtrans)

```mermaid
sequenceDiagram
    actor Kasir
    participant UI as «boundary»<br/>Halaman POS
    participant Ctrl as «controller»<br/>POS Controller
    participant DB as «entity»<br/>Database
    participant MT as «boundary»<br/>Midtrans API

    Note over Kasir, MT: interaction Checkout QRIS

    Kasir->>UI: 1 : pilih barang dan tambah ke keranjang
    Kasir->>UI: 2 : atur jumlah, tanggal sewa, durasi
    Kasir->>UI: 3 : pilih / input pelanggan
    Kasir->>UI: 4 : pilih metode bayar (QRIS)
    Kasir->>UI: 5 : klik tombol Checkout
    UI->>Ctrl: 6 : checkout(payload)
    Ctrl->>Ctrl: 7 : parse payload, generate transaction_code
    Ctrl->>Ctrl: 8 : set payment_status = "pending"

    alt [pelanggan baru]
        Ctrl->>DB: 9 : createCustomer(name, phone)
        DB-->>Ctrl: 10 : return customer_id baru
    end

    Ctrl->>DB: 11 : RPC checkout_transaction(payload)
    DB-->>Ctrl: 12 : return transaction_id
    Ctrl->>DB: 13 : logActivity("transaction_completed")
    DB-->>Ctrl: 14 : return success

    Ctrl->>MT: 15 : POST /v2/charge (order_id, gross_amount)

    alt [Midtrans berhasil]
        MT-->>Ctrl: 16 : return qr_string, qr_url
        Ctrl->>DB: 17 : updateTransaction(midtrans_id, qr_data)
        DB-->>Ctrl: 18 : return success
        Ctrl-->>UI: 19 : return qr_string, qr_url
        UI-->>Kasir: 20 : tampilkan QR Code QRIS
        Note over Kasir, MT: Pelanggan scan QR Code untuk membayar
        MT->>DB: 21 : webhook notification (async)
        Note right of DB: UPDATE transactions<br/>SET payment_status = 'paid'
    else [Midtrans gagal]
        MT-->>Ctrl: 16 : return error
        Ctrl-->>UI: 17 : return error "Gagal inisiasi QRIS"
        UI-->>Kasir: 18 : tampilkan pesan error
    end
```

---

## Keterangan Notasi

Berdasarkan materi ADSI 2025:

| Notasi | Deskripsi |
|--------|-----------|
| **→** (panah solid / filled arrowhead) | **Synchronous message** — pengirim menunggu pesan ditangani sebelum melanjutkan (pemanggilan method) |
| **-->>** (panah putus-putus / dashed) | **Return message** — penerima selesai memproses dan mengembalikan kendali ke pemanggil |
| **→ ke diri sendiri** (self-loop) | **Message to Self** — objek memproses sesuatu secara internal |
| **alt [kondisi]** | **Fragment alternatif** — skenario bercabang berdasarkan kondisi |
| **«boundary»** | Antarmuka/UI yang berinteraksi dengan actor |
| **«controller»** | Logic sistem yang memproses bisnis |
| **«entity»** | Objek data / database |

---

## Deskripsi Message

### Diagram 1 — Load Halaman POS
| No | Message | Tipe |
|----|---------|------|
| 1 | buka halaman POS | Synchronous |
| 2 | load(request) | Synchronous |
| 3 | validasi session | Message to Self |
| 4–5 | redirect ke /login | Return (alt) |
| 6–13 | query data kategori, barang, paket, pelanggan | Synchronous + Return |
| 14 | return tampilan data POS | Return |
| 15 | tampilkan katalog barang dan keranjang | Return |

### Diagram 2 — Checkout Tunai/Transfer
| No | Message | Tipe |
|----|---------|------|
| 1–7 | interaksi kasir dengan UI | Synchronous |
| 5 | hitung total amount | Message to Self |
| 8 | checkout(payload) | Synchronous |
| 9–10 | parse + generate code | Message to Self |
| 11–12 | createCustomer | Synchronous + Return (alt) |
| 13 | validasi pembayaran | Message to Self |
| 14–15 | error pembayaran kurang | Return (alt) |
| 16–17 | RPC checkout_transaction | Synchronous + Return |
| 18–19 | logActivity | Synchronous + Return |
| 20–21 | redirect ke struk | Return |

### Diagram 3 — Checkout QRIS
| No | Message | Tipe |
|----|---------|------|
| 1–5 | interaksi kasir dengan UI | Synchronous |
| 6 | checkout(payload) | Synchronous |
| 7–8 | parse + set pending | Message to Self |
| 9–10 | createCustomer | Synchronous + Return (alt) |
| 11–14 | simpan transaksi + log | Synchronous + Return |
| 15 | POST /v2/charge ke Midtrans | Synchronous |
| 16–20 | return QR Code (sukses) | Return |
| 21 | webhook notification | **Asynchronous** |
| 16–18 | return error (gagal) | Return (alt) |

---

## File Source Code yang Terlibat

| Layer | File |
|---|---|
| **Boundary (UI)** | [+page.svelte](file:///c:/Users/rexzy/botani-app/botanirent-web/src/routes/(app)/pos/+page.svelte) |
| **Controller (Server)** | [+page.server.js](file:///c:/Users/rexzy/botani-app/botanirent-web/src/routes/(app)/pos/+page.server.js) → [posController.js](file:///c:/Users/rexzy/botani-app/botanirent-web/src/lib/server/controllers/posController.js) |
| **Entity (Model)** | [transactionModel.js](file:///c:/Users/rexzy/botani-app/botanirent-web/src/lib/server/models/transactionModel.js), [customerModel.js](file:///c:/Users/rexzy/botani-app/botanirent-web/src/lib/server/models/customerModel.js) |
| **Database** | Supabase PostgreSQL — RPC: `checkout_transaction` |
| **External** | [Midtrans API](file:///c:/Users/rexzy/botani-app/botanirent-web/src/routes/api/midtrans) — Payment Gateway QRIS |
