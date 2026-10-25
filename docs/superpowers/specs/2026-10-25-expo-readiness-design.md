# TambaQu: kesiapan demo expo interaktif

## Tujuan dan persetujuan
Wildan menyetujui desain percakapan: login wajib, pengalaman operasional tunggal tanpa mode presentasi, input interaktif tersimpan lokal, subscription dan checkout simulasi, perbaikan visual PWA, pengujian sebelum push GitHub dan pemeriksaan deployment Vercel. Dokumen ini merinci desain tersebut untuk ditinjau sebelum implementasi. Produk yang dihasilkan adalah demo expo matang, bukan layanan produksi dengan transaksi atau kendali perangkat fisik.

## Kondisi awal yang ditemukan
- Repository: D:/BelajarCoding/TambaQu; branch main; origin https://github.com/CyMonkeyz/TambaQuPrototype.git.
- React 19, TypeScript, Vite, Tailwind, Zustand, Dexie, Supabase; Vitest tersedia.
- Banyak perubahan tracked dan untracked sudah ada sebelum pekerjaan ini. Tidak boleh dihapus, ditimpa massal, atau dimasukkan commit tanpa pemeriksaan cakupan dan rahasia.
- EntryRoutes.tsx membuat sesi demo otomatis melalui /demo. /expo merupakan entry publik. SessionGuard hanya memeriksa activeUser dan activeFarm.
- LoginPage memakai Supabase untuk akun nyata dan tombol Coba Demo untuk sesi lokal tanpa autentikasi.
- Sidebar, ServicesPage, navigation dan DemoControlPage masih menawarkan mode presentasi.
- Jalur operasi, katalog dan pembayaran sebagian tersedia; dokumentasi menyatakan integrasi cloud/pembayaran nyata belum tervalidasi.
- Baseline terakhir: 88 tes lulus di 20 file, tetapi worker startup timeout; hasil keseluruhan gagal. Lint/build dalam command berantai belum berjalan.

## Arsitektur dan batas kepercayaan
Pertahankan stack dan pola komponen yang ada. Hindari rewrite menyeluruh. Pisahkan mode akun cloud dari akses expo lokal dengan label terlihat pada login, shell dan pembayaran. Sesi lokal adalah pembatas akses demo di browser, bukan autentikasi aman untuk data produksi. Jangan menyimpan password plaintext, token provider, atau data kartu dalam penyimpanan demo. Kredensial akun nyata hanya ditangani provider autentikasi.

Untuk expo gunakan tindakan eksplisit Masuk akun expo di halaman login, bukan entry otomatis dari URL. Pengguna memasukkan nama tampilan untuk memulai sesi expo; tidak perlu membuat password palsu. Nama ini bukan identitas terverifikasi. Kebutuhan wajib login di demo berarti harus melewati langkah masuk eksplisit sebelum membuka workspace. Akun Supabase tetap memakai email/password sesungguhnya jika layanan terkonfigurasi. UI tidak boleh menyebut akses expo sebagai akun terverifikasi.

Seluruh entry workspace demo memeriksa sesi expo yang sah menurut kontrak lokal, bukan sekadar adanya objek user/farm. Entry lama /demo dan /expo diarahkan melalui pemeriksaan sesi; /expo tidak lagi menampilkan panggung presentasi. Logout membersihkan sesi akses, mengarahkan ke login dan mencegah tombol Back menampilkan workspace terlindungi. Data contoh tidak tercampur dengan data akun cloud. Recovery password cloud tidak boleh terhalang redirect sesi umum. Tampilkan pesan jujur jika backend belum terkonfigurasi, tanpa tombol masuk yang diam-diam gagal.

## Pengalaman pengguna dan identitas visual
Gunakan logo/aset merek lokal yang tersedia, biru #0B6E8E dan teal #14B8A6. Dashboard menjadi pusat operasional dengan prioritas kolam, pembacaan inti DO/pH/suhu, tren dan tindakan yang jelas. Navigasi menampung pemantauan, budidaya, perangkat, layanan dan pengaturan dengan pengelompokan yang ringkas; modul yang belum tervalidasi dilabeli simulasi atau rencana.

Hapus menu, tombol, pintasan dan perilaku fullscreen/auto-play mode presentasi dari jalur pengguna. Simulator kondisi tambak boleh tetap ada sebagai kontrol data demo biasa, bukan panggung presentasi.

Setiap halaman memakai heading, hierarchy, kartu, jarak, typography, badge dan tombol konsisten. Desktop dan ponsel menyediakan akses navigasi lengkap, fokus keyboard terlihat, label input, kontras memadai dan dukungan reduced motion. Modal memiliki nama, fokus, tombol batal/tutup dan perilaku Escape yang sesuai. Tidak ada overflow horizontal pada viewport target 390, 768 dan 1440 px. Chart harus memiliki ukuran kontainer valid dan keadaan data kosong.

## Input dan persistensi
Audit setiap route dan kontrol interaktif yang dapat diakses. Implementasikan alur demo end-to-end untuk kolam, pengamatan air, catatan tindakan, pakan/biaya/panen sesuai modul yang telah tersedia. Form menolak input wajib kosong, angka non-finite dan nilai di luar domain yang masuk akal; pesan kesalahan muncul di dekat bidang dan tidak menghapus input. Editing dan penghapusan memakai ID stabil; penghapusan data penting membutuhkan konfirmasi. Hasil perubahan terlihat di daftar dan ringkasan terkait serta bertahan setelah reload pada browser yang sama.

