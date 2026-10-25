# Backend `/api/order` update

Frontend checkout sekarang mengirim `multipart/form-data`.

Field text:

- `customer`: JSON `{ name, phone, address, payment }`
- `items`: JSON array seperti:
  `[ { "id":"tu-bw", "qty":2, "note":"...", "ref":"https://..." } ]`

Field file:

- `referencePhotos[tu-bw]`: satu atau beberapa file foto untuk Paket Tu.bw
- `referencePhotos[tu-na]`: satu atau beberapa file foto untuk Paket Tu.na
- dan seterusnya sesuai `id` produk
- `qrisProof`: satu file bukti pembayaran, **hanya ada jika payment = QRIS**

Catatan penting:

- Maksimal 5 foto per tipe produk.
- Maksimal 5 MB per foto.
- Tipe gambar yang diterima: JPG, PNG, WEBP.
- Bukti QRIS wajib jika pembayaran QRIS dan tidak dikirim jika Cash.
- `note` dan `ref` sekarang berada pada masing-masing item produk, sehingga catatan/foto tidak tertukar antar tipe ganci.
