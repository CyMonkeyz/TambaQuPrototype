# Offline Competition Demo

## Script

1. Enter Demo online, reset, and run Warning Escalation until Kolam B is 67 / Waspada.
2. Open Kolam B PondBrain so the latest snapshot is visibly available.
3. Open Kontrol Demo → **Simulasi Koneksi Aplikasi** → **Offline**.
4. Show the global **Mode Offline** banner and cached sensor/risk notice.
5. Return to PondBrain and complete **Periksa dan optimalkan aerasi** with `Aerator tambahan diaktifkan.`
6. Show **Menunggu sinkronisasi** on the action and pending count `1` in the header.
7. Open Alerts and acknowledge the Kolam B warning. Pending count becomes `2`.
8. Navigate Dashboard → Kolam → Detail Kolam → PondBrain → Peringatan. Cached data remains available.
9. Return to Kontrol Demo and choose **Online**.
10. Show **Menyinkronkan 2 perubahan**, then verify both become synced and pending count returns to zero.
11. Refresh. The action remains and is not duplicated.

Speaker note: “Perubahan tetap tersimpan lokal dalam outbox dan disinkronkan ketika koneksi kembali. Simulasi ini mengontrol perilaku koneksi aplikasi; pengujian service worker offline nyata dilakukan terpisah melalui browser DevTools.”

## Real browser offline check

The in-app toggle is not browser-level offline. To verify the service worker, use a production build/preview, visit routes online, enable Offline in browser DevTools, and refresh a nested route. Offline capability is guaranteed only after the app and data have been stored once.
