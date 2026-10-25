# Expo interaktif TambaQu

## Status dan batas produk
Rilis ini adalah demo lokal PWA, bukan sistem produksi. Tidak memerlukan proyek Supabase, server database, payment gateway, akun merchant, atau perangkat fisik. Harga, sensor, rekomendasi, kendali aerator, dan pembayaran adalah simulasi. Jangan memakai password pribadi, data kartu, atau data budidaya sensitif.

## Menjalankan
```sh
npm ci
npm run dev
```
Buka alamat Vite. Pilih **Belum punya akun? Daftar**, masukkan nama, email, password khusus demo 10–128 karakter, dan konfirmasi. Email tidak diverifikasi atau dikirimi pesan. Akun yang telah terdaftar di browser yang sama dapat masuk kembali. `/demo`, `/expo`, `/pilot`, dan workspace `/app/*` tidak menyediakan login otomatis atau jalur tamu.

## Backend internal
- `src/services/localAuth.ts`: akun dan hash PBKDF2-SHA256 210.000 iterasi dengan salt acak di IndexedDB. Password plaintext tidak disimpan.
- Token sesi acak 256-bit di sessionStorage, hash token di IndexedDB, masa berlaku 12 jam. Refresh mempertahankan sesi; logout mencabutnya. Browser atau tab baru memerlukan login. Ini pembatas akses demo, bukan jaminan keamanan server.
- `src/operations/repository.ts`: pencatatan lokal operasional, dengan database dipisahkan menurut akun lokal. Monitoring contoh berasal dari fixture simulasi bersama; bukan tambak sungguhan.
- `src/services/localBilling.ts`: pemilihan modul, periode bulanan/tahunan, jumlah kolam, total, checkout idempoten, invoice, dan riwayat per akun.
- Cloud lama dipertahankan di source agar perubahan sebelumnya tidak dihapus, tetapi default nonaktif. Variabel URL/key Supabase lama saja tidak mengaktifkannya. Jangan mengaktifkan `VITE_ENABLE_LEGACY_CLOUD` untuk expo.

Akun dan catatan tidak tersinkron antarperangkat atau antar-origin. Menghapus data situs dapat menghapus akun dan catatan. Bantuan masuk menjelaskan batas ini; tidak ada pemulihan password melalui email.

## Alur expo
1. Daftar atau masuk dengan akun lokal.
2. Pilih kolam, parameter, grafik, peringatan, dan rekomendasi di dashboard.
3. Gunakan **Semua fitur** untuk catatan pakan, bioflok, biaya/hasil, aerator, cuaca, survei, pendampingan, serta tim.
4. Tambahkan catatan melalui form. Validasi menolak input di luar domain. Catatan yang mendukung perubahan menyediakan tombol Ubah dengan identitas catatan.
5. Buka **Langganan & Tagihan**, pilih modul, periode, dan jumlah kolam. Harga ilustratif tampil sebelum konfirmasi.
6. Konfirmasi pemahaman demo, lalu pilih pembayaran berhasil/gagal/menunggu. Menunggu tidak berubah menjadi berhasil setelah refresh; hasil akhir dipilih secara eksplisit.
7. Lihat dan unduh invoice `.txt` berlabel demo. Langganan aktif/menunggu harus dibatalkan sebelum checkout lain. Pembatalan memerlukan konfirmasi dan berlaku langsung dalam demo, tanpa refund nyata atau perpanjangan otomatis.
8. Keluar. Direct URL workspace kembali ke login.

Pembayaran tidak meminta nomor rekening, nomor kartu, CVC, OTP, atau uang. Invoice bukan kuitansi/faktur pajak. Simulasi subscription tidak mengaktifkan atau mematikan perangkat fisik.

## Pemeriksaan rilis
```sh
npm test -- --maxWorkers=1
npm run lint
npm run build
npm run verify:pwa
npm audit --omit=dev
```
`--maxWorkers=1` menghindari startup worker paralel yang tidak stabil pada host pengujian ini.

Uji browser Chrome headless lokal mencakup 88 pemeriksaan: guard lima jalur masuk, daftar/login/logout, password salah, reload, 17 route operasional, tidak ada kontrol presentasi, tambah/ubah catatan pakan dengan persistensi, persetujuan checkout, pending lalu berhasil, invoice/unduhan, pembatalan serta pembayaran gagal, dan overflow pada viewport 360/390/768/1440. Hasil runtime tidak menunjukkan uncaught page error pada run tersebut. Ini bukan klaim seluruh kombinasi tombol/perangkat telah diuji atau audit keamanan produksi.

## Deployment
Vercel menggunakan `npm run build` dengan output `dist`; `vercel.json` menyertakan deep-link SPA, header dasar, dan cache policy service worker. Setelah push, periksa commit remote, status deployment, URL produksi, serta guard `/app/billing` tanpa login. Push GitHub saja tidak membuktikan deployment berhasil.

Dokumen pilot, presentasi, dan panduan demo sebelum rilis ini adalah riwayat. Petunjuk masuk tamu, mode presentasi, dan konfigurasi Supabase di dokumen lama tidak berlaku untuk expo lokal ini.
