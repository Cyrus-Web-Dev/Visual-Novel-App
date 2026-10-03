# Harmoni Lima Hati

Visual novel romance berbahasa Indonesia. Kamu berperan sebagai MC yang menjalin kedekatan dengan lima gadis, satu per satu, lalu (jika berhasil) membuka ending bersama mereka semua.

---

## Cara menjalankan (aplikasi desktop)

1. Pastikan **Node.js** terpasang.
2. Di folder project, jalankan:

```bash
npm install
npm start
```

3. Jendela Electron akan terbuka → intro → halaman login.
4. **Daftar** akun baru (username + password), atau **Masuk** jika sudah punya akun.
5. Progress per akun disimpan di **SQLite lokal** (bukan cloud / bukan MySQL).

> Aplikasi ini memakai Electron + SQLite di main process. Jangan mengandalkan buka `login.html` di browser biasa untuk fitur akun.

---

## Cara bermain

### Kontrol dasar

| Aksi | Cara |
|------|------|
| Lanjut dialog | Klik area dialog / layar, atau spasi (jika didukung) |
| Pilih opsi | Klik salah satu tombol pilihan |
| Menu chapter | Kembali dari permainan / setelah ending chapter |
| Simpan | Tombol save di menu (slot lokal + progress akun SQLite) |
| Load | Load dari slot lokal atau progress akun |
| Logout | Keluar dari game → kembali ke login |

### Alur cerita singkat

1. **Chapter 1 – Suzuki Ichika**  
2. **Chapter 2 – Tachibana Nino**  
3. **Chapter 3 – Yoshikawa Miku**  
4. **Chapter 4 – Takahashi Yotsuba**  
5. **Chapter 5 – Watanabe Itsuki**  
6. **Chapter 6 – True Harem Ending** *(terkunci sampai syarat terpenuhi)*  
7. **Chapter 7 – After Story** *(setelah harem clear)*  
8. **Extra 1–5** — kisah setelah menikah, per gadis *(butuh Happy Ending di chapter terkait)*

Chapter berikutnya biasanya terbuka setelah kamu menyelesaikan chapter sebelumnya (ada ending tercatat).

---

## Sistem affection (poin perasaan)

Di tiap chapter utama (1–5) ada banyak **pilihan dialog**.

Setiap opsi biasanya memberi:

- **+5** → respons yang peduli / tepat  
- **0** → netral  
- **−5** → respons dingin / kurang tepat  

Di akhir chapter, total skor affection menentukan ending:

| Skor akhir | Ending | Arti |
|------------|--------|------|
| **≥ 100** | **Happy** 💍 | Pernikahan — route “sempurna” |
| **≥ 80** dan &lt; 100 | **Good** 💕 | Pacaran |
| **&lt; 80** | **Bad** 💔 | Ditinggalkan / hubungan gagal |

### Tips pilihan

- Dengarkan curhat mereka; jangan mengalihkan topik saat momen penting.  
- Hormati batas dan perasaan (jangan meremehkan luka atau memaksa).  
- Konsisten: satu–dua pilihan buruk masih bisa ditolong, tapi banyak −5 akan sulit mencapai 100.  
- Target **Happy (100+)** di **kelima** chapter jika kamu ingin menamatkan ending utama (harem).

Kamu boleh mengulang chapter yang sama untuk memperbaiki skor dan mengganti status ending terakhir chapter tersebut.

---

## Cara menamatkan game (100% / true end)

### 1. Selesaikan Chapter 1–5 dengan **Happy Ending**

Untuk setiap gadis (chapter 1 sampai 5):

1. Mainkan chapter-nya.  
2. Pilih opsi yang menaikkan affection (+5) sebanyak mungkin.  
3. Pastikan skor akhir **≥ 100** → ending **Pernikahan (Happy)**.  
4. Setelah Happy, **Extra chapter** untuk gadis itu ikut terbuka.

