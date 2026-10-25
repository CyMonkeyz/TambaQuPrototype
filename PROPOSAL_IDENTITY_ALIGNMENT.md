# Penyesuaian proposal dan identitas TambaQu

Acuan isi: `Proposal_TambaQu_Terbaru_MAJUON_2026_2027 (1).docx` yang dilampirkan pengguna pada revisi ini. Dokumen ini menggantikan proposal induk sebelumnya sebagai acuan lingkup demo. Aplikasi tetap berupa demo lokal; aktivasi eksternal ditunda.

## Perubahan yang diterapkan

| Acuan proposal | Penyesuaian demo |
|---|---|
| §1.2 dan §4.3: PondHub multi-node sebagai fokus MVP | Contoh interaktif satu PondHub dengan tiga node, untuk tiga kolam berdekatan atau tiga titik dalam satu kolam |
| §1.2: AquaWeather menjadi prioritas awal | Label Fokus MVP; cuaca mikro dibedakan dari prakiraan wilayah, contoh cuaca tetap diberi label |
| §1.3 dan §8.1: AeroPilot terawasi, PondGuard dan pilihan manual lebih tinggi prioritasnya daripada AI | Label Uji terkontrol; tombol hanya simulasi; kontrol fisik tetap tidak diaktifkan |
| §1.2 dan §4.3: FeedPilot tahap lanjutan | Pencatatan pakan tetap dapat dicoba, dengan penjelasan bahwa rekomendasi otomatis dan feeder belum diuji |
| ProfitLens / PondConfig bertahap | Evaluasi biaya aktual dan survei konfigurasi; tidak mengklaim penghematan atau hasil produksi tervalidasi |
| §5.1: seluruh perangkat disewakan | Pilihan modul mengikuti survei, periode bulanan/per siklus, perangkat tetap milik penyedia; hapus kesan paket harga baku dari demo |
| §5.2: Pondivator dan berbagi infrastruktur sukarela | Alur Survei → Penawaran sewa → Pasang & uji → Pantau & tindak → Evaluasi siklus; detail biaya, tagihan individu, servis dan hak keluar |
| §5.2: data dan keselamatan masing-masing kolam independen | Keterangan eksplisit pada contoh konfigurasi bersama |
| BioflocCare bukan modul inti dalam lampiran terbaru | Catatan manual tetap tersedia sebagai alat pendukung, ditandai Catatan pendukung |
| §1.3: peringatan air bukan diagnosis patogen | PondBrain tetap menjelaskan aturan dan kondisi lingkungan, tidak mengklaim prediksi penyakit tervalidasi |

## Identitas visual

- Sumber: `TambaQu Logo Identity Board.png`, ukuran 1717 × 916.
- Tulisan dan simbol diambil melalui viewport SVG yang memuat gambar sumber secara utuh, kemudian dirender ke PNG untuk pemakaian aplikasi. Bentuk tidak digambar ulang dengan AI.
- Logo utama 1070 × 294; simbol 390 × 440. Ikon instalasi dibuat dari render simbol pada kanvas putih dengan ruang aman.
- Warna utama `#0B6E8E`; aksen gradasi `#14B8A6`, sesuai nilai RGB 20/184/166 pada papan identitas. Tulisan kode warna teal di gambar tidak lengkap, sehingga nilai RGB menjadi acuan.
- Sidebar memakai gradasi biru `#0B6E8E` ke `#083F55`; isi tetap terang. Warna aman/waspada/kritis tetap bermakna status.
- Login, dashboard, modul, presentasi, favicon, ikon instalasi, dan metadata gambar memakai identitas baru. Aset lama disimpan untuk dokumen lama, tidak digunakan oleh komponen logo aplikasi.

## Batas

Ini penyelarasan isi dan pengalaman demo, bukan bukti pencapaian teknis atau bisnis proposal. Kalibrasi, reliabilitas, manfaat ekonomi, harga, kesiapan instalasi, dan kendali fisik perlu dibuktikan melalui pengujian terpisah. Tidak ada kontrak, pembayaran, email, atau permintaan layanan yang dikirim oleh contoh interaktif.

Alat reproduksi: `scripts/prepare-identity-board.mjs <gambar-sumber>` membuat viewport sumber di `tmp/brand-source`; render browser dipakai untuk PNG aplikasi. `npm run generate:pwa-assets` memperbarui ikon instalasi dari `public/brand/tambaqu-current-icon.png`.