Data contoh/sintetis selalu dapat dibedakan dari pengukuran nyata. Simulasi aktuator hanya mencatat atau mengubah state demo; tidak boleh memanggil hardware. Rekomendasi PondBrain pada demo tidak diklaim berasal dari model prediktif teruji. Sediakan reset data expo yang terkonfirmasi; reset tidak boleh menghapus akun/cloud data. Kegagalan storage ditangani dengan pemberitahuan, bukan sukses palsu.

## Subscription dan pembayaran simulasi
Alur: katalog paket -> pilih modul/periode -> ringkasan -> persetujuan -> invoice demo -> pilih metode -> simulasi hasil -> riwayat/detail invoice dan subscription. Paket mengikuti Core Monitoring, Smart Oxygen, BioflocCare add-on dan Cluster Service pada proposal; harga adalah asumsi demo yang ditampilkan jelas, bukan tarif resmi. Perincian biaya dan periode memakai satu sumber data agar total konsisten.

Metode simulasi berupa QRIS dan transfer virtual account tanpa koneksi transaksi sungguhan, tanpa input nomor kartu/CVC atau informasi perbankan rahasia. QR/gambar jika ada dilabeli tidak untuk dibayar dan tidak berisi instruksi pembayaran ke rekening riil. Hasil mencakup pending, berhasil simulasi, gagal dan kedaluwarsa; subscription aktif hanya setelah hasil berhasil. Klik ganda tidak membuat invoice atau aktivasi ganda. Refresh tidak mengubah pending menjadi berhasil. Pembatalan subscription menjelaskan apakah berakhir saat ini atau akhir periode; desain memakai akhir periode dan dapat dibatalkan sebelum efektif. Perubahan billing tidak mematikan proteksi/perangkat.

State invoice dan subscription tersimpan lokal terpisah dari pilot cloud, dengan label SIMULASI di detail dan bukti unduhan jika disediakan. Jalur pembayaran cloud yang ada tidak diaktifkan atau diberi kunci baru tanpa konfigurasi dan pengujian terpisah. Tombol yang memerlukan backend nyata harus menjelaskan prasyarat atau menawarkan simulasi secara eksplisit, bukan mengklaim transaksi telah diproses.

## PWA dan offline
Pertahankan manifest, icon, installability, SPA deep links dan mekanisme update. Cache tidak boleh membocorkan sesi atau data antar akun. Aplikasi yang sudah dimuat dapat memakai data expo lokal saat offline; login cloud dan layanan eksternal menampilkan batas koneksi secara jujur. Loading, empty, error dan offline state harus terlihat dan dapat dipulihkan. Verifikasi artefak PWA setelah build.

## Strategi pengujian dan kriteria selesai
1. Buat inventaris route/fitur/kontrol dan catat hasil pemeriksaan, bukan klaim semua tombol hanya berdasarkan build.
2. Tes route tanpa sesi, akses expo eksplisit, reload, logout/Back, serta recovery cloud melalui mock tanpa meminta secret.
3. Tes validasi input, tambah/edit/hapus dan persistensi, reset terisolasi serta kegagalan storage.
4. Tes state machine billing: total, pending, sukses, gagal, expiry, double-click, reload dan pembatalan akhir periode.
5. Jalankan suite dengan konfigurasi worker yang stabil; catat jumlah tes, exit code dan kegagalan tersisa. Jalankan lint, typecheck/build, verify:pwa dan dependency audit secara terpisah agar kegagalan tidak menyembunyikan hasil tahap lain.
6. Jalankan aplikasi dan uji browser alur login -> dashboard -> input -> reload -> paket -> checkout -> hasil -> invoice -> logout. Periksa console/runtime, link mati, mobile/desktop screenshots dan overflow. Catat perangkat/ukuran yang benar-benar diuji.
7. Lakukan review diff akhir, cek rahasia dan aset/sampah yang tidak boleh dipublikasikan. Pengujian cloud fisik, merchant nyata, iOS/Android fisik dan keamanan produksi tidak diklaim selesai jika tidak dijalankan.

## GitHub dan Vercel
Sebelum perubahan kode simpan inventaris baseline/diff dan perlindungan perubahan lokal yang ada; jangan reset/stash destruktif atau force-push. Stage hanya source, aset runtime dan dokumentasi yang diperlukan setelah review, bukan output, cache, pitch deck, kredensial atau direktori tmp secara membabi buta. Jika perubahan sebelumnya diperlukan untuk build, review dan sertakan secara eksplisit, dengan catatan asal baseline.

Push ke origin hanya setelah pemeriksaan rilis lulus dan review akhir. Izin push diberikan pengguna dalam permintaan. Verifikasi commit remote yang persis sama setelah push. Temukan URL Vercel dari konfigurasi yang ada atau GitHub deployment; periksa status deployment dan buka URL tersebut. Jika build remote gagal atau akses deployment tidak tersedia, laporkan sebagai blocker dan jangan menyamakan push dengan deployment berhasil.

## Non-goals
Tidak menerima pembayaran sungguhan; tidak mengaktifkan hardware fisik; tidak mengarang hasil akurasi AI, keselamatan atau keuntungan; tidak menjamin komersialisasi produksi; tidak menambahkan provider berbayar atau mengubah konfigurasi eksternal tanpa kebutuhan dan izin yang sesuai.