Ulangi sampai **kelima** chapter berstatus Happy.

### 2. Buka dan selesaikan **Chapter 6**

Syarat:

- Chapter 1–5 semuanya pernah mencapai **Happy Ending** (affection ≥ 100), **atau**  
- Progress/unlock di sistem sudah menandai Chapter 6 terbuka (semua happy / semua extra terkait).

Chapter 6 adalah **True Harem Ending**. Selesaikan sampai layar:

> CONGRATULATIONS! YOU UNLOCKED THE TRUE HAREM ENDING

### 3. Mainkan **Chapter 7 (After Story)**

Setelah harem clear, buka Chapter 7 dan mainkan sampai selesai. Ini penutup kehidupan kalian berenam.

### 4. (Opsional) Selesaikan semua **Extra 1–5**

Extra terbuka per gadis setelah Happy Ending chapter-nya. Isinya epilog singkat setelah menikah. Menyelesaikan semua extra melengkapi pengalaman cerita, meski true end utama sudah di Chapter 6–7.

### Ringkasan checklist tamat

- [ ] Chapter 1 Ichika — Happy (≥ 100)  
- [ ] Chapter 2 Nino — Happy (≥ 100)  
- [ ] Chapter 3 Miku — Happy (≥ 100)  
- [ ] Chapter 4 Yotsuba — Happy (≥ 100)  
- [ ] Chapter 5 Itsuki — Happy (≥ 100)  
- [ ] Extra 1–5 (opsional, setelah masing-masing Happy)  
- [ ] Chapter 6 — Harem Ending  
- [ ] Chapter 7 — After Story  

---

## Save & progress

Ada dua lapis penyimpanan:

1. **Slot lokal (localStorage)** — beberapa slot di perangkat, cepat, tetap ada meski belum pakai fitur akun.  
2. **Akun SQLite** — terikat username yang kamu pakai login di aplikasi Electron; bisa dilanjutkan setelah logout/login lagi di PC yang sama.

Disarankan:

- Save rutin di slot lokal.  
- Setelah momen penting (ending chapter), simpan juga ke akun agar progress unlock Chapter 6 tidak hilang.

---

## Karakter (Chapter 1–5)

| Chapter | Nama | Fokus route |
|---------|------|-------------|
| 1 | Suzuki Ichika | Idol / citra publik vs diri yang rapuh |
| 2 | Tachibana Nino | Tsundere, menjaga jarak, kepercayaan |
| 3 | Yoshikawa Miku | Pendiam, musik, ruang aman untuk jadi diri sendiri |
| 4 | Takahashi Yotsuba | Ceria tapi kelelahan; belajar berhenti memaksakan diri |
| 5 | Watanabe Itsuki | Cerdas, tegas; sisi lembut di balik ekspektasi |

Chapter 6–7 mengikat kelima route menjadi satu ending bersama (harem / after story).

---

## Troubleshooting singkat

| Masalah | Solusi |
|---------|--------|
| Login tidak jalan di browser | Jalankan lewat `npm start` (Electron), bukan file HTML langsung |
| `better-sqlite3` gagal install | Install build tools C++ di Windows, lalu `npm install` ulang |
| Chapter 6 terkunci | Pastikan Chapter 1–5 berstatus Happy (skor ≥ 100), save, buka ulang menu chapter |
| Progress “hilang” | Cek apakah login dengan **akun yang sama**; coba load slot lokal |
| Port 8080 dipakai | Tutup app lain yang memakai port 8080, atau restart PC |

---

## Catatan spoiler ringan

True completion game ini **bukan** hanya satu ending pacaran. Ending “sempurna” mensyaratkan **lima Happy Ending** lalu **Chapter 6 (Harem)** dan **Chapter 7 (After Story)**. Good Ending (pacaran) dan Bad Ending tetap valid sebagai hasil route, tetapi tidak membuka jalur true end.

Selamat bermain — pilih kata-katamu dengan hati. 🌸
