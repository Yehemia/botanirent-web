# **Rekayasa Integrasi Dynamic QRIS Midtrans pada Platform SvelteKit dalam Lingkungan Sandbox**

## **Arsitektur Pembayaran QRIS Dinamis dalam Sistem Finansial Modern**

Quick Response Code Indonesian Standard (QRIS) merupakan standarisasi kode QR nasional yang diregulasi oleh Bank Indonesia bersama Asosiasi Sistem Pembayaran Indonesia (ASPI) untuk memfasilitasi transaksi pembayaran nontunai yang terintegrasi di Indonesia.1 Diluncurkan secara resmi pada 17 Agustus 2019, metode pembayaran ini telah diadopsi secara luas oleh Midtrans sejak 1 Januari 2020 guna menyederhanakan interaksi antara merchant dan pelanggan.1 Melalui integrasi QRIS, merchant dapat menerima pembayaran dari berbagai aplikasi dompet digital terkemuka seperti GoPay, ShopeePay, OVO, Dana, LinkAja, hingga layanan pemindaian transaksi pada aplikasi perbankan seluler (*mobile banking*).1  
Dalam ekosistem gerbang pembayaran (*payment gateway*), merchant dihadapkan pada dua pilihan arsitektur QRIS, yaitu QRIS Statis dan QRIS Dinamis.3 Pemilihan arsitektur ini berdampak signifikan pada proses rekonsiliasi data transaksi backend dan kenyamanan operasional pelanggan.3

| Dimensi Perbandingan | QRIS Statis | QRIS Dinamis |
| :---- | :---- | :---- |
| **Generasi Kode QR** | Satu kode QR permanen yang digunakan berulang kali untuk semua transaksi.3 | Kode QR unik yang digenerasikan secara otomatis untuk setiap transaksi spesifik.3 |
| **Penentuan Nominal** | Nominal pembayaran ditentukan secara manual oleh pelanggan setelah melakukan pemindaian.3 | Nominal ditentukan di awal oleh sistem merchant dan terkunci di dalam payload QR.3 |
| **Identifikasi Transaksi** | Menggunakan sistem ID generik (QRIS-xxx) yang dikelola oleh pihak penyedia layanan.3 | Menggunakan *Order ID* kustom yang dapat didefinisikan secara bebas oleh sistem merchant.3 |
| **Pencatatan Transaksi** | Entri transaksi baru terbentuk di database setelah pelanggan sukses melakukan pembayaran.3 | Entri transaksi dengan status *pending* terbentuk di database sebelum pembayaran dilakukan.3 |
| **Fasilitas Pengembalian** | Fitur pengembalian dana (*refund*) secara otomatis melalui API belum tersedia.3 | Pengembalian dana (*refund*) didukung penuh melalui API maupun Merchant Dashboard.3 |
| **Kasus Penggunaan Optimal** | Sangat cocok untuk toko fisik (*offline*), konter bazar, atau kampanye donasi terbuka.3 | Sangat ideal untuk platform e-commerce, aplikasi SaaS, dan transaksi online berbasis web.1 |

Implementasi QRIS Dinamis meminimalisasi terjadinya kegagalan pembayaran akibat kesalahan input nominal oleh pelanggan.3 Karena setiap kode QR merepresentasikan satu nilai transaksi yang unik, sistem backend merchant dapat melakukan rekonsiliasi data pembayaran secara otomatis, aman, dan instan begitu menerima konfirmasi dari server Midtrans.4

## **Desain Alur Pengguna Multi-Platform**

Keberhasilan integrasi QRIS Dinamis sangat bergantung pada bagaimana aplikasi merespons jenis perangkat yang digunakan oleh pelanggan saat bertransaksi.7 Pola interaksi pengguna terbagi menjadi dua skenario utama berdasarkan dimensi layar dan kapabilitas perangkat keras, yaitu skenario peramban desktop (*desktop web browser*) dan skenario perangkat seluler (*mobile browser*).7  
Pada skenario peramban desktop, pelanggan melakukan proses transaksi menggunakan komputer atau tablet.7 Antarmuka aplikasi SvelteKit akan menampilkan gambar kode QRIS dinamis pada layar.4 Pelanggan kemudian mengambil perangkat seluler mereka, membuka aplikasi dompet digital atau aplikasi perbankan yang mendukung pemindaian QRIS, mengarahkan kamera untuk memindai kode QR yang terpampang di layar monitor, dan menyelesaikan otorisasi pembayaran pada perangkat seluler mereka.1

\+-------------------------------------------------------------------------+  
|                       Skenario Peramban Desktop                         |  
\+-------------------------------------------------------------------------+  
|                  |  
|  Menampilkan Gambar QR \-----------\>  Melakukan Scan Kode QR di Layar    |  
|                                                     |                   |  
|                                                     v                   |  
|                                      Menyelesaikan Pembayaran di App    |  
\+-------------------------------------------------------------------------+

Sementara itu, pada skenario perangkat seluler, pelanggan melakukan penelusuran (*browsing*) dan transaksi langsung menggunakan ponsel pintar mereka.7 Karena keterbatasan fisik perangkat, pelanggan tidak mungkin memindai kode QR yang tampil di layar ponsel mereka sendiri.7  
Oleh karena itu, sistem memanfaatkan mekanisme tautan dalam (*deeplink*).7 Aplikasi SvelteKit harus mendeteksi agen pengguna (*user agent*) dan menyediakan tombol aksi yang mengarahkan pelanggan secara langsung ke aplikasi dompet digital yang terpasang di perangkat mereka (misalnya aplikasi Gojek atau GoPay).7 Pelanggan kemudian menyelesaikan pembayaran di dalam aplikasi tersebut tanpa perlu melakukan pemindaian fisik.4

\+-------------------------------------------------------------------------+  
|                       Skenario Perangkat Seluler                        |  
\+-------------------------------------------------------------------------+  
|             |  
|  Pelanggan Klik Tombol Aksi \------\>  Otomatis Terbuka via Deeplink      |  
|                                                     |                   |  
|                                                     v                   |  
|                                      Konfirmasi PIN & Selesai           |  
\+-------------------------------------------------------------------------+

## **Manajemen Kredensial dan Keamanan Lingkungan SvelteKit**

Dalam arsitektur aplikasi SvelteKit, pemisahan yang ketat antara lingkungan eksekusi server (*server-side*) dan klien (*client-side*) harus diterapkan secara konsisten untuk menjaga integritas kredensial pembayaran.8 Kunci Server (*Server Key*) yang diterbitkan oleh Midtrans bertindak sebagai instrumen otorisasi utama yang memiliki hak akses penuh untuk membuat tagihan dan mengelola transaksi finansial.4 Kebocoran *Server Key* ke sisi klien dapat berdampak fatal terhadap keamanan finansial merchant.8  
SvelteKit memfasilitasi perlindungan ini melalui sistem manajemen variabel lingkungan bawaan yang terbagi menjadi empat modul utama 8:

* $env/static/private: Memuat variabel lingkungan yang dievaluasi pada saat kompilasi (*build-time*) dan hanya dapat diakses oleh modul server.8 Jika modul ini diimpor ke dalam kode sisi klien (seperti komponen .svelte biasa), sistem kompilasi Vite akan memicu kesalahan (*error*) secara sengaja guna mencegah kebocoran data.8  
* $env/static/public: Menyediakan akses ke variabel lingkungan publik yang aman untuk dikonsumsi oleh browser klien, ditandai dengan awalan khusus PUBLIC\_.11  
* $env/dynamic/private: Digunakan untuk memuat variabel lingkungan privat yang nilainya dievaluasi secara dinamis saat aplikasi dijalankan (*runtime*).8  
* $env/dynamic/public: Digunakan untuk memuat variabel lingkungan publik yang dievaluasi secara dinamis saat aplikasi dijalankan.12

Untuk keperluan integrasi di lingkungan pengujian, buatlah file konfigurasi .env pada direktori akar (*root*) proyek SvelteKit dengan format sebagai berikut 8:

Cuplikan kode  
\# Kredensial Privat \- Hanya boleh diakses oleh Server-Side SvelteKit   
MIDTRANS\_SERVER\_KEY="SB-Mid-server-xxxxxxxxxxxxxxxxxxxxxxxx"  
MIDTRANS\_API\_URL="https://api.sandbox.midtrans.com/v2"

\# Kredensial Publik \- Aman dikonsumsi oleh Client-Side Browser \[11, 12\]  
PUBLIC\_MIDTRANS\_CLIENT\_KEY="SB-Mid-client-yyyyyyyyyyyyyyyy"  
PUBLIC\_MIDTRANS\_ENV="sandbox"

Protokol otentikasi Midtrans Core API menggunakan metode *Basic Authentication* berbasis HTTP.14 Dalam skema ini, *Server Key* bertindak sebagai nama pengguna (*username*), sedangkan kata sandi (*password*) dibiarkan kosong.14 String otentikasi dibentuk dengan menggabungkan kunci server dengan karakter titik dua (:), yang kemudian dikodekan ke dalam format Base64.14 Formulasi kriptografi untuk pembentukan header otorisasi didefinisikan sebagai berikut 14:  
![][image1]  
Kombinasi antara skema enkripsi Base64 di sisi server dan isolasi variabel lingkungan di SvelteKit memastikan bahwa *Server Key* tidak akan pernah terekspos dalam lalu lintas jaringan sisi klien.8

## **Konstruksi Request Payload Core API Midtrans**

Proses pembuatan transaksi QRIS dinamis diawali dengan pengiriman dokumen permintaan JSON (*request payload*) ke server Sandbox Midtrans melalui metode HTTP POST ke endpoint /charge.7 SvelteKit menangani skenario ini dengan menyediakan Endpoint API (+server.js atau \+server.ts) yang mengeksekusi logika di sisi server sebelum meneruskan instruksi ke Midtrans.17  
Struktur parameter yang dikirimkan dalam *request payload* harus mengikuti skema spesifikasi Midtrans Core API guna menghindari penolakan transaksi.16

| Nama Parameter | Tipe Data | Sifat | Deskripsi |
| :---- | :---- | :---- | :---- |
| payment\_type | String | Wajib | Harus bernilai "qris" untuk memicu pembuatan kode QR dinamis.4 |
| transaction\_details.order\_id | String | Wajib | ID transaksi unik yang dihasilkan oleh merchant.4 |
| transaction\_details.gross\_amount | Number | Wajib | Total nominal pembayaran dalam satuan mata uang Rupiah (IDR).4 |
| custom\_expiry.expiry\_duration | Number | Opsional | Durasi aktif kode QR sebelum kedaluwarsa (direkomendasikan minimal 15).4 |
| custom\_expiry.unit | String | Opsional | Satuan waktu durasi aktif, dengan opsi: second, minute, hour, atau day.19 |

Meskipun batas waktu aktif QRIS dapat diatur secara kustom, Midtrans menyarankan untuk tidak menetapkan durasi kedaluwarsa di bawah 15 menit.4 Hal ini dikarenakan penjadwal otomatis (*scheduler*) Midtrans memerlukan waktu pemrosesan berkala untuk mengubah status transaksi yang tidak terbayar menjadi expire secara akurat.4 Jika merchant membutuhkan pembatalan instan di bawah batas tersebut, merchant disarankan menggunakan API pembatalan (*Cancel API*) secara manual.4  
Berikut adalah implementasi endpoint server SvelteKit pada file src/routes/api/charge/+server.js untuk memproses permintaan transaksi tersebut 17:

JavaScript  
import { json } from '@sveltejs/kit';  
import { MIDTRANS\_SERVER\_KEY, MIDTRANS\_API\_URL } from '$env/static/private';

