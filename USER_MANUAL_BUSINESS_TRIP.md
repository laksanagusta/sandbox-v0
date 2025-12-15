# Panduan Pengguna - Modul Business Trip (Perjalanan Dinas)

Dokumen ini adalah panduan lengkap penggunaan modul **Business Trip** pada aplikasi Internal System. Modul ini dirancang untuk memudahkan pengelolaan perjalanan dinas pegawai, mulai dari pengajuan, persetujuan, hingga pelaporan biaya.

---

## 1. Pendahuluan

Modul Business Trip mencakup fitur-fitur utama berikut:
- **Pengajuan Perjalanan Dinas**: Membuat draft rencana perjalanan dinas (Surat Tugas & SPD).
- **Pengelolaan Biaya (Kwitansi)**: Mencatat rincian biaya seperti uang harian, transportasi, dan penginapan.
- **Workflow Status**: Mengelola tahapan perjalanan dinas dari *Draft*, *Ongoing*, *Ready to Verify*, hingga *Completed*.
- **Verifikasi**: Proses persetujuan oleh verifikator yang ditunjuk.

---

## 2. Akses Modul

Untuk mengakses modul ini:
1.  Login ke aplikasi menggunakan akun Anda.
2.  Pada sidebar menu di sebelah kiri, klik menu **Business Trip**.
3.  Akan muncul 3 sub-menu:
    *   **Business Trip**: Halaman utama daftar perjalanan dinas.
    *   **Report**: Halaman pelaporan (rekapitulasi).
    *   **Verify**: Halaman verifikasi (khusus untuk user yang ditunjuk sebagai verifikator).

---

## 3. Melihat Daftar Perjalanan Dinas

Halaman **Business Trip List** menampilkan tabel seluruh data perjalanan dinas.

### Informasi pada Tabel:
| Kolom | Deskripsi |
| :--- | :--- |
| **No. Business Trip** | Nomor referensi unik perjalanan dinas. Klik nomor ini untuk melihat detail. |
| **No. Surat Tugas** | Nomor Surat Tugas resmi. |
| **Tujuan** | Kota tujuan kegiatan dinas. |
| **Tanggal** | Periode kegiatan (Tanggal Mulai - Selesai) dan Tanggal SPD. |
| **Status** | Status terkini perjalanan (*Draft*, *Ongoing*, dll). |
| **Document** | Link dokumen pendukung. Klik *View Document* untuk membuka. |
| **Total Biaya** | Estimasi total biaya perjalanan. |
| **Dibuat** | Waktu pembuatan data. |

### Fitur Pencarian & Filter:
-   **Search**: Gunakan kotak pencarian untuk mencari berdasarkan tujuan kegiatan.
-   **Filter Status**: Gunakan *dropdown* untuk memfilter data berdasarkan status (*All*, *Draft*, *Ongoing*, *Ready to Verify*, *Completed*, *Canceled*).
-   **Refresh**: Tombol untuk memuat ulang data tabel.
-   **Pagination**: Gunakan navigasi halaman di bagian bawah jika data melebihi 10 baris.

---

## 4. Membuat Perjalanan Dinas Baru

Untuk mengajukan perjalanan dinas baru:

1.  Pada halaman daftar, klik tombol **+ Buat Business Trip**.
2.  Anda akan diarahkan ke formulir **Kwitansi / Detail Perjalanan**.
3.  Lengkapi data pada formulir:

### A. Informasi Kegiatan
Data ini mencakup detail surat tugas dan waktu pelaksanaan.
*   **Tanggal Mulai & Selesai**: Pilih tanggal kegiatan.
*   **Tujuan Kegiatan**: Deskripsi singkat tujuan dinas.
*   **Kota Tujuan**: Kota lokasi dinas.
*   **Tanggal SPD**: Tanggal Surat Perjalanan Dinas diterbitkan.
*   **Tanggal Berangkat & Pulang**: Waktu riil keberangkatan dan kepulangan.
*   **Link Dokumen**: Tautan ke Google Drive/SharePoint berisi berkas pendukung (Tiket, Hotel, dll). **Wajib diisi jika ingin menyelesaikan status ke Completed.**

### B. Daftar Pegawai (Assignees)
Masukkan data pegawai yang ditugaskan dalam perjalanan ini.
1.  Klik **Tambah Pegawai**.
2.  Lengkapi data pegawai: Nama, NIP, Pangkat, Jabatan, dan No. SPD.
3.  **Rincian Biaya (Transactions)** untuk pegawai tersebut:
    *   Klik ikon **+** pada baris pegawai untuk menambah rincian biaya.
    *   Pilih **Jenis Biaya** (Uang Harian / Transport / Penginapan / Lain-lain).
    *   Masukkan **Nilai Riil** (Nominal biaya).
    *   Sistem akan otomatis menghitung Total Biaya.

### C. Verifikator (Verificators)
Tentukan siapa yang berwenang memverifikasi perjalanan dinas ini.
*   Klik **Tambah Verifikator**.
*   Cari nama pegawai yang akan menjadi verifikator.
*   *Catatan: Minimal satu verifikator mungkin diperlukan untuk menyelesaikan proses.*

---

## 5. Alur Status (Workflow)

Perjalanan dinas memiliki siklus status yang harus diikuti:

1.  **Draft**: Status awal saat data dibuat. Anda bebas mengedit data.
    *   *Next Action*: Ubah ke **Ongoing** atau Batalkan (**Canceled**).
2.  **Ongoing**: Perjalanan dinas sedang berlangsung.
    *   *Next Action*: Ubah ke **Ready to Verify** setelah perjalanan selesai.
3.  **Ready to Verify**: Data sudah lengkap dan siap diverifikasi oleh verifikator.
    *   *Next Action*: Ubah ke **Completed** (setelah disetujui) atau Batalkan.
4.  **Completed**: Proses selesai sepenuhnya. Data dikunci.
5.  **Canceled**: Perjalanan dibatalkan. Data dikunci.

### Syarat Perubahan Status:
⚠️ **PENTING:** Anda tidak dapat mengubah status menjadi **Completed** jika:
1.  **Link Dokumen** masih kosong.
2.  Ada verifikator yang belum memberikan persetujuan (**Pending** atau **Rejected**).

---

## 6. Verifikasi Perjalanan Dinas

Fitur ini digunakan oleh pegawai yang ditunjuk sebagai Verifikator.

1.  Masuk ke menu **Business Trip > Verify**.
2.  Tabel menampilkan daftar permintaan verifikasi yang ditujukan kepada Anda.
3.  Periksa detail perjalanan dinas.
4.  Klik tombol aksi pada kolom Action:
    *   ✅ **Approve**: Menyetujui perjalanan dinas.
    *   ❌ **Reject**: Menolak perjalanan dinas (Anda bisa menyertakan catatan penolakan).
5.  Status verifikasi Anda akan berubah menjadi *Approved* atau *Rejected*.

---

## 7. Tips Penggunaan

*   **Penyimpanan**: Selalu klik tombol **Simpan** di pojok kanan bawah setelah melakukan perubahan data pada formulir.
*   **Tanda Merah**: Jika kolom isian berwarna merah, artinya data tersebut wajib diisi atau formatnya salah.
*   **Smart Upload**: Gunakan fitur **Upload Dokumen** di bagian atas formulir. Anda dapat mengunggah file (PDF/JPG/PNG) seperti Surat Tugas atau rekapan, dan sistem akan mencoba mengisi data formulir secara otomatis berdasarkan isi dokumen tersebut.
*   **Upload Data**: Tersedia fitur upload untuk mengisi data pegawai secara massal (pastikan format template sesuai).
