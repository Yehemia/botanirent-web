# BotaniRent — Design Specification Document

> **Sistem Manajemen Rental & Retail Outdoor**
> Tema: "Alpine Earth" — Earthy, Warm, Natural
> Platform: Web Application (Desktop & Tablet optimized)
> Framework: SvelteKit + Supabase

---

## 1. Design System

### 1.1 Color Palette — "Alpine Earth"

```
Primary Colors:
- Forest Green (Primary)        : #2D5016
- Sage Green (Primary Light)    : #6B8F4E
- Sage Green 10% opacity        : #6B8F4E1A  (untuk hover/subtle bg)
- Sage Green 20% opacity        : #6B8F4E33  (untuk selected state)

Secondary Colors:
- Warm Amber (Secondary)        : #D4A843
- Terracotta (Accent)           : #C85A3A

Background:
- Warm Cream (Light BG)         : #FAF6F0
- Deep Charcoal (Dark BG)       : #1A1A1A
- White                         : #FFFFFF
- Soft Sand (Surface/Card BG)   : #F0E8D8
- Light Sand (Hover Surface)    : #E8DFC8

Text:
- Dark Earth (Text Primary)     : #2C2418
- Stone Gray (Text Secondary)   : #7A7062
- Muted Brown (Text Disabled)   : #B0A696

Semantic:
- Olive Green (Success)         : #4A7C3F
- Success Light BG              : #4A7C3F1A
- Golden Amber (Warning)        : #E8A820
- Warning Light BG              : #E8A8201A
- Rust Red (Error/Danger)       : #C44032
- Error Light BG                : #C440321A
- Sky Blue (Info)               : #3B82B0
- Info Light BG                 : #3B82B01A

Border:
- Border Default                : #D6CBBB
- Border Light                  : #E8DFC8
- Border Focus                  : #6B8F4E
```

### 1.2 Typography

```
Font Family:
- Heading   : "Outfit", sans-serif (Google Fonts)
- Body      : "Inter", sans-serif (Google Fonts)
- Monospace : "JetBrains Mono", monospace (untuk harga & angka)

Font Sizes:
- Display   : 36px / 2.25rem  — line-height: 1.2
- H1        : 30px / 1.875rem — line-height: 1.3
- H2        : 24px / 1.5rem   — line-height: 1.3
- H3        : 20px / 1.25rem  — line-height: 1.4
- H4        : 18px / 1.125rem — line-height: 1.4
- Body LG   : 16px / 1rem     — line-height: 1.6
- Body      : 14px / 0.875rem — line-height: 1.6
- Body SM   : 13px / 0.8125rem— line-height: 1.5
- Caption   : 12px / 0.75rem  — line-height: 1.5
- Overline  : 11px / 0.6875rem— line-height: 1.5, letter-spacing: 0.08em, uppercase

Font Weights:
- Regular   : 400
- Medium    : 500
- Semibold  : 600
- Bold      : 700
```

### 1.3 Spacing Scale

```
4px  — xs
8px  — sm
12px — md
16px — base
20px — lg
24px — xl
32px — 2xl
40px — 3xl
48px — 4xl
64px — 5xl
```

### 1.4 Border Radius

```
- Small    : 6px   (buttons, input fields, badges)
- Medium   : 8px   (cards, dropdowns)
- Large    : 12px  (modals, panels)
- XLarge   : 16px  (large cards, hero sections)
- Full     : 9999px (pills, avatars, circular buttons)
```

### 1.5 Shadows

```
- Shadow SM   : 0 1px 3px rgba(44, 36, 24, 0.06), 0 1px 2px rgba(44, 36, 24, 0.04)
- Shadow MD   : 0 4px 6px rgba(44, 36, 24, 0.07), 0 2px 4px rgba(44, 36, 24, 0.04)
- Shadow LG   : 0 10px 15px rgba(44, 36, 24, 0.08), 0 4px 6px rgba(44, 36, 24, 0.04)
- Shadow XL   : 0 20px 25px rgba(44, 36, 24, 0.10), 0 8px 10px rgba(44, 36, 24, 0.04)
- Shadow Inner: inset 0 2px 4px rgba(44, 36, 24, 0.05)
```

### 1.6 Transitions & Animations

```
- Duration Fast    : 150ms
- Duration Normal  : 250ms
- Duration Slow    : 350ms
- Easing Default   : cubic-bezier(0.4, 0, 0.2, 1)
- Easing Bounce    : cubic-bezier(0.34, 1.56, 0.64, 1)

Micro-animations:
- Button press     : scale(0.97) on click, 150ms
- Card hover       : translateY(-2px) + shadow-lg, 250ms
- Modal open       : fadeIn + scale(0.95 → 1), 250ms
- Sidebar expand   : width transition 250ms
- Toast slide-in   : translateX(100% → 0), 350ms
- Skeleton loading : pulse opacity 0.4 ↔ 1, 1.5s infinite
```

---

## 2. Component Library

### 2.1 Buttons

**Primary Button:**
- Background: #2D5016 (Forest Green)
- Text: #FFFFFF, font-weight: 600, font-size: 14px
- Padding: 10px 20px
- Border-radius: 6px
- Hover: background #3A6A1E, translateY(-1px), shadow-md
- Active: background #244012, scale(0.97)
- Disabled: opacity 0.5, cursor not-allowed
- Icon support: 18px icon left/right with 8px gap

**Secondary Button:**
- Background: transparent
- Border: 1.5px solid #2D5016
- Text: #2D5016, font-weight: 600
- Hover: background #6B8F4E1A
- Active: background #6B8F4E33

**Danger Button:**
- Background: #C44032
- Text: #FFFFFF
- Hover: background #A83428

**Ghost Button:**
- Background: transparent
- Text: #7A7062
- Hover: background #F0E8D8

**Button Sizes:**
- Small  : padding 6px 12px, font-size 13px, height 32px
- Medium : padding 10px 20px, font-size 14px, height 40px
- Large  : padding 12px 28px, font-size 16px, height 48px

