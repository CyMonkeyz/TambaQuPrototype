# Workflow perombakan TambaQu

## Status implementasi

Versi 0.7.0-pilot memperkenalkan ruang kerja `/pilot` dan pratinjau lokal `/pilot-demo`.
Demo kompetisi lama di `/app` tetap terpisah. Akun nyata tidak memakai sesi demo Zustand.
Kode UI, migrasi, endpoint, dan simulator sudah tersedia. Ini belum merupakan bukti
kelulusan operasional produksi: Supabase dan Midtrans belum dimiliki pengguna,
sehingga pengujian layanan nyata, email, RLS di database, dan pembayaran belum berjalan.
Tidak ada secret pengguna yang ditulis ke repository.

| Fase | Keluaran dalam kode | Gerbang yang masih harus dilewati |
|---|---|---|
| 1 Audit | Pemeriksaan build, tes, dependency audit, pemisahan demo | Rekam konfigurasi cloud aktual |
| 2 Desain | Brand tokens, navigasi ponsel, ruang pilot ringkas, reduced motion | Uji usability tiga calon pengguna dan seluruh ukuran layar |
| 3 Akun | Login, reset, undangan owner, membership per tambak, ganti password | Proyek Supabase, SMTP, tes aktivasi dan dua akun nyata |
| 4 Operasional | Kolam, pembacaan parsial, tindakan, cache/outbox per akun | RLS runtime, dua perangkat, expired-session dan offline produksi |
| 5 Hardware | Registrasi/revoke token, telemetry idempotent, poll/ack, simulator | Tes API cloud, pairing sekali pakai, rotasi token, ESP32 fisik |
| 6 Modul | Cuaca BMKG, aturan PondBrain, foto-ke-teks, DeepSeek, catatan pakan/biaya/panen, konfigurasi, simulasi kendali | Evaluasi AI/foto nyata, parameter budidaya terverifikasi, konfigurasi pengaman lokal |
| 7 Sewa | Katalog, kontrak/persetujuan paket, invoice atomik, checkout, verifikasi webhook, pembatalan akhir periode | Merchant sandbox, katalog/kontrak resmi, recurring job, rekonsiliasi/refund dan instalasi layanan |
| 8 QA | Tes aturan, input, offline, existing suites; staging pentest script | Pentest authenticated, load test, screen reader dan instalasi perangkat nyata |
| 9 Rilis | Build PWA dan panduan penerapan | Hosting yang dapat diakses, monitoring, restore drill dan pengguna pilot |

Modul pakan saat ini mencatat rencana/realisasi yang diberi keterangan pengguna;
belum menghitung dosis biologis. ProfitLens hanya menjumlahkan biaya dan pendapatan aktual;
belum menyediakan prediksi laba/FCR. PondConfig/cluster dan kunjungan saat ini berupa
catatan terstruktur awal, belum workflow persetujuan multi-pihak. Hal-hal ini perlu
diselesaikan sebelum mengklaim seluruh rancangan bisnis telah berjalan penuh.

## 1 Menjalankan lokal

1. Gunakan Node 22 atau lebih baru, lalu `npm ci` dan `npm run dev`.
2. Buka `/login`, pilih **Jelajahi tampilan baru**. Data pratinjau hanya di IndexedDB lokal.
3. Tambah kolam, catat air, lihat PondBrain/Peringatan, catat tindakan, pakan dan biaya.
4. Layanan cloud sengaja tidak dipalsukan dalam pratinjau. Tombol cloud memberi penjelasan
   ketika akun/backend belum tersedia.
5. `.npmrc` menetapkan legacy peer resolution karena npm Arborist yang terpasang gagal
   memecahkan peer opsional Vitest. Peer runtime `react-is` dan testing DOM dicantumkan eksplisit.

## 2 Mengaktifkan Supabase

1. Buat proyek staging Supabase. Simpan project URL dan public anon key pada `.env.local`
   mengikuti `.env.example`. Key ini bukan service-role key.
