<!--
  ============================================================
  FILE: routes/(auth)/+layout.svelte
  TUJUAN: Layout KHUSUS untuk halaman autentikasi (login, lupa password, set password).
  
  MENGAPA ADA LAYOUT KHUSUS?
    Halaman auth TIDAK BUTUH Sidebar dan TopBar (tidak ada navigasi).
    Layout ini sengaja KOSONG — hanya merender konten halaman itu saja.
    Ini adalah pola "bare layout" (layout polos tanpa ornamen).
  
  HIERARKI LAYOUT:
    +layout.svelte (ROOT — punya Toaster)
      └── (auth)/+layout.svelte (INI — kosong, hanya render children)
            └── login/+page.svelte, forgot-password/+page.svelte, dst
  
  KONSEP ROUTE GROUP:
    Folder (auth) dengan tanda kurung = "route group" di SvelteKit.
    Nama folder TIDAK muncul di URL:
    /login (bukan /(auth)/login)
    Gunanya: mengelompokkan halaman yang berbagi layout yang sama.
  ============================================================
-->
<script>
  // Terima 'children' dari parent (root layout atau SvelteKit)
  let { children } = $props();
</script>

<!-- Render konten halaman login/forgot-password/dll di sini.
     Tidak ada Sidebar, TopBar, atau elemen navigasi lainnya. -->
{@render children()}