### 2.2 Input Fields

- Background: #FFFFFF
- Border: 1.5px solid #D6CBBB
- Border-radius: 6px
- Padding: 10px 14px
- Font-size: 14px, color: #2C2418
- Placeholder color: #B0A696
- Focus: border-color #6B8F4E, ring 3px #6B8F4E33
- Error: border-color #C44032, ring 3px #C440321A
- Label: font-size 13px, font-weight 500, color #2C2418, margin-bottom 6px
- Helper text: font-size 12px, color #7A7062
- Height: 40px (medium), 48px (large — for POS touch inputs)

### 2.3 Cards

- Background: #FFFFFF
- Border: 1px solid #E8DFC8
- Border-radius: 8px
- Padding: 20px
- Shadow: shadow-sm
- Hover (if interactive): shadow-md, translateY(-2px), border-color #D6CBBB

### 2.4 Badges / Status Pills

- Border-radius: 9999px (pill)
- Padding: 4px 12px
- Font-size: 12px, font-weight: 600

Variants:
- Success (Ready/Available): bg #4A7C3F1A, text #4A7C3F
- Warning (Maintenance): bg #E8A8201A, text #E8A820
- Error (Overdue/Rusak): bg #C440321A, text #C44032
- Info (Disewa/Booked): bg #3B82B01A, text #3B82B0
- Neutral (Inactive): bg #F0E8D8, text #7A7062
- Primary (Sewa): bg #6B8F4E1A, text #2D5016
- Secondary (Retail): bg #D4A8431A, text #D4A843

### 2.5 Modal / Dialog

- Overlay: rgba(44, 36, 24, 0.5), backdrop-filter: blur(4px)
- Container: bg #FFFFFF, border-radius 12px, shadow-xl
- Max-width: 480px (small), 640px (medium), 860px (large)
- Header: padding 24px 24px 0, font H3, font-weight 700
- Body: padding 16px 24px
- Footer: padding 0 24px 24px, flex row gap 12px, justify-end
- Close button: 32x32px, top-right, ghost style, icon X

### 2.6 Table

- Header row: bg #F0E8D8, font-size 12px, font-weight 600, text uppercase, letter-spacing 0.05em, color #7A7062
- Body row: bg #FFFFFF, border-bottom 1px solid #E8DFC8
- Row hover: bg #FAF6F0
- Cell padding: 12px 16px
- Font-size body: 14px
- Striped variant: alternate rows bg #FDFBF7

### 2.7 Sidebar Navigation

- Width collapsed: 72px
- Width expanded: 260px
- Background: #2D5016 (Forest Green)
- Text/Icons: #FFFFFF (opacity 0.7 default, 1.0 active)
- Active item: bg rgba(255,255,255,0.15), border-left 3px solid #D4A843, text opacity 1.0
- Hover item: bg rgba(255,255,255,0.08)
- Menu item padding: 12px 20px
- Menu item icon size: 20px
- Menu item font: 14px, font-weight 500
- Section divider: 1px solid rgba(255,255,255,0.1), margin 12px 16px
- Logo area: padding 20px, height 64px, logo + "BotaniRent" text in #D4A843

### 2.8 Top Bar / Header