2. Jalankan migrasi `supabase/migrations/202610220001_pilot.sql` melalui CLI Supabase
   (`supabase link --project-ref <ref>`, `supabase db push`). Migrasi belum pernah diterapkan
   pada database pengguna. Periksa hasil SQL pada staging sebelum produksi.
3. Di Auth, nonaktifkan pendaftaran publik, aktifkan email/password, dan atur SMTP,
   Site URL serta redirect allowlist yang menunjuk `/login` pada origin staging.
4. Buat/undang pemilik pertama melalui Dashboard Auth. Masukkan satu baris `farms`, lalu
   baris `memberships` dengan UUID pengguna pemilik, UUID tambak, dan role `owner`.
   Bootstrap ini dikerjakan administrator; tidak tersedia endpoint publik membuat pemilik.
5. Deploy `supabase functions deploy pilot-api`. `verify_jwt=false` diperlukan karena
   webhook dan perangkat bukan sesi pengguna. Setiap operasi pengguna tetap memanggil
   `auth.getUser` dan memeriksa membership sebelum mengakses data.
6. Atur secret backend menggunakan Dashboard/secret manager: `APP_ORIGIN`,
   `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, dan secret Midtrans. Supabase menyediakan
   `SUPABASE_URL`/service-role pada runtime. Jangan menyalin secret ke variabel `VITE_`.
7. Login sebagai pemilik, ubah kata sandi bila perlu di **Tim & akun**, lalu undang operator
   dan Pondivator. Saat ini undangan API hanya menerima alamat yang belum terdaftar;
   penugasan akun yang sudah ada memerlukan administrator.
8. Uji akun tanpa membership, akun tambak lain, serta semua peran sebelum memasukkan data nyata.

## 3 DeepSeek Flash dan pembacaan gambar

- Endpoint resmi: `https://api.deepseek.com/chat/completions`; model `deepseek-flash`.
- Gambar dikirim sebagai `image_url` berisi data URL. Terima JPEG/PNG/WebP maksimal 4 MB;
  backend memeriksa signature berkas, bukan hanya ekstensi/MIME dari browser.
- Foto tidak ditulis ke database atau log aplikasi. Penyedia AI menerima gambar selama
  pemrosesan; kebijakan retensi penyedia tetap berlaku di luar kendali aplikasi.
- Hasil menyimpan transkripsi, konteks visual, observasi angka/satuan, tabel dan hubungan
  kolom, serta daftar ketidakpastian. Sistem tidak menjanjikan OCR tanpa kesalahan.
- Pengguna dapat mengoreksi teks, konteks, dan detail JSON, lalu menyatakan telah memeriksa
  hasil sebelum menyimpan. Gambar dilepas dari state setelah ekstraksi berhasil.
- Percakapan berikutnya memakai teks/konteks tersimpan, bukan mengirim ulang foto.
  Konteks dibatasi ke 15 catatan terbaru milik tambak yang diizinkan. Jika terlalu panjang,
  permintaan ditolak dengan pesan, bukan memotong tabel/teks diam-diam.
- Batas awal AI 20 permintaan per pengguna per jam dan timeout 45 detik; gunakan kuota
  pengeluaran penyedia di luar aplikasi untuk batas biaya keras. Tidak ada flag API
  `uncensored` yang dipasang; gunakan kemampuan resmi penyedia.
- Uji foto buram, terpotong, tabel, tulisan tangan, angka desimal, campuran bahasa, kegagalan
  upstream, respons terpotong dan prompt injection. Uji ini masih memerlukan layanan aktif.

## 4 Hardware dan simulator

1. Pemilik memilih kolam lalu **Perangkat → Daftarkan ke kolam**. Token hanya tampil sekali.
   Database hanya menyimpan hash. Ini provisioning langsung untuk pilot, belum pairing berkode.
2. Simpan endpoint function ke `TAMBAQU_DEVICE_ENDPOINT` dan token ke
   `TAMBAQU_DEVICE_TOKEN` pada environment lokal perangkat/simulator.
3. Jalankan `npm run simulate:device`; gunakan `TAMBAQU_ONCE=true` untuk sekali kirim
   dan `TAMBAQU_REPLAY=true` untuk menguji deduplikasi.
