# Fitur Digital Signature pada Work Paper

## Overview
Fitur digital signature telah ditambahkan pada halaman Work Paper Detail (`/work-papers/:id`) untuk memungkinkan pengguna melakukan tanda tangan digital pada dokumen work paper.

## Endpoint API
1. **Get Work Paper Signatures**: `GET /api/v1/desk/work-paper-signatures?page=1&limit=100&work_paper_id=eq.{work_paper_id}`
2. **Digital Sign**: `POST /api/v1/desk/work-paper-signatures/{signature_id}/digital-sign`

## API Response Format

### Get Signatures Response
```json
{
    "data": [
        {
            "id": "c64e00d3-153f-485d-a0d0-c98ce6fd3a08",
            "work_paper_id": "dacda4bf-f897-4542-a754-6a1d747ba149",
            "user_id": "75e6213b-73bb-4990-8930-c79b7a4558ff",
            "user_name": "John Doe",
            "user_email": "john@example.com",
            "user_role": "Auditor",
            "signature_type": "digital",
            "status": "signed",
            "signature_data": {
                "timestamp": "0001-01-01T00:00:00Z",
                "digital_signature": {
                    "signature": "GTLmeSV4YiHPD2lsZoLvTzYY1b0FCBY5/vUOLZay+DPTWHOEKyaDBoJewMIy5/cHiebv3N83YMuN3SQ5LduqfVImSodi4hSAcQzDV+IS6UcHeeRzMsotarM43LhZREZcuYQKlFByjTiDrlBK2K6b4/MTrX8vpzQ4GgIDks3LUTUQISDfXNEKEaBpO0CQy9eMXUFO4lhYT2ZIFVXlaYueq0407iM0h2rUmzHWBXXnfebeGMTZTAIlY8RWLGVPM0svrNl1SrKd0Zk3t4hTZIbC9MtIo0et74vAk0xtxKXn9xLFGPjs1+PIRHTuJt7OQOMgBoUhuebBvTl+91zzA/rOEA==",
                    "payload": "eyJ1c2VyX2lkIjoiNzVlNjIxM2ItNzNiYi00OTkwLTg5MzAtYzc5YjdhNDU1OGZmIiwid29ya19wYXBlcl9pZCI6ImRhY2RhNGJmLWY4OTctNDU0Mi1hNzU0LTZhMWQ3NDdiYTE0OSIsIndvcmtfcGFwZXJfc2lnbmF0dXJlX2lkIjoiYzY0ZTAwZDMtMTUzZi00ODVkLWEwZDAtYzk4Y2U2ZmQzYTA4IiwidGltZXN0YW1wIjoiMjAyNS0xMS0yOVQxNjoxMDo0OC4wMzYyMzVaIn0=",
                    "algorithm": "RSA-PSS-SHA256",
                    "public_key_id": "default",
                    "certificate_id": "default",
                    "timestamp": "2025-11-29T16:10:48.036235Z",
                    "verified": true,
                    "verified_at": "2025-11-29T16:10:48.040214Z"
                }
            },
            "created_at": "2025-11-29T13:44:29Z",
            "updated_at": "2025-11-29T16:10:48Z",
            "signed_at": "2025-11-29T23:10:48Z"
        },
        {
            "id": "144dc204-f8f0-4fb6-be6f-02cb1a0b97d9",
            "work_paper_id": "3f8307b7-c0d4-4d0a-8aeb-e284fa8815de",
            "user_id": "b932d55a-de4d-4b41-bca8-53a1569508e8",
            "user_name": "Riska Zata",
            "user_email": "081336110229",
            "user_role": "Super Admin",
            "signature_type": "digital",
            "status": "pending",
            "created_at": "2025-11-29T18:26:37Z",
            "updated_at": "2025-11-29T16:26:37Z"
        }
    ],
    "page": 1,
    "limit": 100,
    "total_items": 2,
    "total_pages": 1
}
```

## Implementasi

### 1. Interface
```typescript
interface WorkPaperSignature {
  id: string;
  work_paper_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  signature_type: string;
  status: 'pending' | 'signed' | 'rejected';
  signature_data?: {
    timestamp: string;
    digital_signature: {
      signature: string;
      payload: string;
      algorithm: string;
      public_key_id: string;
      certificate_id: string;
      timestamp: string;
      verified: boolean;
      verified_at: string;
    };
  };
  created_at: string;
  updated_at: string;
  signed_at?: string;
}
```