- Height: 64px
- Background: #FFFFFF
- Border-bottom: 1px solid #E8DFC8
- Shadow: shadow-sm
- Content: flex row, space-between
- Left: Breadcrumb (font 14px, color #7A7062, active color #2C2418)
- Right: Branch selector dropdown, notification bell, user avatar (36px circle) + name + role badge

### 2.9 Toast / Notification

- Position: top-right, 24px from edges
- Min-width: 320px
- Border-radius: 8px
- Padding: 14px 18px
- Shadow: shadow-lg
- Left accent border: 4px solid (semantic color)
- Variants: success/warning/error/info
- Auto dismiss: 4 seconds
- Close button: top-right

### 2.10 Tabs

- Border-bottom: 2px solid #E8DFC8
- Tab item: padding 10px 20px, font-size 14px, font-weight 500
- Active tab: color #2D5016, border-bottom 2px solid #2D5016
- Inactive tab: color #7A7062
- Hover: color #2C2418

### 2.11 Dropdown / Select

- Trigger: same style as input field, with chevron-down icon right
- Dropdown panel: bg #FFFFFF, border 1px solid #D6CBBB, border-radius 8px, shadow-lg
- Option: padding 10px 14px, font 14px
- Option hover: bg #F0E8D8
- Option selected: bg #6B8F4E1A, color #2D5016, font-weight 500
- Max height: 280px, overflow-y scroll

### 2.12 Search Bar

- Same as Input Field but with:
- Left icon: search (magnifying glass), 18px, color #B0A696
- Padding-left: 40px (to accommodate icon)
- Clear button (X) right side when has value

### 2.13 Calendar Component (Booking)

- Grid: 7 columns (Mon–Sun)
- Day cell: 40x40px, border-radius 6px, font 14px
- Today: border 2px solid #2D5016
- Available: bg #FFFFFF, hover bg #6B8F4E1A
- Booked: bg #3B82B01A, text #3B82B0
- Maintenance: bg #E8A8201A, text #E8A820
- Selected range: bg #6B8F4E33, first/last bg #2D5016 text #FFFFFF
- Month nav: arrows left/right, month-year text H4

---

## 3. Screen Designs

---

### Screen A1: Login Page

**Layout:**
- Full viewport height, centered content
- Split layout: Left 55% — brand visual area, Right 45% — login form
- Left side: Full-height background image (outdoor mountain/forest scene with dark overlay 40%), logo "BotaniRent" large, tagline "Sistem Manajemen Rental & Retail Outdoor" in white text
- Right side: Warm Cream (#FAF6F0) background

**Right Panel Content (centered, max-width 380px):**
- Heading: "Selamat Datang" — H2, Outfit, Bold, color #2C2418
- Subtext: "Masuk ke akun BotaniRent Anda" — Body, color #7A7062
- Spacer 32px
- Label "Email" + Input field (email type, placeholder "nama@email.com")
- Spacer 16px
- Label "Password" + Input field (password type, with show/hide toggle icon)
- Spacer 12px
- Row: Checkbox "Ingat saya" (left) + Link "Lupa Password?" (right, color #6B8F4E, font 13px)
- Spacer 24px
- Primary Button "Masuk" — full width, large size
- Spacer 16px
- Divider line with text "atau"
- Spacer 16px
- Secondary Button "Masuk dengan Google" — full width, with Google icon

**Decorative Elements:**
- Subtle leaf/mountain pattern watermark on right panel (opacity 0.03)
- Logo mark (small) top-left of right panel

---

### Screen A2: Forgot Password

**Layout:**
- Same right-panel style as Login, but simpler
- Centered card (max-width 420px) on Warm Cream background

**Content:**
- Back arrow link "← Kembali ke Login"
- Icon: Mail icon in a 64px circle, bg #6B8F4E1A, icon color #2D5016
- Heading: "Reset Password" — H2
- Subtext: "Masukkan email Anda untuk menerima link reset password"
- Input field: Email
- Primary Button "Kirim Link Reset" — full width
- After sent state: Success message + illustration

---

### Screen B1: POS — Main View (Kasir)

> **Layout utama kasir. Fullscreen, no sidebar visible. Touch-friendly.**

**Layout:**
- No sidebar (POS mode is fullscreen)
- Top bar height: 56px, minimal — logo left, branch name center, user avatar + clock right
- Below top bar: split into 2 columns
  - **Left/Center (60-65%)**: Katalog Grid area
  - **Right (35-40%)**: Keranjang/Cart panel

**Top Bar POS:**
- Background: #2D5016
- Logo "BotaniRent" in #D4A843, left
- Center: Branch name badge (pill, bg rgba(255,255,255,0.15), text white)
- Right: Digital clock (monospace, white), user avatar 32px, hamburger menu icon

---

### Screen B2: POS — Katalog Grid (Left Panel)

**Layout (inside left area of POS):**
- Top section:
  - Search bar (large, height 48px, placeholder "Cari barang atau scan barcode...")
  - Below search: Category filter tabs/pills in horizontal scroll
    - "Semua", "⛺ Paket Sewa", "🎒 Sewa Satuan", "🏭 Retail Home Industry", "🏪 Retail Reseller"
    - Active pill: bg #2D5016, text white
    - Inactive pill: bg #F0E8D8, text #7A7062
- Below filters: Scrollable grid
  - Grid: 3-4 columns (responsive), gap 12px
  - Padding: 16px

**Product Card (in grid):**
- Size: ~180px wide, auto height
- Border-radius: 8px
- Background: #FFFFFF
- Border: 1px solid #E8DFC8
- Image area: top, aspect-ratio 1:1, object-fit cover, border-radius 8px 8px 0 0
- Body padding: 12px
- Product name: font 14px, font-weight 600, color #2C2418, max 2 lines ellipsis
- Category badge: small pill below name (e.g. "Sewa" green pill, "Retail" amber pill)
- Price: font 16px, font-weight 700, color #2D5016, font-family monospace
  - For sewa: "Rp 50.000/hari"
  - For retail: "Rp 25.000"
- Stock indicator: small text, "Stok: 12" in caption size, color #7A7062
- Hover: shadow-md, translateY(-2px), border-color #6B8F4E
- Active/pressed: scale(0.97), border-color #2D5016
- Out of stock: grayscale overlay, "Habis" badge overlay (red)

---

### Screen B3: POS — Keranjang/Cart (Right Panel)

**Layout (inside right area of POS):**
- Background: #FFFFFF
- Border-left: 1px solid #E8DFC8
- Full height (viewport - top bar)
- Flex column layout

**Header section:**
- Padding: 16px 20px
- Title: "Keranjang" — H4, with cart icon, and item count badge (pill, bg #C85A3A, text white, font 12px)
- **Customer selector (WAJIB untuk sewa):**
  - Clickable row: icon user + "Pilih Penyewa" (placeholder) or selected customer name
  - Background: #F0E8D8, border-radius 6px, padding 8px 12px
  - When selected: shows customer name + phone, with X button to change
  - Click opens search modal to find existing customer or add new

**Cart Items list (scrollable, flex-grow):**
- Padding: 0 20px
- Each cart item:
  - Row layout, padding 14px 0, border-bottom 1px solid #E8DFC8
  - Left: Small thumbnail 48x48px, border-radius 6px
  - Middle: 
    - Item name: font 14px, font-weight 500
    - Type badge: small pill ("Sewa" / "Retail")
    - If sewa: "12 Jun - 15 Jun (3 hari)" in caption, color #7A7062
  - Right column:
    - Quantity controls: [-] [number] [+] inline, buttons 28x28px
    - Subtotal: font 14px, font-weight 700, monospace, color #2D5016
    - Delete icon button (trash), ghost style, color #C44032 on hover
- Empty state: illustration + "Belum ada item" text

**Footer section (sticky bottom):**
- Border-top: 1px solid #D6CBBB
- Padding: 20px
- Background: #FFFFFF
- Rows:
  - Subtotal: label left (font 14px, #7A7062) — value right (font 14px, monospace)
  - Diskon: label left — value right (show if applied, color #C85A3A)
  - Horizontal divider
  - **Total**: label left (font 16px, font-weight 700) — value right (font 20px, font-weight 700, monospace, color #2D5016)
- Spacer 16px
- Row of 2 buttons:
  - Secondary Button: "Diskon" (with percent icon)
  - Primary Button: "Bayar" — flex-grow, large size, bg #2D5016
    - Shows total amount on button: "Bayar — Rp 350.000"

---

### Screen B4: POS — Detail Sewa (Modal)

> **Muncul saat item sewa ditambahkan ke cart. Untuk input tanggal sewa.**

**Modal (medium size, 500px):**
- Header: "Detail Penyewaan" + item name
- Body:
  - Item preview: image + name + price per day
  - Spacer 20px
  - Date picker row:
    - "Tanggal Mulai" — date input (large, 48px height, touch-friendly)
    - "Tanggal Kembali" — date input
  - Auto-calculated: "Durasi: **3 hari**" — highlight text
  - Auto-calculated: "Subtotal: **Rp 150.000**" — bold, monospace, green
  - Spacer 12px
  - Quantity: label + stepper [- 1 +]
- Footer:
  - Secondary Button "Batal"
  - Primary Button "Tambah ke Keranjang"

---

### Screen B5: POS — Pembayaran Tunai (Modal)

**Modal (medium size, 540px):**
- Header: "Pembayaran Tunai"
- Body:
  - Total section:
    - Large display: "Total Pembayaran"
    - **Rp 350.000** — Display size (36px), font-weight 700, monospace, color #2D5016
  - Spacer 24px
  - Input "Nominal Uang Pelanggan":
    - Large input field (height 56px, font-size 24px, monospace, text-align right)
    - Prefix "Rp" inside input
  - Spacer 16px
  - Quick amount buttons (grid 3 columns):
    - "Rp 400.000", "Rp 500.000", "Rp 1.000.000", "Uang Pas"
    - Style: ghost buttons, border 1px solid #D6CBBB, on click fills the input
  - Spacer 24px
  - Kembalian section (highlighted box):
    - Background: #4A7C3F1A, border-radius 8px, padding 16px
    - Label "Kembalian" — font 14px
    - **Rp 150.000** — H2, font-weight 700, monospace, color #4A7C3F
  - If nominal < total: show warning "Nominal kurang" in red
- Footer:
  - Secondary Button "Batal"
  - Primary Button "Proses & Cetak Struk" (disabled if nominal < total)

---

### Screen B6: POS — Pembayaran QRIS (Modal)

**Modal (medium size, 500px):**
- Header: "Pembayaran QRIS"
- Body:
  - Total: "Rp 350.000" — H3, monospace
  - Spacer 20px
  - QR Code area:
    - Centered, 240x240px QR code image
    - Below QR: "Scan menggunakan aplikasi e-wallet Anda"
    - Supported wallets icons row: GoPay, OVO, DANA, ShopeePay (small logos)
  - Spacer 20px
  - Status indicator:
    - Animated pulse dot + "Menunggu pembayaran..." (pending state)
    - When success: green checkmark icon + "Pembayaran Berhasil!" + confetti micro-animation
  - Timer countdown: "Berlaku hingga: 14:55" — caption, color #7A7062
- Footer:
  - Ghost Button "Batal"
  - "Bayar Tunai" link (switch method)

---

### Screen B7: POS — Struk Preview (Modal)

**Modal (small size, 380px):**
- Styled like a receipt/thermal print
- White background, mono-spaced font throughout
- Content:
  - Logo "BotaniRent" centered
  - Branch name, address, phone — centered, small
  - Dashed divider "- - - - - - - - -"
  - Transaction ID, Date, Cashier name
  - Dashed divider
  - Item list: name, qty, price, subtotal
  - Dashed divider
  - Subtotal, Discount, Total (bold)
  - Payment method, Amount paid, Change
  - Dashed divider
  - If sewa: rental period dates listed
  - "Terima kasih!" centered
  - Barcode/QR of transaction ID at bottom
- Footer:
  - Secondary Button "Tutup"
  - Primary Button "Cetak Struk" (printer icon)

---

### Screen B8: Kalender Booking

**Layout:**
- Standard layout with sidebar + top bar
- Main content area

**Content:**
- Page header: "Kalender Booking" — H2
- Filter bar:
  - Dropdown "Pilih Aset" (select specific asset or "Semua Aset")
  - Category filter pills
  - Month/week toggle
- Calendar view:
  - Monthly grid, 7 columns
  - Each day cell: 
    - Date number top-left
    - Colored dots/bars for bookings
    - Color coding: Available (white), Booked (blue #3B82B0 bar), Maintenance (amber #E8A820 bar)
  - Click on day: shows side panel or popover with booking details
- Legend bar at bottom:
  - Color swatches with labels: "Available", "Disewa", "Maintenance"
- Side detail panel (optional, when clicking a booking):
  - Customer name, rental period, items rented, transaction link

---

### Screen B9: Pengembalian Barang Sewa

**Layout:**
- Standard layout with sidebar + top bar

**Content:**
- Page header: "Pengembalian Barang Sewa" — H2
- Step wizard (3 steps horizontal stepper):
  - Step 1: "Cari Transaksi" → Step 2: "Cek Barang" → Step 3: "Konfirmasi"

**Step 1 — Cari Transaksi:**
- Search input: "Cari berdasarkan ID transaksi atau nama pelanggan"
- Results list: cards showing transaction ID, customer name, rental date, items, status badge "Aktif"
- Click to select → proceed to Step 2

**Step 2 — Cek Barang:**
- Transaction summary card at top (ID, customer, rental period)
- Table of items:
  - Columns: Item Name, Qty, Tanggal Kembali Seharusnya, Kondisi (dropdown), Catatan
  - Kondisi dropdown options: "Baik ✓", "Rusak Ringan ⚠️", "Rusak Berat ❌", "Hilang 🚫"
  - If late: auto-show "Terlambat X hari" in red badge
- Auto-calculated penalties section:
  - Card with amber/red bg:
    - "Denda Keterlambatan: Rp XX.XXX (X hari × Rp XX.XXX/hari)"
    - "Denda Kerusakan: Rp XX.XXX"
    - **Total Denda: Rp XX.XXX** — bold

**Step 3 — Konfirmasi:**
- Summary of everything
- Total denda to collect
- Primary Button "Proses Pengembalian"
- After success: status updated, confirmation message

---

### Screen B10: Riwayat Transaksi Kasir

**Layout:**
- Standard layout with sidebar + top bar

**Content:**
- Page header: "Riwayat Transaksi" — H2
- Filter bar:
  - Date range picker (from — to)
  - Dropdown: Tipe transaksi ("Semua", "Sewa", "Retail", "Hybrid")
  - Dropdown: Status ("Semua", "Selesai", "Aktif", "Bermasalah")
  - Search input
- Stats row (3 small metric cards):
  - "Total Transaksi Hari Ini: 24"
  - "Omzet Hari Ini: Rp 4.500.000"
  - "Barang Disewakan: 18"
- Table:
  - Columns: ID Transaksi, Tanggal, Customer, Items (truncated), Total, Metode Bayar, Status (badge)
  - Row click: expandable detail or navigate to detail page
  - Pagination at bottom

---

### Screen B11: Data Penyewa — Daftar Pelanggan

**Layout:**
- Standard layout with sidebar + top bar

**Content:**
- Page header: "Data Penyewa" — H2 + Primary Button "Tambah Penyewa" (right, icon +)
- Stats row (3 small metric cards):
  - Card 1: "Total Penyewa" — 128 — icon user, green circle
  - Card 2: "Sedang Menyewa" — 18 — icon package, blue circle
  - Card 3: "Penyewa Bermasalah" — 3 — icon alert, red circle (yang punya denda belum lunas)
- Filter bar:
  - Search input: "Cari nama, telepon, atau No. KTP..."
  - Status filter pills: "Semua", "Aktif Menyewa" (blue), "Riwayat" (green), "Bermasalah" (red)
  - Sort dropdown: "Terbaru", "Nama A-Z", "Paling Sering Sewa"
- Table:
  - Header row: bg #F0E8D8, font uppercase
  - Columns: Foto/Avatar, Nama Lengkap, No. HP, No. KTP, Total Sewa (count), Status (badge), Terakhir Sewa, Aksi (view/edit/delete)
  - Avatar: 36px circle, initials if no photo, bg #6B8F4E1A text #2D5016
  - Status badges:
    - "Aktif Menyewa" — blue pill #3B82B01A
    - "Selesai" — green pill #4A7C3F1A  
    - "Ada Denda" — red pill #C440321A
    - "Baru" — neutral pill #F0E8D8
  - Example data rows (8 rows):
    - "Budi Santoso", "081234567890", "3201...", "12 kali", "Aktif Menyewa", "21 Mei 2026"
    - "Siti Rahayu", "085678901234", "3202...", "8 kali", "Selesai", "15 Mei 2026"
    - "Ahmad Fadli", "087890123456", "3203...", "5 kali", "Ada Denda", "10 Mei 2026"
    - etc.
  - Row hover: bg #FAF6F0
  - Click row: navigate to Detail Penyewa (B13)
- Pagination: "Menampilkan 1-20 dari 128 penyewa" + page numbers

---

### Screen B12: Data Penyewa — Tambah/Edit Penyewa (Modal)

**Modal (medium size, 600px):**
- Header: "Tambah Penyewa Baru" or "Edit Data Penyewa" + close button X
- Body (single column form):

**Section 1: Identitas**
- Avatar upload area: circle 80px, dashed border, icon camera, "Upload Foto" text below
- Nama Lengkap (text input, required *)
- No. KTP / NIK (text input, 16 digit, required *)
  - Helper text: "Nomor Induk Kependudukan untuk identifikasi"

**Section 2: Kontak**
- No. HP / WhatsApp (text input, required *, with phone icon left)
  - Helper text: "Untuk konfirmasi dan follow-up pengembalian"
- Email (text input, optional)
- Alamat (textarea, 2 rows)

**Section 3: Jaminan (Opsional)**
- Jenis Jaminan (dropdown: "Tidak Ada", "KTP Asli", "SIM", "Kartu Mahasiswa", "Deposit Uang", "Lainnya")
- Nominal Deposit (number input, Rp prefix — shown only if "Deposit Uang" selected)
- Foto Jaminan (image upload area, small dashed box — shown only if jaminan selected)
- Catatan (text input, optional, placeholder "Catatan tambahan...")

**Footer:**
- Secondary Button "Batal"
- Primary Button "Simpan Penyewa"

---

### Screen B13: Data Penyewa — Detail Penyewa

**Layout:**
- Standard layout with sidebar + top bar

**Content:**
- Back link: "← Kembali ke Data Penyewa"
- Two column layout:

**Left Column (35%) — Profil Penyewa:**
- Card (bg white, border-radius 12px, shadow-sm):
  - Avatar besar: 96px circle, centered, bg #6B8F4E1A, initials or photo
  - Nama: H3, centered, below avatar
  - Status badge below name (e.g. "Aktif Menyewa" blue pill)
  - Divider
  - Info rows (icon + label + value):
    - 📱 No. HP: 081234567890
    - 🪪 No. KTP: 3201234567890001
    - ✉️ Email: budi@email.com
    - 📍 Alamat: Jl. Merdeka No. 10, Bandung
    - 🔒 Jaminan: KTP Asli (disimpan)
    - 📅 Terdaftar: 15 Jan 2026
  - Divider
  - Row: "Total Sewa: **12 kali**" | "Total Transaksi: **Rp 3.650.000**"
  - Footer card: tombol "Edit" (secondary) + tombol "Hapus" (danger ghost)

**Right Column (65%) — Riwayat & Detail:**
- Tabs: "Riwayat Sewa" | "Sewa Aktif" | "Denda"

**Tab 1 — Riwayat Sewa:**
- Table:
  - Columns: ID Transaksi, Tanggal, Barang (truncated list), Durasi, Total, Status (badge)
  - Status badges: "Selesai" (green), "Dikembalikan" (blue), "Terlambat" (red)
  - 5-8 example rows
  - Pagination

**Tab 2 — Sewa Aktif:**
- Cards for each active rental:
  - Card: border-left 4px #3B82B0, bg white
  - Transaction ID + date
  - Items list with quantities
  - "Tanggal kembali: 25 Mei 2026" — if close to due date: amber warning, if overdue: red alert
  - Days remaining/overdue badge
  - "Proses Pengembalian" button link

**Tab 3 — Denda:**
- Table of penalty history:
  - Columns: Tanggal, Transaksi ID, Tipe Denda, Nominal, Status Bayar
  - Status: "Lunas" (green badge), "Belum Bayar" (red badge)
  - Total denda belum lunas: highlighted card at top if any

---

### Screen C1: Inventaris — Daftar Barang

**Layout:**
- Standard layout with sidebar + top bar

**Content:**
- Page header: "Inventaris Barang" — H2 + Primary Button "Tambah Barang" (right)
- Secondary actions: "Bulk Upload" button (secondary style, with upload icon)
- Filter bar:
  - Search input
  - Category filter pills: "Semua", "Sewa", "Retail Home Industry", "Retail Reseller"
  - Status filter: "Semua", "Active", "Inactive"
  - View toggle: Grid view / Table view icons
- **Table View:**
  - Columns: Foto (small 40x40 thumb), Nama Barang, Kategori (badge), Barcode, Stok Total, Stok Tersedia, Harga, Status (badge), Aksi (edit/delete icons)
  - Sortable columns
  - Bulk select checkboxes left
- **Grid View:**
  - Cards similar to POS katalog but with more info (stock, status badge)
- Pagination: "Menampilkan 1-20 dari 156 barang" + page numbers

---

### Screen C2: Inventaris — Tambah/Edit Barang (Modal/Page)

**Modal (large size, 860px) or Full Page:**
- Header: "Tambah Barang Baru" or "Edit Barang"
- Two column form layout:

**Left column:**
- Image upload area: 
  - Dashed border box, 200x200px
  - Icon camera + "Upload Foto"
  - Drag & drop or click to browse
  - Shows preview after upload
- Barcode field: text input + "Generate" button

**Right column (form fields):**
- Nama Barang (text input, required)
- Kategori (dropdown: "Barang Sewa", "Retail Home Industry", "Retail Reseller")
- Deskripsi (textarea, 3 rows)
- Conditional fields based on kategori:
  - If Sewa: "Harga Sewa per Hari" (number input, Rp prefix)
  - If Retail: "Harga Jual" (number input, Rp prefix)
- Stok Total (number input)
- Status (toggle switch: Active/Inactive)

**Footer:**
- Secondary Button "Batal"
- Primary Button "Simpan Barang"

---

### Screen C3: Inventaris — Bulk Upload

**Modal (large, 860px) or full page:**
- Step 1: Upload
  - Drag & drop zone (large, dashed border, centered)
  - "Upload file Excel (.xlsx) atau CSV"
  - "Download template" link
  - File info after upload: filename, size, row count
- Step 2: Preview & Mapping
  - Table showing parsed data (first 10 rows preview)
  - Column mapping dropdowns if headers don't match
  - Error highlights: rows with issues highlighted in red bg
  - Summary: "156 baris valid, 3 baris bermasalah"
- Step 3: Confirm
  - "Import 156 barang ke cabang [Cabang A]?"
  - Progress bar during import
  - Success state: "156 barang berhasil ditambahkan ✓"

---

### Screen C4: Paket Bundling — Daftar Paket

**Layout:**
- Standard layout with sidebar + top bar

**Content:**
- Page header: "Paket Bundling Sewa" — H2 + Primary Button "Buat Paket Baru"
- Grid of package cards (2-3 columns):
  - Card:
    - Package image (top, aspect 16:9)
    - Package name: H4
    - Price: bold, monospace, green
    - Items count: "5 item dalam paket"
    - Items preview: small avatar stack of item images
    - Footer: Edit button + Delete button (ghost)
    - Status badge: "Aktif" / "Nonaktif"

---

### Screen C5: Paket Bundling — Buat/Edit Paket

**Full page or large modal:**
- Header: "Buat Paket Baru"
- Two column layout:

**Left (40%):**
- Package image upload
- Nama Paket (text input)
- Deskripsi (textarea)
- Harga Paket (number input, Rp prefix)
- Comparison: "Total harga satuan: Rp 250.000" vs "Harga paket: Rp 200.000" with "Hemat 20%" badge

**Right (60%):**
- "Pilih Barang dalam Paket:"
- Search input to find items
- Available items list (scrollable):
  - Each item: thumbnail + name + price + [+ Tambah] button
- Selected items list below (or drag-and-drop area):
  - Each item: thumbnail + name + qty stepper + [remove] button
  - Sortable/reorderable

**Footer:**
- Secondary Button "Batal"
- Primary Button "Simpan Paket"

---

### Screen C6: Manajemen Status Aset

**Layout:**
- Standard layout with sidebar + top bar

**Content:**
- Page header: "Status Aset Sewa" — H2
- Filter bar:
  - Search input
  - Status filter pills: "Semua", "Ready ✅", "Disewa 📋", "Maintenance 🔧", "Dicuci 🧹"
  - Each pill shows count badge
- Kanban-style board OR Table view toggle:

**Kanban View (default):**
- 4 columns: Ready | Disewa | Maintenance | Dicuci
- Each column header has count and color indicator
- Cards in each column:
  - Item thumbnail (small), item name
  - Last updated time
  - Drag & drop between columns to change status
  - Click to expand: shows notes, history

**Table View:**
- Columns: Foto, Nama Aset, Status (dropdown to change), Terakhir Diperbarui, Catatan, Aksi
- Inline status dropdown for quick change
- Bulk select for batch status update

---

### Screen D1: Dashboard Laporan Terpusat (Owner)

**Layout:**
- Standard layout with sidebar + top bar

**Content:**
- Page header: "Dashboard" — H1 + Branch filter dropdown (right) + Date range picker
- Welcome banner:
  - "Selamat siang, [Owner Name] 👋" — H3
  - Subtext: "Berikut ringkasan performa toko Anda hari ini"
  - Background: subtle gradient Forest Green to Sage Green, text white, border-radius 12px

**KPI Cards Row (4 cards):**
- Card style: bg white, border-radius 8px, padding 20px
- Each card:
  - Icon in colored circle (48px)
  - Label (caption, gray)
  - Value (H2, bold, monospace)
  - Trend indicator: "↑ 12% dari kemarin" (green) or "↓ 5%" (red)
- Cards:
  1. "Omzet Hari Ini" — Rp 4.500.000 — icon: dollar, color green circle
  2. "Total Transaksi" — 24 — icon: receipt, color amber circle
  3. "Barang Disewakan" — 18 — icon: package, color blue circle
  4. "Denda Terkumpul" — Rp 350.000 — icon: alert-triangle, color red circle

**Charts Row:**
- Left (60%): Line/Bar chart "Revenue 30 Hari Terakhir"
  - Multi-line: satu garis per cabang (warna berbeda)
  - X-axis: tanggal, Y-axis: Rp
  - Tooltip on hover
  - Chart colors: Forest Green, Warm Amber, Terracotta, Sage Green
- Right (40%): Donut/Pie chart "Proporsi Revenue per Cabang"
  - Legend below with cabang names + percentages

**Bottom Section:**
- Left (50%): "Transaksi Terbaru" — mini table, 5 rows, with "Lihat Semua →" link
- Right (50%): "Barang Populer" — horizontal bar chart or ranked list with progress bars

---

### Screen D2: Statistik Barang (Owner)

**Layout:**
- Standard layout with sidebar + top bar

**Content:**
- Page header: "Statistik Barang" — H2
- Tabs: "Paling Sering Disewa" | "Sering Rusak/Hilang" | "Utilization Rate"

**Tab 1 — Paling Sering Disewa:**
- Ranked list with horizontal bar chart:
  - #1. Tenda Dome 4P — 45 kali — bar 100%
  - #2. Sleeping Bag — 38 kali — bar 84%
  - etc.
- Date range filter

**Tab 2 — Sering Rusak/Hilang:**
- Table: Nama Barang, Total Insiden, Rusak Ringan, Rusak Berat, Hilang
- Sortable, highlighted rows for high-incident items

**Tab 3 — Utilization Rate:**
- Cards per asset showing utilization percentage
- Progress circle/ring showing % of time rented vs idle
- Color coding: >80% green, 50-80% amber, <50% red

---

### Screen D3: Manajemen Cabang (Owner)

**Layout:**
- Standard layout with sidebar + top bar

**Content:**
- Page header: "Manajemen Cabang" — H2 + Primary Button "Tambah Cabang"
- Cards grid (2 columns):
  - Each card:
    - Header: Branch name (H3) + status badge (Aktif green / Nonaktif gray)
    - Body:
      - Address (with map pin icon)
      - Phone number
      - Kasir count: "3 kasir aktif"
      - Item count: "156 barang"
      - Created date
    - Footer: "Edit" button + "Nonaktifkan" danger ghost button
    - Left accent border: 4px solid #2D5016 if active, #D6CBBB if inactive

**Add/Edit Branch Modal (medium, 540px):**
- Nama Cabang (text input)
- Alamat (textarea)
- No. Telepon (text input)
- Status toggle (Aktif/Nonaktif)
- Footer: Cancel + Save

---

### Screen D4: Pengaturan Denda Dinamis (Owner)

**Layout:**
- Standard layout with sidebar + top bar

**Content:**
- Page header: "Pengaturan Denda" — H2
- Info banner: (Info style, blue bg)
  - "Aturan denda yang Anda tetapkan di sini akan berlaku untuk semua cabang secara otomatis."

**Penalty Rules Cards:**
- Each rule as an editable card:
  - Card 1: "Denda Keterlambatan"
    - Icon: clock, amber
    - Current setting: "Rp 15.000 / hari"
    - Edit inline or modal: nominal input + satuan dropdown (per_hari / flat / persen_harga)
  - Card 2: "Denda Kerusakan Ringan"
    - Icon: alert-triangle, amber
    - "Rp 50.000 (flat)"
  - Card 3: "Denda Kerusakan Berat"
    - Icon: x-circle, red
    - "25% dari harga sewa"
  - Card 4: "Denda Kehilangan"
    - Icon: alert-octagon, red
    - "100% dari harga barang"
- Each card: edit icon top-right, save inline
- Add custom rule button: "+ Tambah Aturan Denda"

---

### Screen D5: Log Aktivitas (Owner)

**Layout:**
- Standard layout with sidebar + top bar

**Content:**
- Page header: "Log Aktivitas" — H2
- Filter bar:
  - Date range picker
  - Branch filter dropdown
  - Kasir filter dropdown
  - Action type filter: "Semua", "Transaksi", "Inventaris", "Pengembalian"
  - Search input
- Timeline-style list or Table:

**Timeline view:**
- Vertical timeline line (left, 2px, #E8DFC8)
- Each entry:
  - Dot on timeline (colored by type)
  - Timestamp: "14:32 — 21 Mei 2026"
  - Avatar + Kasir name + Branch badge
  - Action: "Membuat transaksi baru #TRX-2025-0042 — Total Rp 350.000"
  - Expandable details

**Table view (alternative):**
- Columns: Waktu, Kasir, Cabang, Aksi, Detail
- Sortable, paginated

---

### Screen E1: Sidebar Navigation

**Structure (expanded view):**
```
┌──────────────────────┐
│  🌿 BotaniRent       │  ← Logo area, bg slightly darker
│  ─────────────────── │
│                      │
│  KASIR               │  ← Section label (overline style)
│  📱 POS              │  ← Active: highlighted
│  👥 Data Penyewa     │
│  📅 Kalender Booking │
│  🔄 Pengembalian     │
│  📋 Riwayat          │
│                      │
│  ─────────────────── │
│  GUDANG              │
│  📦 Inventaris       │
│  📦 Paket Bundling   │
│  🔧 Status Aset     │
│                      │
│  ─────────────────── │
│  OWNER               │
│  📊 Dashboard        │
│  📈 Statistik        │
│  🏪 Cabang           │
│  ⚙️  Denda           │
│  📝 Log Aktivitas    │
│                      │
│  ─────────────────── │
│  👤 Ahmad Kasir      │  ← User info bottom
│  Kasir · Cabang A    │
│  [Logout]            │
└──────────────────────┘
```

- Menu items shown/hidden based on user role (RBAC)
- Kasir only sees KASIR section (termasuk Data Penyewa)
- Admin Gudang sees GUDANG section
- Owner sees OWNER section (and optionally all)

---

### Screen E2: Top Bar / Header

**Layout:**
- Height: 64px
- Background: #FFFFFF
- Border-bottom: 1px solid #E8DFC8
- Padding: 0 24px

**Left side:**
- Sidebar toggle button (hamburger icon)
- Breadcrumb: "Dashboard > Inventaris > Tambah Barang"
  - Separator: "/" or ">"
  - Last item: bold, color #2C2418
  - Previous items: color #7A7062, clickable

**Right side:**
- Branch selector (if applicable): Dropdown showing current branch
- Notification bell icon: with red dot badge if unread
- User section:
  - Avatar circle 36px
  - Name: font 14px, font-weight 500
  - Role badge: small pill (e.g. "Owner" amber, "Kasir" green, "Gudang" blue)
  - Dropdown on click: Profile, Settings, Logout

---

### Screen E3: 404 / Error Page

**Layout:**
- Centered on page, no sidebar
- Max-width 480px

**Content:**
- Large illustration: lost hiker / compass / mountain with clouds
- "404" — Display size, color #D6CBBB
- "Halaman Tidak Ditemukan" — H2
- "Sepertinya Anda tersesat di gunung. Halaman yang Anda cari tidak ada." — Body, color #7A7062
- Primary Button "Kembali ke Beranda"
- Ghost link "← Halaman sebelumnya"

---

## 4. Responsive Breakpoints

```
Desktop (default) : ≥ 1280px  — Full sidebar + content
Tablet Landscape  : 1024px    — Collapsed sidebar (icon only) + content
Tablet Portrait   : 768px     — Overlay sidebar + full content
Mobile            : < 640px   — Bottom navigation bar, stacked layout
```

**POS View khusus:**
- Minimum: 1024px (tablet landscape)
- Below 1024px: Cart becomes a slide-up bottom sheet
- Katalog grid: 2 columns on tablet, 3-4 on desktop

---

## 5. Iconography

```
Style       : Outlined / Line icons (consistent 1.5px stroke)
Library     : Lucide Icons (recommended) or Phosphor Icons
Size Default: 20px (in menus), 24px (in buttons/actions), 18px (inline text)
Color       : Inherits text color by default
```

**Key icons used:**
- POS: shopping-cart, barcode, credit-card, printer, calculator
- Inventory: package, upload, image, edit, trash, search
- Calendar: calendar, clock, check-circle
- Dashboard: bar-chart, trending-up, pie-chart, activity
- Navigation: menu, chevron-down, bell, user, log-out, settings
- Status: check-circle (ready), clock (disewa), wrench (maintenance), droplets (dicuci)
- Actions: plus, minus, x, filter, download, eye

---

## 6. Imagery & Brand Assets

**Logo:**
- "BotaniRent" wordmark
- Icon: stylized leaf + tent combination
- Primary version: Forest Green on white
- Inverse: White on Forest Green
- Accent mark: Warm Amber underline

**Photography style:**
- Outdoor adventure photography (mountains, camping, hiking)
- Warm, golden-hour lighting
- Used for: Login page background, empty states, marketing sections
- Treatment: slight warm color grade overlay

**Illustrations (for empty states & errors):**
- Style: line art with earthy fill colors
- Themes: hiking, camping, mountain, compass, backpack
- Color limited to palette colors only

---

## 7. Design Tokens Summary (for Developer Handoff)

```css
:root {
  /* Colors */
  --color-primary: #2D5016;
  --color-primary-light: #6B8F4E;
  --color-secondary: #D4A843;
  --color-accent: #C85A3A;
  --color-bg: #FAF6F0;
  --color-bg-dark: #1A1A1A;
  --color-surface: #F0E8D8;
  --color-surface-hover: #E8DFC8;
  --color-text-primary: #2C2418;
  --color-text-secondary: #7A7062;
  --color-text-disabled: #B0A696;
  --color-border: #D6CBBB;
  --color-border-light: #E8DFC8;
  --color-border-focus: #6B8F4E;
  --color-success: #4A7C3F;
  --color-warning: #E8A820;
  --color-error: #C44032;
  --color-info: #3B82B0;

  /* Typography */
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-base: 16px;
  --space-lg: 20px;
  --space-xl: 24px;
  --space-2xl: 32px;
  --space-3xl: 40px;
  --space-4xl: 48px;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(44,36,24,0.06), 0 1px 2px rgba(44,36,24,0.04);
  --shadow-md: 0 4px 6px rgba(44,36,24,0.07), 0 2px 4px rgba(44,36,24,0.04);
  --shadow-lg: 0 10px 15px rgba(44,36,24,0.08), 0 4px 6px rgba(44,36,24,0.04);
  --shadow-xl: 0 20px 25px rgba(44,36,24,0.10), 0 8px 10px rgba(44,36,24,0.04);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

> **Catatan untuk AI Design Generator (Stitch):**
> - Gunakan semua spesifikasi warna, tipografi, dan komponen di atas secara konsisten di seluruh screen.
> - Prioritaskan screen POS (B1-B7) karena ini adalah core feature yang paling sering digunakan.
> - Pastikan semua elemen touch-friendly (minimum tap target 44x44px) untuk penggunaan di tablet.
> - Jaga konsistensi spacing, border-radius, dan shadow di seluruh aplikasi.
> - Gunakan font Outfit untuk heading dan Inter untuk body text tanpa kecuali.
> - Semua harga/angka harus menggunakan font JetBrains Mono.