4. Operasi API: `telemetry`, `poll`, `ack`. Telemetry v1 menggunakan `messageId` UUID,
   waktu ISO UTC, `quality`, dan nilai parameter bernama. Konvensi satuan: suhu °C,
   DO/amonia/nitrit mg/L, salinitas ppt, pH tanpa satuan. Payload tidak memakai ID tambak
   dari perangkat; server mengambilnya dari registrasi token.
5. Contoh telemetry:

```json
{"operation":"telemetry","schemaVersion":1,"messageId":"UUID-v4","measuredAt":"2026-10-22T08:00:00Z","quality":"valid","values":{"temperature":29,"ph":7.8,"dissolvedOxygen":5.2}}
```

6. Token tidak boleh ditanam di firmware yang dipublikasikan. Contoh firmware ESP32 lengkap,
   buffer NVS dan pemeriksaan sertifikat perlu dibuat ketika board/sensor dipilih.
7. Uji command hanya saat online, data perangkat lebih baru dari 3 menit dan role owner.
   TTL 30 detik. Simulator harus acknowledge lalu melaporkan sukses/gagal. Poll menandai
   perintah kedaluwarsa. Perintah tidak dimasukkan antrean offline browser.
8. Operasi fisik ditolak server. Sebelum membuka jalur fisik, implementasikan pengaman lokal,
   interlock, pemeriksaan sensor/motor dan tes kegagalan listrik pada perangkat aktual.

## 5 Sewa dan pembayaran

1. Buat akun Midtrans sandbox dan set secret `MIDTRANS_SERVER_KEY`.
2. Masukkan katalog dan harga yang disahkan ke tabel `catalog`; aktifkan paket dengan
   `enabled=true`. Tidak ada harga contoh yang dijadikan harga produksi.
3. Webhook URL: `<function-url>?operation=payment-webhook`. Uji signature palsu, jumlah
   tidak cocok, event ganda, dan event terlambat. Backend memverifikasi status ke Midtrans.
4. Jadwalkan `select public.generate_monthly_invoices();` sekali sehari melalui Supabase
   Cron. Fungsi tidak tersedia untuk anon/authenticated dan memakai unique period index.
5. Uji seluruh siklus pending → paid, pembatalan akhir periode, invoice gagal/kedaluwarsa,
   serta penundaan pembayaran. Kegagalan tagihan tidak mengendalikan perangkat.
6. Refund dan rekonsiliasi admin, kontrak layanan legal, workflow pemasangan serta kebijakan
   penyelesaian tagihan bermasalah belum lengkap dan merupakan gerbang sebelum transaksi nyata.

## 6 Verifikasi dan rilis

Jalankan `npm run lint`, `npm test`, `npm run build`, `npm run verify:pwa`, `npm audit`,
serta `npx deno check supabase/functions/pilot-api/index.ts`.

Set environment staging lalu jalankan `node scripts/pentest-pilot.mjs`. Script ini hanya
mengecek penolakan kasus negatif tertentu; bukan pengganti pentest lengkap. Tambahkan
`TAMBAQU_TEST_JWT` dan `TAMBAQU_FOREIGN_FARM_ID` dari dua akun/tambak staging untuk tes lintas tenant.

Sebelum rilis: jalankan tes RLS runtime dan webhook, tes dua browser/perangkat, load test
10 tambak × 10 node, audit aksesibilitas, instalasi Android/iOS, update service worker,
backup/restore, monitoring dan evaluasi tiga calon pengguna. Jangan menandai langkah yang
belum dijalankan sebagai lulus.

Proyek Sites lama mengembalikan `project_not_found` pada sesi implementasi ini. Identitas
hosting disimpan tanpa membuat proyek pengganti. Publikasi memerlukan akses proyek yang benar.

Referensi: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[DeepSeek](https://api-docs.deepseek.com/), [BMKG](https://data.bmkg.go.id/prakiraan-cuaca/),
[Midtrans webhook](https://docs.midtrans.com/docs/https-notification-webhooks).