### 2. State Management
- `workPaperSignatures`: Array untuk menyimpan daftar signatures
- `signingSignature`: String untuk tracking signature yang sedang diproses

### 3. Fungsi Utama

#### fetchWorkPaperSignatures()
- Mengambil data signatures dari API berdasarkan work paper ID
- Handle response format dengan pagination dan data array
- Sort berdasarkan `created_at` karena tidak ada `signature_order` di response baru

#### handleDigitalSign(signatureId)
- Melakukan proses digital signature
- Memperbarui data signatures dan work paper setelah berhasil
- Menampilkan notifikasi sukses/error

#### getCurrentUserId()
- Mengambil user ID dari localStorage untuk otorisasi

### 4. UI/UX
- **Tabel Signatures**: Menampilkan daftar user yang harus menandatangani dengan kolom:
  - No, Nama, Email, Role, Status, Tanggal Tanda Tangan, Tipe Tanda Tangan, Aksi
- **Conditional Display**: **Tabel signatures hanya muncul jika work paper status = 'ready_to_sign'**
- **Status Indikator**: Badge untuk status:
  - "Sudah Ditandatangani" (hijau) untuk `status: signed`
  - "Ditolak" (merah) untuk `status: rejected`
  - "Menunggu Tanda Tangan" (abu-abu) untuk `status: pending`
- **Tipe Signature**: Badge untuk menampilkan tipe signature ("Digital" atau lainnya)
- **Interactive Buttons**:
  - Tombol "Tanda Tangan Digital" hanya muncul untuk user dengan `status: pending` dan `user_id` yang cocok
  - Tombol disabled untuk user yang sudah menandatangani (`status: signed`) atau ditolak (`status: rejected`)
- **Visual Feedback**:
  - Baris hijau untuk user yang bisa menandatangani (`status: pending` dan user cocok)
  - Loading state saat proses signing
  - Toast notifications untuk sukses/error

### 5. Alur Proses
1. User membuka halaman Work Paper Detail
2. Jika work paper status = 'ready_to_sign', sistem fetch data signatures dari API dengan format response baru
3. Tabel menampilkan daftar user yang harus menandatangani dengan status yang sesuai
4. User dengan `status: pending` dapat melihat tombol "Tanda Tangan Digital"
5. User klik tombol untuk melakukan proses signing
6. Sistem memanggil endpoint digital sign
7. Data signatures dan work paper diperbarui
8. Tabel diperbarui dengan status terbaru (menjadi `signed`)

### 6. Validasi & Error Handling
- Cek token autentikasi
- Validasi user yang berhak menandatangani (hanya `status: pending`)
- Handle multiple status values: `pending`, `signed`, `rejected`
- Error handling untuk API failures
- User-friendly error messages
- Refresh data otomatis setelah signing

### 7. Responsive Design
- Table scrollable pada layar kecil
- Optimized layout untuk mobile dan desktop
- Clear action buttons dengan appropriate sizing

## Testing Scenarios
1. **Happy Path**: User dengan status `pending` berhasil melakukan digital signature
2. **Already Signed**: User yang sudah menandatangani (`status: signed`) tidak bisa signing lagi
3. **Rejected User**: User dengan status `rejected` tidak bisa signing
4. **Unauthorized**: User mencoba menandatangani tanpa otorisasi
5. **Network Error**: Gagal koneksi ke API
6. **Invalid Signature**: Invalid signature ID
7. **Empty Data**: Work paper tanpa signatures
8. **Mixed Status**: Beberapa user signed, beberapa pending, beberapa rejected

## Key Changes from Previous Implementation
1. **Interface Update**: Mengubah dari `is_signed: boolean` menjadi `status: 'pending' | 'signed' | 'rejected'`
2. **Field Renames**:
   - `role` → `user_role`
   - `signature_order` → dihapus (tidak ada di response baru)
3. **New Fields**:
   - `signature_type`: menampilkan jenis signature (digital, dll)
   - `signature_data`: berisi data digital signature lengkap
4. **Logic Updates**:
   - Tombol hanya aktif untuk `status: pending`
   - Menambahkan handling untuk `status: rejected`
   - Sort berdasarkan `created_at` bukan `signature_order`
   - **NEW**: Tabel signatures hanya muncul jika work paper status = 'ready_to_sign'

## Future Enhancements
- Bulk signing untuk multiple signatures
- Digital certificate verification dan display dari `signature_data`
- Audit trail enhancement dengan `verified_at` timestamp
- Signature preview menggunakan data dari `signature_data`
- Offline signing capability
- Multiple signature types support