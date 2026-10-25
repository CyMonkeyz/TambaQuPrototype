# TambaQu — pemulihan dashboard operasional

Pemeriksaan lokal: 24 Oktober 2026. Dokumen ini menggantikan arah landing page pada
`EXPO_WORKFLOW.md`; expo tetap merupakan fitur tambahan.

## Hasil implementasi

1. **Masuk ke aplikasi:** `/` memeriksa sesi, lalu menuju login, dashboard demo,
   atau pilot cloud. Login memiliki satu tombol **Coba Demo**. `/demo` dan
   `/pilot-demo` membuka dashboard operasional tanpa menghapus catatan demo.
2. **Desain bersama:** latar terang, sidebar navy, logo asli, Inter, interaksi teal,
   kartu putih dan penanda aktif. Menu dikelompokkan menjadi Pantau dan Kelola.
   Ponsel memakai empat tujuan utama dan dialog Lainnya. Pilot menggunakan sidebar
   serta token yang sama, dengan akses layanan mengikuti peran akun.
3. **Pemantauan:** enam kartu sensor mengendalikan satu grafik dengan satuan yang
   sesuai. Ringkasan PondBrain ada di samping grafik, diikuti prioritas dan
   peringatan. Rincian monitoring disimpan dalam panel yang dapat dibuka.
   PondBrain tetap memuat kondisi, alasan, rekomendasi, dan riwayat tindakan.
4. **Demo:** skenario, jalankan/jeda dan ulangi tersedia secara ringkas di aplikasi.
   Reset membutuhkan tindakan dan konfirmasi pengguna. Simulator operasional
   memasok sensor, grafik, risiko, rekomendasi dan peringatan dari data yang sama.
   `/expo` mempertahankan cerita lima adegan dan memiliki akses keluar ke dashboard.
5. **Kenyamanan:** memilih sensor tidak menggulir halaman. Penyegaran data pada
   kolam yang sama mempertahankan isi grafik selama pemuatan. Pergantian kolam
   menyembunyikan data kolam sebelumnya. Dialog mengembalikan fokus ke pembukanya.
   Transisi workspace 180 ms dan aturan reduced motion tersedia.

Tidak ada migrasi data atau penggantian API publik, backend, atau penyedia AI.
Ruang demo dan pilot tetap menggunakan provider serta penyimpanan berbeda.

## Verifikasi otomatis yang dijalankan

- `node node_modules/oxlint/bin/oxlint`: selesai tanpa error. Ada satu peringatan
  variabel tidak dipakai pada `tmp/ppt-build/build_deck.mjs`, berkas collateral
  yang tidak diubah dalam revisi aplikasi ini. Lint `src` bersih.
- `vitest run --pool=threads --maxWorkers=1`: **14 berkas, 64 tes lulus**.
  Mencakup perutean login/demo, startup setelah hidrasi, penyegaran grafik,
  simulator, expo, aturan pilot dan penyimpanan offline.
- TypeScript, build produksi, dan `verify:pwa`: lulus. Pemeriksa PWA memvalidasi
  enam artefak, manifest instalasi, dan precache app shell.
- Setelah perbaikan pengembalian fokus dialog, bagian startup, repository hook,
  dan expo dijalankan kembali: **3 berkas, 15 tes lulus**. TypeScript, build dan
  verifikasi PWA juga lulus kembali. Hasil tes tercatat pada
  `tmp/dashboard-refresh-final-regression.log`.

Percobaan awal suite mengalami timeout saat penyiapan IndexedDB buatan. Batas
penyiapan fixture dinaikkan menjadi 30 detik, terpisah dari batas kesiapan UI.
Suite lengkap berikutnya lulus. Pengujian memakai satu worker untuk mengurangi
beban mesin lokal.

## Pemeriksaan langsung di browser

| Ukuran | Pemeriksaan | Hasil |
| --- | --- | --- |
| 360 px | Dashboard dan navigasi bawah | Tidak ada overflow horizontal dokumen |
| 390 px | Dashboard, login, PondBrain, detail kolam, dialog Lainnya | Tidak ada overflow horizontal dokumen |
| 768 px | Dashboard, susunan kartu, navigasi bawah | Tidak ada overflow horizontal dokumen |
| 1280 px | Dashboard, login, detail kolam, PondBrain dan sidebar | Tidak ada overflow horizontal dokumen |
| 1920 × 1080 | Dashboard, enam sensor dalam satu baris, sidebar dan grafik | Tidak ada overflow horizontal dokumen |
| 844 × 390 | Dashboard landscape | Tidak ada overflow horizontal dokumen |

Alur yang benar-benar dicoba:

- Keluar dari demo → login dengan satu tombol Coba Demo → dashboard.
- Memilih pH mengubah judul dan label grafik menjadi pH.
- Membuka PondBrain, mengonfirmasi tindakan, memeriksa riwayat dan detail kolam,
  lalu membuka laporan melalui Lainnya. Catatan tetap ada setelah keluar/masuk.
- Menjalankan dan menjeda skenario: DO, skor risiko, rekomendasi, dan peringatan
  berubah bersama. Tidak terjadi penggantian seluruh dashboard dengan skeleton
  pada penyegaran skenario setelah data awal termuat.
- Membuka Mode Presentasi dari sidebar dan keluar kembali ke dashboard.
- Dialog Lainnya: fokus awal pada tombol tutup, Escape menutup dialog, fokus
  kembali ke tombol Lainnya setelah perbaikan.
- Pemuatan awal/reload menampilkan skeleton sebelum data tersedia.

Log browser mencatat dua peringatan React selama hot reload ketika dependensi
hook sedang diedit. Setelah reload dan alur verifikasi, tidak ditemukan error
runtime aplikasi tambahan. Ini bukan pengukuran performa frame secara kuantitatif.

## Bukti visual

Screenshot tersimpan di `tmp/ui-refresh/`:

- `login-laptop.png`, `login-phone.png`
- `dashboard-laptop.png`, `dashboard-phone.png`, `dashboard-final.png`
- `dashboard-360.png`, `dashboard-390.png`, `dashboard-768.png`,
  `dashboard-1280.png`, `dashboard-1920.png`
- `pond-detail-laptop.png`, `pond-detail-phone.png`
- `pondbrain-laptop.png`, `pondbrain-phone.png`

Screenshot ukuran tertentu merupakan snapshot saat pemeriksaan; `dashboard-final`
menunjukkan hasil setelah penyederhanaan panel monitoring dan skenario dijalankan.

## Gerbang yang belum dinyatakan lulus

Pengujian ini tidak mengaktifkan Supabase, transaksi pembayaran, AI nyata atau
hardware fisik. Ikuti `PILOT_WORKFLOW.md` untuk gerbang integrasi tersebut.
Belum dilakukan instalasi PWA pada perangkat fisik, pemutusan jaringan browser
pada build produksi, pembacaan screen reader, pengukuran kontras menyeluruh,
atau emulasi reduced motion di browser. Logika offline memiliki tes regresi;
aturan reduced motion diperiksa pada kode, bukan diklaim telah diuji perangkat.
Tampilan pilot dengan data cloud nyata, serta loading/error/offline cloud,
masih memerlukan proyek Supabase yang dikonfigurasi.

Publikasi Sites belum dilakukan: proyek tersimpan mengembalikan `NOT_FOUND`.
Pratinjau lokal tersedia melalui server pengembangan; kode tidak dipublikasikan
ke tujuan pengganti tanpa proyek yang benar.
