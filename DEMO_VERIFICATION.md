# Pemeriksaan demo petambak

## Revisi proposal dan logo udang

- Acuan terbaru: `Proposal_TambaQu_Terbaru_MAJUON_2026_2027 (1).docx` dan `TambaQu Logo Identity Board.png`.
- 88 tes lulus dalam 20 berkas: 82 tes pada `tmp/identity-regression.log` dan enam tes startup pada `tmp/identity-startup.log`.
- TypeScript dan lint lulus (`tmp/identity-types.log`, `tmp/identity-lint.log`).
- Browser: pilihan tiga kolam/satu kolam besar berubah sesuai tombol; dashboard 360 × 800 dan layanan 390 × 844 tidak mengalami overflow horizontal. Logo serta tema laptop diperiksa pada 1280 × 900.
- Screenshot revisi: `tmp/identity-review/dashboard-laptop.png`, `dashboard-mobile.png`, `services-laptop.png`, `services-mobile.png`.
- Logo aplikasi dirender dari artwork asli; ikon PWA, favicon dan Apple Touch diperbarui. Tidak ada logo hasil gambar ulang AI.
- Build pertama mengalami kehabisan memori pada Rolldown. Pengulangan memakai satu worker setelah server pengembangan dihentikan; log hasil di `tmp/identity-build-retry.log`, pemeriksaan PWA di `tmp/identity-pwa.log`.
- Build ulang dan delapan pemeriksaan artefak PWA lulus; 55 entri precache, sekitar 2 MB. Versi produksi diperiksa di browser tanpa error console yang tertangkap.
- Uji cache aktual: setelah aset produksi termuat, server lokal dimatikan, dashboard dimuat ulang, lalu grafik diganti ke pH. Aplikasi tetap tampil dan dapat digunakan. Bukti `tmp/identity-review/production-cache-reload.png`. Ini uji server tidak tersedia, bukan pengujian putus jaringan pada perangkat fisik.
- Seluruh integrasi eksternal tetap ditunda. Perubahan tema dan penyelarasan proposal tidak menjadi bukti kesiapan hardware atau layanan cloud.

## Pemeriksaan demo sebelum revisi identitas

Tanggal: 24 Oktober 2026. Lingkup terbaru: mockup interaktif lokal; aktivasi layanan eksternal ditunda.

## Lulus

- Pemeriksaan tipe TypeScript dan lint sumber aplikasi.
- Build produksi Vite; service worker dengan 52 aset precache.
- Pemeriksaan enam artefak PWA, ikon, manifest, dan app-shell precache. Ini pemeriksaan build, bukan bukti instalasi pada perangkat fisik.
- 80 tes regresi dalam 18 berkas (`tmp/demo-regression-tests.log`), termasuk modul operasional, penyimpanan offline, konflik, otorisasi dengan database tiruan, presentasi, dan simulator.
- Enam tes startup dalam satu berkas (`tmp/demo-startup-tests.log`) lulus saat dijalankan terpisah: total 86 tes dalam 19 berkas. Tidak ada tes gagal pada kedua hasil akhir tersebut.
- 15 pemeriksaan migrasi/aturan database dalam PostgreSQL tertanam lulus (`tmp/operations-db-check.log`), termasuk isolasi, stok, duplikasi telemetry, dan penawaran. Ini tetap pengujian lokal, bukan aktivasi Supabase.
- Empat tes interaksi khusus (`tmp/demo-interaction-tests.log`): alur masuk demo/daftar, stok pakan dan pemulihan formulir gagal, mulai/stop contoh aerator, serta pengajuan survei lokal.

## Pemeriksaan browser aktual

| Tampilan | Ukuran | Hasil |
|---|---|---|
| Dashboard | 360 × 800 | Konten tidak melebar ke samping, navigasi bawah tersedia |
| Cuaca | 390 × 844 | Kartu dua kolom; filter kolam/siklus yang tidak perlu dihilangkan |
| Dashboard | 768 × 1024 | Tata letak tablet; tidak ada overflow horizontal |
| Dashboard | 1280 × 900 | Sidebar, tiga sensor utama, grafik dan PondBrain terlihat |
| Dashboard | 1920 × 1080 | Tata letak lebar; tidak ada overflow horizontal |
| Dashboard landscape | 844 × 390 | Konten dapat digulir; tidak ada overflow horizontal |

Aerasi: tombol mengubah status simulasi, tidak mengubah kualitas air. Layanan: tombol survei menampilkan keberhasilan contoh dan mencegah klik berulang. Pakan: catatan uji sebelumnya masih tampil setelah navigasi/reload (stok 176 kg); input 999 kg sebelumnya ditolak dan formulir tetap terisi. Tidak ada error console yang tertangkap pada pemeriksaan tab akhir.

Screenshot aktual: `tmp/demo-farmer/dashboard-laptop.png`, `dashboard-mobile.png`, `dashboard-tablet.png`, `dashboard-wide.png`, `dashboard-landscape.png`, `weather-mobile.png`, `services-laptop.png`, dan `feed-laptop.png`.

## Batas pemeriksaan

- Tes startup lengkap dipisah setelah proses regresi awal tertahan; keenam tes akhirnya lulus.
- Reduced motion mengikuti aturan CSS yang tersedia; pemeriksaan preferensi tersebut pada sistem operasi belum diulang pada revisi ini.
- Belum diuji ulang: pemasangan PWA dan putus jaringan pada build produksi di perangkat fisik, audit aksesibilitas menyeluruh, serta performa animasi dengan profiler.
- Supabase staging, login/email nyata, pembayaran sandbox, AI daring, undangan email, firmware dan bench test tidak diaktifkan atau dinyatakan lulus. Endpoint dan rancangan migrasi yang disiapkan tetap memerlukan verifikasi sebelum aktivasi.
- Tes otorisasi tiruan bukan pentest terhadap layanan aktif.

Panduan mencoba: [DEMO_PETAMBAK.md](./DEMO_PETAMBAK.md).
