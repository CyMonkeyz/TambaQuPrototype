# Demo petambak TambaQu

Revisi identitas dan lingkup terbaru mengikuti `Proposal_TambaQu_Terbaru_MAJUON_2026_2027 (1).docx` dan papan logo udang. Lihat [matriks penyesuaian](./PROPOSAL_IDENTITY_ALIGNMENT.md). FeedPilot adalah tahap lanjutan; BioflocCare tetap tersedia sebagai catatan pendukung.

Arahan terbaru: koneksi eksternal ditunda. Fokus pada demo lokal yang rapi dan mudah dicoba, dengan dashboard terang, sidebar navy, dan logo yang sama.

## Cara mencoba

Jalankan aplikasi lokal, buka `/login`, lalu pilih **Coba Demo**. `/demo` juga membuka dashboard secara langsung. Data contoh tidak berasal dari tambak nyata.

1. Pilih kolam, lalu pilih DO, pH, atau suhu untuk mengganti grafik.
2. Buka PondBrain untuk melihat alasan dan tindakan.
3. Dari detail kolam, buka pencatatan pakan, air & bioflok, atau biaya & hasil.
4. Coba cuaca dan aerasi melalui modul kolam; Tim & Layanan menyediakan anggota contoh dan paket layanan.
5. Mode Presentasi tetap tersedia di menu tambahan.

Catatan modul disimpan di IndexedDB pada browser ini. Memuat ulang halaman tidak menghapus catatan. Contoh tombol aerator dan survei hanya berlaku selama halaman tersebut dibuka; keduanya tidak menghubungi perangkat atau tim layanan.

## Penyelarasan proposal

| Bagian | Tampilan demo | Batas saat ini |
|---|---|---|
| Sensor | DO, pH, suhu sebagai kartu utama; hasil tambahan terpisah | Semua pembacaan demo berupa simulasi |
| PondBrain | Kondisi, alasan, rekomendasi, pencatatan tindakan | Aturan contoh, bukan diagnosis atau prediksi tervalidasi |
| FeedPilot | Pakan, stok, rencana dan realisasi | Penyimpanan lokal; pemakaian melebihi stok ditolak |
| BioflocCare | Hasil uji dan perawatan | Catatan manual, bukan seluruhnya sensor kontinu |
| ProfitLens | Biaya, pendapatan, panen, energi | Rasio menunggu data pendukung lengkap |
| AquaWeather | Contoh cuaca per jam dan pengingat cek kolam | Tidak mengambil prakiraan langsung |
| AeroPilot / PondGuard | Tombol simulasi status aerator dan rancangan perangkat | Tidak mengubah sensor atau mengirim perintah fisik |
| Pondivator / PondConfig | Catatan kunjungan dan kebutuhan instalasi | Tidak membuat penugasan eksternal |
| Tim / sewa | Anggota contoh, paket, simulasi permintaan survei | Tanpa email, kontrak sah, atau pembayaran |
| Firmware | Kontrak payload, simulator dan contoh ESP32 disimpan | Aktivasi dan bench test ditunda |

## Verifikasi

Hasil aktual dan screenshot dicatat di `DEMO_VERIFICATION.md`. Kode cloud yang tersedia belum berarti layanan telah diaktifkan. Uji dua akun, RLS cloud, pembayaran, AI daring, dan perangkat fisik memerlukan pengujian terpisah saat integrasi dilanjutkan.