/\*\* @type {import('./$types').RequestHandler} \*/  
export async function POST({ request }) {  
    try {  
        const body \= await request.json();  
        const { orderId, amount, customerDetails } \= body;

        // Validasi parameter wajib sebelum memicu komunikasi API  
        if (\!orderId ||\!amount) {  
            return json({ error: 'Parameter orderId dan amount wajib diisi.' }, { status: 400 });  
        }

        // Formulasi otentikasi Basic Auth Base64   
        const authHeaderValue \= Buffer.from(\`${MIDTRANS\_SERVER\_KEY}:\`).toString('base64');

        // Penyusunan payload transaksi terstruktur   
        const midtransPayload \= {  
            payment\_type: 'qris',  
            transaction\_details: {  
                order\_id: orderId,  
                gross\_amount: parseInt(amount)  
            },  
            customer\_details: customerDetails? {  
                first\_name: customerDetails.firstName,  
                last\_name: customerDetails.lastName,  
                email: customerDetails.email,  
                phone: customerDetails.phone  
            } : undefined,  
            custom\_expiry: {  
                expiry\_duration: 15,  
                unit: 'minute' // Default batas waktu aktif transaksi adalah 15 menit   
            }  
        };

        // Eksekusi HTTP Request ke Core API Sandbox Midtrans \[4, 7, 16\]  
        const response \= await fetch(\`${MIDTRANS\_API\_URL}/charge\`, {  
            method: 'POST',  
            headers: {  
                'Accept': 'application/json',  
                'Content-Type': 'application/json',  
                'Authorization': \`Basic ${authHeaderValue}\`  
            },  
            body: JSON.stringify(midtransPayload)  
        });

        const responseData \= await response.json();

        if (\!response.ok) {  
            return json(  
                { error: responseData.status\_message || 'Terjadi kesalahan pada server gateway.' },  
                { status: response.status }  
            );  
        }

        return json(responseData, { status: 201 });

    } catch (error) {  
        return json({ error: \`Kesalahan Internal Server: ${error.message}\` }, { status: 500 });  
    }  
}

## **Pengolahan Respons API dan Rendering QR Code secara Lokal**

Apabila pengiriman data ke server Midtrans berjalan sukses, server akan mengembalikan respons HTTP 201 Created.4 Di dalam objek JSON respons tersebut, terdapat sekumpulan parameter penting yang harus diproses oleh aplikasi frontend SvelteKit.4

| Nama Properti | Tipe Data | Deskripsi |
| :---- | :---- | :---- |
| status\_code | String | Kode status respons transaksi dari Midtrans (misalnya "201").4 |
| transaction\_status | String | Status awal transaksi, bernilai "pending" yang berarti siap untuk dibayar.4 |
| qr\_string | String | String representasi data QRIS berbasis standar EMVCo.4 |
| actions | Array | Kumpulan objek aksi pembayaran yang didukung oleh sistem.4 |

Di dalam array actions, pengembang harus mencari objek yang memiliki nilai properti name berupa "generate-qr-code".4 Objek tersebut menyimpan URL gambar dinamis yang dapat digunakan untuk menampilkan kode QR secara langsung pada halaman web merchant 4:

JSON  
{  
  "name": "generate-qr-code",  
  "method": "GET",  
  "url": "https://api.sandbox.midtrans.com/v2/qris/1015a919-b03f-450a-bc85-b38202a79a96/qr-code"  
}

Sebagai alternatif dari metode pemanggilan gambar eksternal (*hotlinking*), pengembang dapat mengonversi properti qr\_string secara lokal di sisi browser klien menjadi gambar kode QR menggunakan pustaka pihak ketiga seperti svelte-qrcode atau svelte-qrcode-image.20 Metode konversi lokal ini menawarkan keuntungan berupa pemuatan gambar yang lebih cepat dan fleksibilitas penyesuaian gaya tampilan (*styling*) kode QR.20  
Berikut adalah implementasi antarmuka sisi klien pada file src/routes/pay/+page.svelte yang mengintegrasikan kedua pendekatan presentasi QR Code tersebut 4:

Svelte  
\<script\>  
    import { onMount } from 'svelte';  
      
    let orderId \= '';  
    let amount \= 25000;  
    let isProcessing \= false;  
    let feedbackError \= '';  
    let responsePayload \= null;  
    let extractedQrUrl \= '';  
    let rawQrString \= '';

    // Fungsi utilitas untuk menghasilkan kode pesanan unik secara otomatis  
    const regenerateOrderId \= () \=\> {  
        orderId \= 'ORD-' \+ Date.now() \+ '-' \+ Math.floor(Math.random() \* 1000);  
    };

    onMount(() \=\> {  
        regenerateOrderId();  
    });

    const triggerChargeAPI \= async () \=\> {  
        isProcessing \= true;  
        feedbackError \= '';  
        responsePayload \= null;  
        extractedQrUrl \= '';  
        rawQrString \= '';

        try {  
            const apiCall \= await fetch('/api/charge', {  
                method: 'POST',  
                headers: { 'Content-Type': 'application/json' },  
                body: JSON.stringify({  
                    orderId,  
                    amount,  
                    customerDetails: {  
                        firstName: 'Budi',  
                        lastName: 'Santoso',  
                        email: 'budi.santoso@example.com',  
                        phone: '081234567890'  
                    }  
                })  
            });

            const result \= await apiCall.json();

            if (\!apiCall.ok) {  
                throw new Error(result.error || 'Proses inisiasi pembayaran gagal.');  
            }

            responsePayload \= result;  
            rawQrString \= result.qr\_string; // Menyimpan raw string QRIS 

            // Melakukan pencarian URL kode QR dari objek actions   
            if (result.actions && Array.isArray(result.actions)) {  
                const targetAction \= result.actions.find(act \=\> act.name \=== 'generate-qr-code');  
                if (targetAction) {  
                    extractedQrUrl \= targetAction.url;  
                }  
            }  
        } catch (err) {  
            feedbackError \= err.message;  
        } finally {  
            isProcessing \= false;  
        }  
    };  
\</script\>

\<div class="checkout-layout"\>  
    \<h2\>Pembayaran Dynamic QRIS \- Sandbox Environment\</h2\>  
      
    \<div class="control-box"\>  
        \<label for="order-input"\>ID Transaksi\</label\>  
        \<div class="input-inline"\>  
            \<input id="order-input" type="text" bind:value={orderId} readonly /\>  
            \<button on:click={regenerateOrderId} class="btn-sec"\>Regenerasi ID\</button\>  
        \</div\>  
    \</div\>

    \<div class="control-box"\>  
        \<label for="amount-input"\>Nominal Pembayaran (IDR)\</label\>  
        \<input id="amount-input" type="number" bind:value={amount} /\>  
    \</div\>

    \<button on:click={triggerChargeAPI} disabled={isProcessing} class="btn-main"\>  
        {isProcessing? 'Membangkitkan QRIS...' : 'Bayar Sekarang'}  
    \</button\>

    {\#if feedbackError}  
        \<div class="msg-box error-theme"\>{feedbackError}\</div\>  
    {/if}

    {\#if responsePayload}  
        \<div class="qr-bill-board"\>  
            \<h3\>Selesaikan Pembayaran Anda\</h3\>  
            \<p class="amount-text"\>Total Tagihan: Rp {parseInt(responsePayload.gross\_amount).toLocaleString('id-ID')}\</p\>  
            \<p class="status-badge"\>Status Transaksi: \<span class="badge"\>{responsePayload.transaction\_status}\</span\>\</p\>

            \<div class="presentation-columns"\>  
                {\#if extractedQrUrl}  
                    \<div class="display-card"\>  
                        \<h5\>Render via Image URL\</h5\>  
                        \<img src={extractedQrUrl} alt="Midtrans QRIS Code" class="qr-preview-img" /\>  
                        \<span class="meta-label"\>Dirender dari CDN Midtrans\</span\>  
                    \</div\>  
                {/if}

                {\#if rawQrString}  
                    \<div class="display-card"\>  
                        \<h5\>Render via Raw QR String\</h5\>  
                        \<div class="string-box"\>  
                            \<code\>{rawQrString}\</code\>  
                        \</div\>  
                        \<span class="meta-label"\>Gunakan string ini dengan library svelte-qrcode\</span\>  
                    \</div\>  
                {/if}  
            \</div\>

            \<div class="payment-notes"\>  
                \<p\>\<strong\>Panduan Penggunaan:\</strong\>\</p\>  
                \<p\>Silakan buka aplikasi GoPay, ShopeePay, OVO, Dana, LinkAja, atau aplikasi perbankan Anda. Akses menu pemindaian QR, arahkan kamera ke kode QR di atas, periksa nominal tagihan, dan tuntaskan proses transaksi pembayaran Anda.\[1, 4, 7\]\</p\>  
            \</div\>  
        \</div\>  
    {/if}  
\</div\>

\<style\>  
   .checkout-layout {  
        max-width: 650px;  
        margin: 2rem auto;  
        padding: 2rem;  
        background: \#ffffff;  
        border: 1px solid \#e2e8f0;  
        border-radius: 12px;  
        font-family: system-ui, \-apple-system, sans-serif;  
    }  
   .control-box {  
        margin-bottom: 1.25rem;  
    }  
   .input-inline {  
        display: flex;  
        gap: 0.5rem;  
    }  
    label {  
        display: block;  
        font-weight: 600;  
        margin-bottom: 0.5rem;  
        color: \#4a5568;  
    }  
    input {  
        flex: 1;  
        padding: 0.75rem;  
        border: 1px solid \#cbd5e1;  
        border-radius: 6px;  
        font-size: 1rem;  
    }  
   .btn-main {  
        width: 100%;  
        padding: 0.875rem;  
        background: \#10b981;  
        color: white;  
        border: none;  
        border-radius: 6px;  
        font-weight: 700;  
        font-size: 1.1rem;  
        cursor: pointer;  
        transition: background 0.2s;  
    }  
   .btn-main:hover {  
        background: \#059669;  
    }  
   .btn-sec {  
        padding: 0.75rem 1rem;  
        background: \#f1f5f9;  
        border: 1px solid \#cbd5e1;  
        border-radius: 6px;  
        cursor: pointer;  
        font-weight: 600;  
    }  
   .msg-box {  
        margin-top: 1rem;  
        padding: 1rem;  
        border-radius: 6px;  
        font-weight: 500;  
    }  
   .msg-box.error-theme {  
        background: \#fee2e2;  
        color: \#991b1b;  
        border: 1px solid \#fca5a5;  
    }  
   .qr-bill-board {  
        margin-top: 2rem;  
        padding: 1.5rem;  
        background: \#f8fafc;  
        border-radius: 10px;  
        border: 1px solid \#e2e8f0;  
        text-align: center;  
    }  
   .amount-text {  
        font-size: 1.5rem;  
        font-weight: 800;  
        color: \#1e293b;  
        margin: 0.5rem 0;  
    }  
   .presentation-columns {  
        display: flex;  
        gap: 1.5rem;  
        margin: 1.5rem 0;  
        flex-wrap: wrap;  
    }  
   .display-card {  
        flex: 1;  
        min-width: 240px;  
        background: white;  
        padding: 1rem;  
        border: 1px dashed \#cbd5e1;  
        border-radius: 8px;  
    }  
   .qr-preview-img {  
        width: 160px;  
        height: 160px;  
        margin: 0.5rem 0;  
    }  
   .string-box {  
        background: \#f1f5f9;  
        padding: 0.75rem;  
        border-radius: 6px;  
        font-size: 0.75rem;  
        word-break: break-all;  
        text-align: left;  
        height: 140px;  
        overflow-y: auto;  
    }  
   .meta-label {  
        display: block;  
        font-size: 0.7rem;  
        color: \#64748b;  
        margin-top: 0.5rem;  
    }  
   .payment-notes {  
        background: \#eff6ff;  
        padding: 1rem;  
        border-radius: 8px;  
        text-align: left;  
        font-size: 0.875rem;  
        color: \#1e3a8a;  
        line-height: 1.6;  
    }  
\</style\>

## **Sistem Sinkronisasi Webhook dan Verifikasi Kriptografi SHA-512**

Mekanisme sinkronisasi status transaksi di dalam aplikasi merchant berjalan secara asinkronus menggunakan konsep Webhook.4 Ketika pengguna menuntaskan pembayaran di perangkat seluler mereka, server Midtrans mendeteksi perubahan status tersebut lalu mengirimkan permintaan HTTP POST berisi payload JSON ke URL notifikasi yang telah didaftarkan oleh merchant.4  
Setiap notifikasi Webhook membawa properti signature\_key yang berguna untuk membuktikan keaslian sumber data.5 Untuk menangkal manipulasi payload (*spoofing*) oleh entitas eksternal jahat, server SvelteKit wajib menghitung ulang tanda tangan digital menggunakan algoritma SHA-512.6  
Formulasi hashing SHA-512 dikonstruksikan dengan menggabungkan parameter pesanan penting dengan *Server Key* merchant 6:  
![][image2]  
Dalam pemrosesan asinkronus ini, status transaksi akan berganti secara dinamis berdasarkan respons dari gerbang pembayaran.4

| Status Transaksi | Makna Operasional | Tindakan Sistem Merchant |
| :---- | :---- | :---- |
| **Settlement** | Pembayaran berhasil dikonfirmasi oleh institusi perbankan atau penyedia e-wallet.4 | Tandai transaksi sukses (PAID), kirim kuitansi digital, dan proses pengiriman produk.4 |
| **Pending** | Transaksi telah dibuat, namun pelanggan belum melakukan proses pembayaran.4 | Setel status pesanan menjadi AWAITING\_PAYMENT.4 |
| **Expire** | Batas waktu pembayaran yang ditentukan oleh merchant atau default sistem telah terlampaui.4 | Ubah status menjadi EXPIRED, kembalikan ketersediaan stok produk, dan batalkan reservasi.4 |
| **Deny** | Transaksi ditolak oleh penerbit instrumen pembayaran atau sistem proteksi fraud.4 | Tandai status sebagai DENIED/FAILED dan batalkan pesanan.4 |
| **Cancel** | Transaksi dibatalkan secara manual baik oleh pelanggan maupun merchant.4 | Setel status ke CANCELLED.4 |

Berikut adalah kode pengolahan Webhook pada sisi server SvelteKit (src/routes/api/webhook/+server.js) yang mengimplementasikan otentikasi tanda tangan digital berbasis SHA-512 secara ketat 17:

JavaScript  
import { json } from '@sveltejs/kit';  
import crypto from 'crypto';  
import { MIDTRANS\_SERVER\_KEY } from '$env/static/private';

/\*\* @type {import('./$types').RequestHandler} \*/  
export async function POST({ request }) {  
    try {  
        const payload \= await request.json();

        // Ekstraksi parameter validasi kriptografi \[6, 23\]  
        const {  
            order\_id,  
            status\_code,  
            gross\_amount,  
            signature\_key,  
            transaction\_status,  
            fraud\_status  
        } \= payload;

        // Validasi keberadaan elemen pembentuk signature  
        if (\!order\_id ||\!status\_code ||\!gross\_amount ||\!signature\_key) {  
            return json({ error: 'Data payload webhook tidak lengkap.' }, { status: 400 });  
        }

        // Komputasi hash SHA-512 lokal menggunakan Node.js crypto \[23, 24, 27\]  
        const concatenatedString \= \`${order\_id}${status\_code}${gross\_amount}${MIDTRANS\_SERVER\_KEY}\`;  
        const locallyComputedHash \= crypto  
           .createHash('sha512')  
           .update(concatenatedString)  
           .digest('hex');

        // Pemeriksaan integritas data transaksi \[23, 24\]  
        if (locallyComputedHash\!== signature\_key) {  
            console.error(\` Signature Mismatch detected for Order: ${order\_id}\`);  
            return json({ error: 'Tanda tangan digital tidak cocok.' }, { status: 403 });  
        }

        // Penanganan alur perubahan status berdasarkan parameter Midtrans   
        switch (transaction\_status) {  
            case 'settlement':  
                if (\!fraud\_status || fraud\_status \=== 'accept') {  
                    // IMPLEMENTASI MERCHANT: Update database menjadi "PAID"  
                    console.log(\` Pembayaran untuk Order ID ${order\_id} diterima.\`);  
                }  
                break;  
                  
            case 'pending':  
                // IMPLEMENTASI MERCHANT: Atur status pesanan menjadi "Awaiting Payment"  
                console.log(\` Order ID ${order\_id} menunggu pembayaran.\`);  
                break;  
                  
            case 'expire':  
                // IMPLEMENTASI MERCHANT: Kembalikan ketersediaan stok, ubah status ke "Cancelled"  
                console.log(\` Batas waktu pembayaran Order ID ${order\_id} terlampaui.\`);  
                break;  
                  
            case 'cancel':  
                // IMPLEMENTASI MERCHANT: Tandai transaksi sebagai dibatalkan  
                console.log(\` Order ID ${order\_id} dibatalkan.\`);  
                break;

            case 'deny':  
                // IMPLEMENTASI MERCHANT: Tandai transaksi sebagai ditolak oleh penyedia pembayaran  
                console.log(\` Order ID ${order\_id} ditolak.\`);  
                break;  
        }

        return json({ status: 'OK', message: 'Webhook berhasil diproses.' }, { status: 200 });

    } catch (error) {  
        console.error(\` Gagal memproses notifikasi: ${error.message}\`);  
        return json({ error: 'Kesalahan internal dalam memproses webhook.' }, { status: 500 });  
    }  
}

## **Strategi Pengujian Lokal dan Validasi Mode Sandbox**

Proses pengembangan aplikasi pembayaran di lingkungan lokal (*localhost*) sering kali mengalami kendala karena server Midtrans tidak dapat mengirimkan notifikasi Webhook ke alamat IP internal komputer pengembang.5 Infrastruktur keamanan internet mengharuskan endpoint tujuan Webhook berupa URL publik yang terenkripsi SSL/TLS.5  
Untuk mengatasi tantangan ini, pengembang harus mengadopsi taktik ekspos lokal (*localhost tunneling*).5 Pustaka pihak ketiga seperti Ngrok, Serveo, atau Localhost.run dapat menjembatani komunikasi antara server Midtrans di internet dengan SvelteKit yang berjalan di komputer lokal.5

\+--------------------+            HTTP POST            \+---------------------+  
|  Midtrans Sandbox  | \------------------------------\> | Tunneling (Ngrok)   |  
\+--------------------+                                 \+---------------------+  
                                                                  |  
                                                                  | Meneruskan Request  
                                                                  v  
                                                       \+---------------------+  
                                                       |  SvelteKit Local    |  
                                                       |  \`localhost:5173\`   |  
                                                       \+---------------------+

Setelah memperoleh URL terowongan (*tunnel*) publik dari Ngrok (misal: https://abcd-123.ngrok-free.app), pengembang dapat melakukan registrasi endpoint Webhook melalui dua pendekatan alternatif 4:

1. **Melalui Portal Merchant (MAP)**: Masuk ke dalam Midtrans Merchant Administration Portal (MAP) Sandbox, navigasikan ke menu *Settings \> Configuration*, lalu masukkan alamat URL penuh https://abcd-123.ngrok-free.app/api/webhook pada input *Payment Notification URL*.5  
2. **Melalui Custom Header Transaksional**: Apabila merchant mengintegrasikan multi-tenant atau membutuhkan fleksibilitas perubahan rute notifikasi dinamis secara instan, merchant dapat menambahkan header HTTP X-Override-Notification saat mengeksekusi metode API /charge.4 Alamat URL yang dideklarasikan pada header ini akan secara dinamis menimpa konfigurasi statis yang terdaftar di MAP.4

Dalam mode Sandbox, Midtrans menyediakan utilitas simulator transaksi pada halaman dashboard pengembang.4 Pengembang dapat menyalin ID Transaksi atau qr\_string yang dihasilkan oleh aplikasi SvelteKit, lalu memasukkannya ke dalam simulator guna merekayasa status pembayaran menjadi settlement secara instan.4 Melalui simulator ini, fungsionalitas logika kriptografi SHA-512, pemrosesan transaksional basis data lokal, dan stabilitas integrasi sistem SvelteKit dapat divalidasi dengan aman sebelum berpindah ke lingkungan produksi.4

#### **Karya yang dikutip**

1. Introduction QRIS Payment \- Midtrans Documentation, diakses Mei 26, 2026, [https://docs.midtrans.com/docs/introduction-qris-payment](https://docs.midtrans.com/docs/introduction-qris-payment)  
2. Apps or partners that can be used for paying QRIS transaction in Midtrans, diakses Mei 26, 2026, [https://docs.midtrans.com/docs/apps-or-partners-that-can-be-used-for-paying-qris-transaction-in-midtrans](https://docs.midtrans.com/docs/apps-or-partners-that-can-be-used-for-paying-qris-transaction-in-midtrans)  
3. Introduction to Static QRIS \- Midtrans Documentation, diakses Mei 26, 2026, [https://docs.midtrans.com/docs/introduction-to-static-qris](https://docs.midtrans.com/docs/introduction-to-static-qris)  
4. GoPay QRIS POS Integration \- Midtrans Documentation, diakses Mei 26, 2026, [https://docs.midtrans.com/docs/gopay-qris-pos-integration](https://docs.midtrans.com/docs/gopay-qris-pos-integration)  
5. HTTP(S) Notification / Webhooks \- Midtrans Documentation, diakses Mei 26, 2026, [https://docs.midtrans.com/docs/https-notification-webhooks](https://docs.midtrans.com/docs/https-notification-webhooks)  
6. Handling HTTPs Notification Webhook \- Midtrans Docs, diakses Mei 26, 2026, [https://doc-midtrans.dev.fleava.com/en/after-payment/http-notification](https://doc-midtrans.dev.fleava.com/en/after-payment/http-notification)  
7. Integration: E-Wallet \- Midtrans Documentation, diakses Mei 26, 2026, [https://docs.midtrans.com/docs/coreapi-e-money-integration](https://docs.midtrans.com/docs/coreapi-e-money-integration)  
8. Environment variables / $env/static/private • Svelte Tutorial, diakses Mei 26, 2026, [https://svelte.dev/tutorial/kit/env-static-private](https://svelte.dev/tutorial/kit/env-static-private)  
9. Using environment variables in SvelteKit (and Vite) \- DEV Community, diakses Mei 26, 2026, [https://dev.to/danawoodman/storing-environment-variables-in-sveltekit-2of3](https://dev.to/danawoodman/storing-environment-variables-in-sveltekit-2of3)  
10. Access Keys \- Midtrans Documentation, diakses Mei 26, 2026, [https://docs.midtrans.com/docs/access-keys](https://docs.midtrans.com/docs/access-keys)  
11. Environment variables / $env/static/public • Svelte Tutorial, diakses Mei 26, 2026, [https://svelte.dev/tutorial/kit/env-static-public](https://svelte.dev/tutorial/kit/env-static-public)  
12. $env/dynamic/public • SvelteKit Docs, diakses Mei 26, 2026, [https://svelte.dev/docs/kit/$env-dynamic-public](https://svelte.dev/docs/kit/$env-dynamic-public)  
13. $env/static/private • SvelteKit Docs, diakses Mei 26, 2026, [https://svelte.dev/docs/kit/$env-static-private](https://svelte.dev/docs/kit/$env-static-private)  
14. Integration: Card Payment \- Midtrans Documentation, diakses Mei 26, 2026, [https://docs.midtrans.com/docs/coreapi-card-payment-integration](https://docs.midtrans.com/docs/coreapi-card-payment-integration)  
15. Midtrans API Documentation Overview | PDF | Hypertext Transfer Protocol | Json \- Scribd, diakses Mei 26, 2026, [https://www.scribd.com/document/500252756/API-Docs-Midtrans-Com](https://www.scribd.com/document/500252756/API-Docs-Midtrans-Com)  
16. QRIS \- Midtrans Documentation, diakses Mei 26, 2026, [https://docs.midtrans.com/reference/qris](https://docs.midtrans.com/reference/qris)  
17. Sveltekit api endpoints \- Jef Meijvis, diakses Mei 26, 2026, [https://www.jefmeijvis.com/blog/006-sveltekit-api-endpoints?ref=redirect](https://www.jefmeijvis.com/blog/006-sveltekit-api-endpoints?ref=redirect)  
18. SvelteKit API Endpoints And Loading Data For Pages \- Joy of Code, diakses Mei 26, 2026, [https://joyofcode.xyz/sveltekit-loading-data](https://joyofcode.xyz/sveltekit-loading-data)  
19. Advanced Features \- Midtrans Documentation, diakses Mei 26, 2026, [https://docs.midtrans.com/docs/coreapi-advanced-features](https://docs.midtrans.com/docs/coreapi-advanced-features)  
20. svelte-qrcode \- NPM, diakses Mei 26, 2026, [https://www.npmjs.com/package/svelte-qrcode](https://www.npmjs.com/package/svelte-qrcode)  
21. svelte-qrcode-image \- NPM, diakses Mei 26, 2026, [https://www.npmjs.com/package/svelte-qrcode-image](https://www.npmjs.com/package/svelte-qrcode-image)  
22. Castlenine/svelte-qrcode: QR Code generator for Svelte & SvelteKit, with no dependencies \- GitHub, diakses Mei 26, 2026, [https://github.com/castlenine/svelte-qrcode](https://github.com/castlenine/svelte-qrcode)  
23. Handling Midtrans Callbacks in Laravel | by Rizky Purnawan Dwi Putra | Medium, diakses Mei 26, 2026, [https://medium.com/@rizky.purnawan/handling-midtrans-callbacks-in-laravel-2f433949b9a2](https://medium.com/@rizky.purnawan/handling-midtrans-callbacks-in-laravel-2f433949b9a2)  
24. Midtrans and Laravel 8 Integration Using Snap: Part 2 \- DEV Community, diakses Mei 26, 2026, [https://dev.to/martinms/midtrans-and-laravel-8-integration-using-snap-part-2-4d53](https://dev.to/martinms/midtrans-and-laravel-8-integration-using-snap-part-2-4d53)  
25. Handle After Payment \- Midtrans Documentation, diakses Mei 26, 2026, [https://docs.midtrans.com/docs/handle-after-payment](https://docs.midtrans.com/docs/handle-after-payment)  
26. Advanced Feature \- Midtrans Documentation, diakses Mei 26, 2026, [https://docs.midtrans.com/docs/snap-advanced-feature](https://docs.midtrans.com/docs/snap-advanced-feature)  
27. Crypto | Node.js v26.2.0 Documentation, diakses Mei 26, 2026, [https://nodejs.org/api/crypto.html](https://nodejs.org/api/crypto.html)

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAABQCAYAAACksinaAAASW0lEQVR4Xu3daagt2VmH8RVUUDROLWlFY6dFAw4oDm3sONAOAcUBsSMqggqCCkY/2DgSpUH8EBTnKA7hqiAaNUGRJn6QuIkQRcGo2LQ4YCsmghJFUSGKw3lu1b/3e96z9nD2Pffec2+eHyx616rau2rVWrXWW6vq3B5DkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkqRr4j3O0j/3TI0POkvfXpY35bOuh088S19Yln++fNb94z/KZ+v48h7sGfebZ87S/41lMNMW54RUO8l73Y2xLRfpfc6vvum3z9I7euZ94IvO0h/0zCv0p2N7Xu+EDxnLvl7XVxTHHlMP2P62fNat+Zyz9F/jcB0c0gO2Tfms+0cP2N6rLB/yd2N7vf93W1f91thu9/dn6XfH0le8reTzW798lr5h/Vzzk5L3qeOirDuU/nDdvv5e9sPNdZZfsm63z0eOZdtdKGfdTx//6v7+p+Q/sS6/51l6t7GMIzmHl3Elv5MD/LC+4g6iM7puuFA4L/dDwEYwTlk+b13+o3W5342865pfB+/7BeW63TcltONLXXy3gLpkX//QVzTHHNPtCtjq4HNZlx2srrtDdXCIAdu9i3o7doy7lYANfOc1Y2lvH9zWxe+PZf3s+iRv1lbpH2b53AiT/wMtv/e3mzWvnofHx/n+K31Vn1lkO/IJcvZ5aizbPdpXNCnjbGKCG+G6f4K6XhYwsTE7H7tc1e/c9O494w47tjHfSfdTwEY5vrcsb9a87hVj3qjudZTr2Z55GxwTHF2l9+0ZE8cc0+0K2A7td5+nx+UHq+vsVs4FDNjuXT86jh/jriJge3gs7Y0AZuZjxrL+KgI2ZN3Hr8scc2bOYjOWbfp5qDOBuwI27CtPpEx93x3bJFD64baOvrDu/1vGvNyJD451Vb9z133JuFiJ18H9FLD1RsldzayR/Mua7jdcoF/ZM2+DY4KjO+2YY7odAdsx+90lM72XHayus1PPRRiw3bv+dxw/xl1FwMb1/OyYtzmCOSS46U4J2J43lnWZsWL/37ddfdNmLNv081CP4VDAtq9fIgj9pbGddNgn+2Q7ErNq0QO2lLs/jcKh/VSX+p2vGkthKdRbxnaDBCUkDjQ+a8177Vjev+DZNs+yyXu/9b8kOpA3n6U3nqV/PEtv4MsF3/3Bs/TycX6/YH/5nZrAsWY5Fdy3qXm/MJZInc+Pl/WvXtcluv38su6QHrDV/deGQ7n+dSxlZF0qv5Yhx5wGSZo1yjuF/fe7lTz//7SWfz+gXLNZZDoa6u53xrb+OA+Ruvris/SfY+l463sP3zqWNv7T63Zfvf63evGal9/P3d9mXSbRLrl++Hxo2h/1uu2d2DHH1J0asHGXyvX12Fj2mY5wM7bHlxTp3L/jLH3z+vmVZX3/Hil9UwaTenzZph4/v0e56e9yHV7G94/lO/RdP3GW/un86pvrXjWWm4B+/OAdFfJ//Sz9+Vl6/brc8T4N5+A3xrK+v1NT3UrAltkE+hzqifRDY9tnkjIzwXs+bB8py5eP5ft8Ji+eGcsMUt6prHXDfh4b28f3x7YrMJZw7rhu+P1eB6nXzVjO4VvXZfaJjEvk9XEpZeIaoVy9TDknaVO1305bzLngvD0ylv0yXpKXa3jfGLfLVQVseQT34+dX3+xnkGPvTgnY8Paxf/1mLOt7wFbtCtgY0+t5nWGigRs9sG0PGKta7tTJQ+tyD9jSXyX9yJiPJYdc6nfYgC/E7LlxDdhYprMLBioek31CyWMb8utJJI+Ari7/dVnm2fnnlmVw4c0qkYuA79d1N9a8KieA4+C/RNlgVqlu++lt+ZAesPFyYH9p/c/G+cpPpcRsupNOfl/DoxJTpkOpvhh5GXz30Zb3a2t+bSf3i14HwfmrA33q66F1+fnrcu4c63n7tnW5SpAUL1iX04bTPrj5QQY5bojA54fXz8eg7dVB8JhjmjklYOOdV4LYql4LmzHfbwbvBAWUl+Xa33DNkTcbrJiR78e3Gdvjz+xcte8F7C79Rjr/9I85Fo77hevnoB/MdZN+iLqIDJ4VAchfluVfGfuv51MDNl6FqPt+eiz7fpexLQdBGtvQRxLApL2nLLUPzvkAN3e8tB6cs9QN6+rMRV13DPZRj5vP9MFVbqJesi6n76zjEsdB3gesy/vK1Meyek3kXa06Tua8fWfJY5m+NBK0zca4masK2EAQU88h5+AV62fyrzJgo273rd+Mw+ch9fA3Y+m36h8I7OsXiU1qO2R72sAutdwfPs5v3wM2fODYHkdN+8bxmaN/h0zuFOOl5XMaVA/YakOhMvqjQbZ5apJXK+RlY+kYgkqvd2/gt2eVmMqr62aNhuXZi9fk93317+5TAzbuvmoHHKxn9q7n1T/gYJlOMLgjvRsSLOxL3CV1XOD/vqaPGEt98JdvnFsuqgTk/JURyzR2/rqooiM9ZtCsd7noDfmhtgwG+gd6ZjOrd8pFfr/L4WLOY+G0gX63lnPZ238CjWBw7PvmfKW95to79XEt104GwWOPaeaUgC3XJ9d41Bnszdi9X46J4w22+9myvC9gY10/Ptpcjj91VtvSZ5fPh/DdTctjlhQPjnmZ2H9mMnb91VfNy2w2wWt83JpXb3irUwM22nMPAvrxbSZ52FcWBsnU08eWdSkT63j6UOu5lvcQBtI6JlHn/VgoVx+Y2ab2+z1g2lemGhCyXK+JtPd6TJs1r2K5ts++/0N6Xc2ugX34To4xs4fBZEadhbquARtliLTXTyp5HX15HWMTqCZI73q5b4xle8abWcAWjDOMg2xLyo3NZR38nUyJJ31UWbcrYKt3Rwzk9VER+olNXq+QF43tX6WQNnXluJqAbdPyUqZZOlY6/m9c//vQ+dU39d9Oqh0TlZEAgIuFQfxuItjaFeDy6KF6dJyfUmcmqNZHP5/Uz6wuv34s2+4ajCIDQK8rzidT+f1CI0BEZhHq4FD148SuDqbm16C9yuBaO3T04KiWpSdctjPvONYMDsce08wpARuYEUp5mO1gEI/Nmr8L/Un9fu1LbiVgw1+M8+e69mWHzM5hzPofkP9v6+dav1XNy+/MEvU4c2rA1m8aCOj78W0medhXFq5Jrrd67FyjuUHft+5Y3Ez93Dj/O1UPRsE2tS31a2z2O+j5fD4lYON4avvs+z/kKgM2sG9uNPBMy+/nDqcGbLu+F5tx+DzMAjYc+m3W81oB4wHpT8ayfR/PYlZu+iJmnvcFbFX6mFuV37nwr3RQaTVwSyc2C9hocH+8fs77bN3sxPYKYZln+5kpodI3z61dsK9ZJVKA/nuzRsPypuXlu/34LiODNdOynzzmjytY3wfzLjM5RPtPjvOPfu4G3lMhgOr6uQbnr87+PDIu1m+1K2DjXRQC1z5T1fH4orbDrl9odf/cae8aaPtxYtcfXtAek78rYEvH0vfXgyM+z/YRl+3MO441g8OxxzRzasCGTxnbctb9bNpy5P2h+k4Sy/Va3Rew0Ub68fHdXu4nxvbfP9v1WzOzcxi031mZ2D5ts5+HqHn5ncvUO9ueErDlEeDj6zKfeaxcbdb8bl9Z6rHwmstb1/zaT/aAa9aH7kJwwXceXpfrdRkGbBfxnX6MzKw9uqbgmPq5w67gaDb2Vv38dZtx+DzkHPdxe7Pmz3B+6uNQcOPI9n32NWblfmgs3+GViLp/yj0bkxjPdx3TzKHfOTfGZIYnePaeg5oFbJvyeZfZia0VkpNfJWDj4LIdjTsHWws1a+hPrXkVy5uWBzqHXu4H2vI+Gayz//4+AFju71U8Ni7+I388DqSR0AndTbN3afD8Mc8nqCef1B9zon+H+ptdkASps/bQsQ3BMdPFN9o6zC604LfrtHg12y+DDPn93yoij3cTsStgA/kEv1UPjvI+VJ15Qv5vC7M2fhlcO3VwOOaYZk4J2DjmOvuKWpbNuhzJJ6/XI3k16Moxc1zUQe1n+J1+fE+P7XfZvl9ndOi7grCO/fZ+g3e7uKYzEHSbsX0vkcGRbfLoKer38jv9/H3tWfrQlheU+5SAjUfNh9rXZszLxfGR/7ySx+fkcTzckFapt13XzDGob7atwQp1nry0h1MCtn1lqn9Nz3JtM3lK0MfJXqZdAVsd4/a56oAt73Qy8VCR188dTgnY3jaWdf0VlmozztfDTMaIWn/YrPkzmzGZnRrbWKG/M49ZuUG/3/dPuX+zLEf++PJYh37nuce3uaNlIAw6pMz08F4S6+tjA5aZwqaSSUwz9ulstvnFSd4j6+cEB7USueMlWGTWJlP/N8Yy8wQGm1xIeYGUO2rkTpH0wJoHlvnN7qGxrKsXJtOPx0oQk/LkwnvTc1ts/3qlPi6eNQY6Nbardzh3w5NjOY6uBlOcL+opaBf1eXutT5ZfXhLtoV+QNVhhex7J7sJ30y5onx9d1mF2bsELwX2QrdjvcxdEQXuobSL1mTKmDfQZCWTb4LzlEV9FXt7zw5eN7WxHAuK0scviGq13l8ceU3dKwMYjsXquMujleksHz4BBSjvgeOt2+UMJ2k5mYAmiyeN64fqvnS71WB/pp5/hpX08uC5X3GmTfwz6Sb7/NSUvjzvB8e77g4Kchzyux5NrXu23+h+I0L/u+9+mcW2cErDlPab05QxG/RrMy/MztJ9aFj5npix/fZ+6rAEt6+p52hXszuSYCZKDOiSPAS7vO/IYvv/hS9pSzK6xfWUKvpP2iOyf4D1m543t6jWZ9vDkutxvqLpbDdjoB3lFpGL/9RrKMfVzB/J6mfDd42J+fofU3z/ucq4+s68oXjou1h8yfiYwe3a76mZ+bSdB38G62veCa5D8GhdEysN5j/Rj31Py8MZx8cZwn6N/hwpnUPqZsT25X7Guo6NmcOZCpsHmQPmnDrJtTQyM4DPfSWSdYIY8Bvc0ut9b80k5KD7zaLbKNvXdL3xBWcedawpN4lizTxKfu3QSSYcaVcX54HfpRHMnR9myr9zF0CFkUCTtawh3G50J7xN2mdGgPinLrk6FziCdJXqZqJ8esHGx0SGS+P7Taz4BefJr5xmcs34cs4CNAbPfPXbvGLtf7P+msa072mutv7SB2s4r/qHI+t2cR1LtaF9T8gnYsBnbay//pMex6vXG4FA7mGOPqTolYON3v2tsZz5I9aYPXPPkU85ZPunFY/vaxY2yzSvXvDeXvMigQnrV2PYFJMpCJ5hlEr9/GQSF9ZruMwdvKOs4lvc+v/pmG+rnJZ9rXfEucfL/quTPnBqwcX7ruagpsy+0ofRrs7qv7ffVJZ82w1iS8YJzlnPBuq9b8/u6Yzwxzn83N+y0pZzf2vfXa6Jer7nG6riEXWWKF43telJuaknsm3pkP9k/dcPv92NC2jepj3HdrQRsKX9uivLdesNBvaRfq3XOfvP95G/W7et56Ikgax+2SR3U367XAcjLJFGOv6IfIO9XxzJepF/L79X+i+VeRs4F5cyxkDebBeaGrY5x/C55ucFK4o/sLuOqfucCZjYYZLsfG8f9pd91Vy+8XWmTja/Iw2N7h3W30Dl/ac9c0QHSiH9qnP+ryX5R0dlsyjLnqpoFbLy/Fjn37I/jqbNz6O+h9bujWcD2pvK5XmjVk+PO/J8OrkIGnn2pB4636pSA7V7Uz2NPm+e2vH5OCdhyw9ofyYMBrc4g3Sm0rX7ee3pndisBm+6O3n5n6bZ5wbg4AwbuWnnGq+OkY8Js6vleQIfBHUlmGJgho/MnqOMxMOVL8PDgWB5L8TiDaWf+t0nMir5lXQ9mGgjKXjcuzlqAd0jef/3MXVS2YX/sh+/yG+nE6iwIqQeLFbM6s0ebuhiwbcpnXQ89YOs3UzPcGHFdcGdf8fiV/Je1fN19PWCTDvrJsVzQ/KUoU8cM2vxXx6OT5OIjyJjd4d4LeCQNBgsCKAaA241HOOzrhX3FLcrgdSfKcK8xYLv+TgnYwE1PHlm+diyvePD5M+pGujYM2CRpLIHzvhe731nxzpYB2/XGjPYpAZvuLW8vn61jSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSVfg/wFePsv/r1T8LgAAAABJRU5ErkJggg==>