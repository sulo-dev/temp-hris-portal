# Product Requirements Document (PRD) — SuloHR v3.0
**Modern Futuristic HRIS, 3D Spatial Glassmorphic Interface & Enterprise-Secured Self-Service Platform**

| Atribut Dokumen | Keterangan |
| :--- | :--- |
| **Nama Produk** | **SuloHR** — Futuristic HRIS & Employee Self-Service Platform |
| **Versi Dokumen** | **v3.0 (Spatial 3D UI, Gradient System, Motion Architecture & Security Hardened Edition)** |
| **Kategori Produk** | B2B SaaS / Enterprise Web Application (High-Craft Portfolio Showcase) |
| **Target Pengguna** | UMKM Menengah hingga Perusahaan Berkembang ($20 - 250$ Karyawan) |
| **Perusahaan Simulasi** | PT Sulo ($48$ Karyawan Aktif, $5$ Departemen) |
| **Palet Identitas Utama** | Deep Sovereign Navy (`#011D58`), Blaze Vermilion (`#FA4D09`), Solar Tangerine (`#FC7A0B`), Amber Gold (`#FF9F03`) |
| **Status** | Siap Tahap Implementasi Frontend, Motion Engineering & Security Hardening |

---

## 1. Ringkasan Eksekutif

### 1.1 Visi Produk
**SuloHR** adalah platform manajemen sumber daya manusia (*Human Resource Information System*) generasi modern yang mentransformasi administrasi SDM manual berbasis *spreadsheet* menjadi ekosistem digital yang otomatis, imersif, dan aman. Menggabungkan *Executive Command Center* bergaya futuristik *glassmorphism* bagi tim HR dengan portal mandiri (*Employee Self-Service*) yang responsif bagi karyawan, SuloHR menghadirkan pengalaman visual berkelas *enterprise* dengan standar keamanan data kepegawaian yang ketat.

### 1.2 Masalah yang Diselesaikan (Problem Statement)
Perusahaan skala berkembang umumnya menghadapi empat hambatan operasional utama dalam pengelolaan SDM:
1. **Data Karyawan Terfragmentasi & Rentan Terekspos:** Informasi kontrak kerja, NIK, rekening bank, dan kepesertaan BPJS tersebar di berbagai dokumen terpisah tanpa kontrol akses maupun penyamaran data sensitif (*PII masking*).
2. **Rekapitulasi Absensi Manual:** Pencatatan jam masuk, keterlambatan, dan status kerja hibrida (WFH/WFO) memakan waktu lama saat rekap akhir bulan dan rawan manipulasi waktu.
3. **Alur Persetujuan Cuti Lambat:** Pengajuan cuti melalui pesan instan sering kali tidak memiliki *audit trail*, menyebabkan pemotongan sisa kuota cuti tidak akurat dan jadwal tim saling bertabrakan.
4. **Perhitungan Payroll Rawan Kesalahan:** Penggabungan variabel gaji pokok, tunjangan, lembur, potongan keterlambatan, BPJS, dan PPh 21 secara manual berisiko tinggi menimbulkan selisih nominal pada slip gaji.

### 1.3 Tujuan Strategis dalam Portofolio (4 Pilar Utama)
Sebagai aset portofolio rekayasa perangkat lunak berkelas tinggi, SuloHR v3.0 membuktikan penguasaan pada empat aspek arsitektur modern:
1. **Role-Based Access Control (RBAC) & Zero-Trust UI:** Pemisahan rute, *middleware guard*, komponen antarmuka, dan visibilitas data sensitif antara peran HR Admin dan Karyawan.
2. **Spatial 3D Glassmorphism & Choreographed Motion:** Penerapan antarmuka berlapis (*frosted glass refraction*), kartu interaktif 3D (*parallax tilt*), dan animasi berbasis fisika pegas (*spring physics*) pada $60\text{ fps}$ tanpa mengorbankan keterbacaan data tabel.
3. **Transactional State & Approval Workflow:** Perubahan status pengajuan secara berantai yang berdampak langsung pada kalkulasi kuota cuti, kalender tim, dan log audit permanen.
4. **Automated Financial Engine & Print-Ready Document:** Mesin kalkulasi gaji presisi tinggi dengan konversi otomatis dari tema gelap futuristik ke format dokumen A4 kertas putih bersih saat dicetak.

---

## 2. Target Pengguna & Matriks Hak Akses (RBAC)

### 2.1 Persona Pengguna
1. **HR Admin / People Operations (`Rina Kusuma — HR Manager`)**
   * **Profil:** Pengelola operasional SDM yang bertanggung jawab atas validitas data karyawan, pemantauan kedisiplinan harian, persetujuan akhir pengajuan cuti/lembur, dan penerbitan payroll bulanan.
   * **Kebutuhan Utama:** Memantau metrik perusahaan melalui dasbor interaktif, membuka penyamaran data sensitif dengan otorisasi, memproses antrean persetujuan dengan cepat, dan mengeksekusi penggajian bulanan secara otomatis.
2. **Karyawan / Staf (`Dimas Pratama — Senior Frontend Engineer`)**
   * **Profil:** Anggota tim lintas divisi (*Engineering, Product & Design, Marketing, Finance*) yang membutuhkan akses cepat dan ringan untuk kebutuhan administratif harian dari desktop maupun ponsel.
   * **Kebutuhan Utama:** Melakukan *clock-in/clock-out* harian dengan animasi status *real-time*, mengecek sisa kuota cuti tahunan, mengajukan izin/cuti daring, dan mengunduh slip gaji PDF.
3. **Pengunjung Portofolio (Evaluator / Klien / Perekrut Teknis)**
   * **Profil:** Calon klien atau perekrut teknis yang meninjau kualitas kode, alur UX, kelengkapan logika bisnis, dan standar keamanan aplikasi.
   * **Kebutuhan Utama:** Berpindah peran secara instan (*Instant Role Switcher*), menguji proteksi keamanan (seperti mencoba mengakses URL `/admin/*` saat berada dalam mode Karyawan), dan me-reset data simulasi kapan saja.

### 2.2 Matriks Hak Akses & Keamanan (RBAC Security Matrix)

| Fitur / Modul Sistem | HR Admin | Karyawan (ESS) | Mekanisme Proteksi Keamanan |
| :--- | :--- | :--- | :--- |
| Executive Dashboard & Analitik 3D | Ya | Tidak (Redirect 403/ESS) | Route Guard + Role State Check |
| Tambah, Ubah & Nonaktifkan Karyawan | Ya | Tidak | RBAC Action Guard + Zod Validation |
| Lihat Data Sensitif (NIK, Rekening, Gaji Staf) | Ya (Dengan Toggle Unmask) | Hanya Milik Sendiri | PII Data Masking (`****-8821`) |
| Log Presensi Seluruh Perusahaan | Ya (Termasuk Koreksi) | Hanya Log Pribadi | Scoped Query + Audit Trail Log |
| Clock-In & Clock-Out Harian | Ya | Ya | Timestamp Integrity Check |
| Pengajuan Cuti, Sakit & Lembur | Ya | Ya | Quota Validator + Overlap Check |
| Persetujuan / Penolakan Pengajuan | Ya | Tidak | Role Guard + Mandatory Reject Note |
| Pengelolaan & Penerbitan Payroll | Ya | Tidak | Period Lock + Checksum Verification |
| Unduh Slip Gaji PDF (A4) | Ya (Semua Staf) | Ya (Milik Sendiri) | Owner-ID Verification + Watermark |

---

## 3. Arsitektur Informasi & Peta Halaman (Sitemap)

Aplikasi terbagi menjadi tiga zona navigasi dengan transisi halaman halus (`AnimatePresence` dan `layoutId` *shared navigation pill*):

### 3.1 Zona Publik & Spatial Demo Gateway (`/`)
* **Hero Split-Screen 3D:** Kiri berisi tipografi tegas dengan aksen gradasi `#FA4D09` $\rightarrow$ `#FF9F03` dan dua tombol akses langsung (**Masuk sebagai HR Admin** dan **Masuk sebagai Karyawan**); kanan menampilkan **3D Interactive Glass Card Stack / Isometric HR Core** yang merespons gerakan kursor.
* **Live Preview Metrics & Security Trust Strip:** Menampilkan ringkasan metrik perusahaan simulasi **PT Sulo** serta lencana keamanan sistem (*RBAC Active, Tamper-Evident Vault, UU PDP Ready*).

### 3.2 Zona HR Admin (`/admin/*`)
* `/admin/dashboard` — **Executive Command Center:** $4$ KPI *Glass Cards* dengan animasi penghitung angka (*kinetic counter*), grafik kehadiran mingguan interaktif bergradasi, distribusi departemen, dan *Quick Approval Stream*.
* `/admin/employees` — **Direktori & Vault Karyawan:** Tabel berdensitas presisi dengan *PII Masking Toggle* (menyembunyikan/menampilkan nomor rekening dan gaji), filter multi-kriteria, pencarian instan, dan ekspor CSV ter-sanitasi.
* `/admin/employees/[id]` — **Profil 360° Karyawan:** Header profil bergaya *holographic badge*, navigasi tab dengan indikator geser `layoutId` (*Informasi Umum, Kompensasi & Pajak, Riwayat Presensi, Riwayat Cuti*).
* `/admin/attendance` — **Monitoring Presensi Real-Time:** Ringkasan status harian, tabel log kehadiran dengan *status pulse indicator*, filter tanggal/status, dan modal koreksi manual yang tercatat di *Audit Log*.
* `/admin/approvals` — **Pusat Persetujuan & Team Leave Timeline:** Antrean pengajuan dengan *vertical audit stepper*, pratinjau lampiran dokumen, catatan penolakan wajib, dan matriks kalender ketersediaan tim.
* `/admin/payroll` — **Automated Payroll Engine:** Pemilih periode bulan/tahun, kalkulasi otomatis keterlambatan dan lembur, penguncian periode (*Lock & Mark Paid*), serta modal pratinjau slip gaji A4.

### 3.3 Zona Employee Self-Service (`/ess/*`)
* `/ess/home` — **Beranda Mandiri Karyawan:** Widget *Clock-In/Out* interaktif dengan *live timer* dan *radar pulse ring*, kartu kuota cuti, status pengajuan terakhir, dan pengumuman internal.
* `/ess/leaves` — **Cuti & Perizinan Saya:** Formulir pengajuan dengan kalkulasi hari kerja efektif otomatis (mengecualikan akhir pekan) dan pelacakan status berantai.
* `/ess/payslips` — **Arsip Slip Gaji Pribadi:** Kartu slip gaji bulanan berlapis kaca untuk periode berstatus *Final/Dibayarkan* dengan pratinjau dan cetak PDF A4.

### 3.4 Kontrol Global & Demo Experience (Floating Topbar)
* **Dynamic Island Role Switcher:** Pil navigasi kaca di bilah atas untuk berpindah seketika antara akun **Rina Kusuma (HR Manager)** dan **Dimas Pratama (Senior Frontend Engineer)**, lengkap dengan perlindungan rute otomatis (jika pengguna berada di `/admin/payroll` lalu beralih ke Karyawan, sistem otomatis mengarahkan ke `/ess/home` disertai *toast notification* keamanan).
* **Security Shield & Privacy Mask Toggle:** Tombol global untuk mengaktifkan/menonaktifkan mode penyamaran data sensitif (*Privacy Blur/Mask*) saat presentasi layar.
* **Security Audit Drawer & Reset Demo Vault:** Panel laci untuk meninjau log keamanan *real-time* serta tombol untuk mengembalikan seluruh data simulasi ke kondisi awal dengan konfirmasi modal.

---

## 4. Spesifikasi Fungsional Mendetail

### Modul 1: Executive HR Dashboard (`/admin/dashboard`)
* **4 Kartu KPI Utama (Glassmorphic Bento Top Row):**
  1. **Total Karyawan Aktif:** `48 Karyawan` (`+2 bulan ini`) dengan ikon 3D berlapis gradasi `#FA4D09` $\rightarrow$ `#FF9F03`.
  2. **Tingkat Kehadiran Hari Ini:** `93,7%` (`45/48 Hadir`) dengan *radial progress ring* beranimasi gradasi emas-oranye.
  3. **Menunggu Persetujuan:** Jumlah pengajuan `Pending` dengan indikator denyut (*amber pulse*) dan tautan langsung ke `/admin/approvals`.
  4. **Kontrak Segera Berakhir:** Jumlah staf PKWT yang kontraknya berakhir dalam waktu $< 30\text{ hari}$ dengan peringatan visual.
* **Visualisasi Data Interaktif:**
  * **Stacked Bar Chart (7 Hari Kerja Terakhir):** Memisahkan kategori *Tepat Waktu* (`#10B981`), *Terlambat* (`#FF9F03`), dan *Cuti/Izin* (`#38BDF8`) dengan *SVG linear gradient fill* dan tooltip kaca interaktif saat kursor diarahkan.
  * **Donut Chart (5 Departemen):** Sebaran jumlah karyawan berdasarkan $5$ departemen (*Engineering, Product & Design, Marketing, Finance, HR*) menggunakan segmen palet `#011D58`, `#FA4D09`, `#FC7A0B`, `#FF9F03`, dan `#38BDF8`.
* **Widget Pengajuan Terbaru:** Daftar $5$ pengajuan terbaru dengan aksi cepat **Setujui** atau **Tolak** yang langsung memicu animasi transisi keluar (*exit transition*) dan memperbarui metrik KPI.

### Modul 2: Direktori & Manajemen Karyawan (`/admin/employees`)
* **Tabel Direktori Karyawan:** Kolom NIP dan Nama Lengkap (avatar inisial bergradasi), Jabatan dan Departemen, Status Kerja (`PKWTT/Tetap`, `PKWT/Kontrak`, `Magang`), Tanggal Bergabung, Sisa Kuota Cuti, dan Aksi.
* **PII Privacy Masking:** Nomor rekening bank, NIK, dan nominal gaji pada ringkasan tampil dalam format tersamar (`****-****-4910`) secara *default*, dan hanya terbuka saat HR Admin menekan tombol ikon mata (*Unmask*).
* **Slide-over Drawer Tambah/Edit Karyawan:** Formulir berlapis kaca dengan validasi ketat (format email kantor `@sulo.co.id`, nomor telepon Indonesia, nominal positif, dan pencegahan injeksi karakter berbahaya) serta pembuatan NIP otomatis (`SLO-2026-XXX`).
* **Ekspor CSV Aman:** Sanitasi otomatis terhadap karakter formula (`=`, `+`, `-`, `@`) di awal sel untuk mencegah serangan *CSV Formula Injection* saat file dibuka di aplikasi *spreadsheet*.

### Modul 3: Monitoring Presensi (`/admin/attendance`)
* **Ringkasan Status Harian:** Kartu indikator jumlah karyawan berdasarkan status hari berjalan: *Tepat Waktu*, *Terlambat*, *WFH*, *Cuti/Izin*, dan *Belum Absen*.
* **Tabel Log Kehadiran:** Menampilkan Nama Karyawan, Departemen, Tanggal, Jam Masuk, Jam Pulang, Total Durasi Kerja, Mode Kerja (`WFO` / `WFH` / `Dinas Luar`), dan Badge Status.
* **Koreksi Manual Ter-Audit:** Setiap perubahan jam masuk/pulang oleh HR Admin wajib menyertakan alasan dan otomatis mencatat jejak audit (`Edited by Rina Kusuma at HH:mm`).

### Modul 4: Pusat Persetujuan & Kalender Cuti (`/admin/approvals`)
* **Tab Antrean Pengajuan:** Memisahkan daftar berdasarkan status: *Menunggu Persetujuan (Pending)*, *Disetujui (Approved)*, dan *Ditolak (Rejected)* dengan animasi perpindahan indikator tab (`layoutId`).
* **Detail Modal & Vertical Audit Stepper:** Menampilkan jenis pengajuan (*Cuti Tahunan, Izin Sakit, Cuti Melahirkan, Klaim Lembur*), rentang tanggal, total hari kerja efektif, alasan karyawan, pratinjau lampiran dokumen, serta garis waktu kronologis dari pengajuan hingga keputusan akhir. Penolakan wajib disertai catatan alasan.
* **Team Leave Timeline:** Matriks kalender horizontal per bulan yang menampilkan baris nama karyawan dan blok tanggal cuti yang telah disetujui dengan gradasi warna status agar HR dapat memantau kepadatan jadwal tim.

### Modul 5: Penggajian & Generator Slip Gaji (`/admin/payroll`)
* **Kontrol Periode Penggajian:** Pemilih Bulan dan Tahun (misal: November 2026) dengan lencana status periode (`Draft` atau `Final / Dibayarkan`).
* **Tabel Kalkulasi Payroll:** Menampilkan rincian per karyawan: Gaji Pokok, Total Tunjangan, Uang Lembur, Total Potongan (Keterlambatan + BPJS + PPh 21), *Take Home Pay*, dan Status Pembayaran.
* **Aksi Batch:**
  * *Proses Hitung Otomatis:* Menyinkronkan data keterlambatan dan lembur bulan terpilih ke dalam perhitungan gaji.
  * *Tandai Semua Dibayar:* Mengunci periode payroll agar tidak dapat diubah secara tidak sengaja dan menerbitkan slip gaji ke portal `/ess/payslips` karyawan terkait.
* **Interactive Payslip Modal & Cetak PDF A4:** Menampilkan format dokumen slip gaji resmi **PT Sulo** lengkap dengan nomor referensi unik, kode verifikasi *hash*, identitas karyawan, tabel dua kolom (Penerimaan vs Potongan), total *Take Home Pay* terbilang, dan blok pengesahan HR Manager.

### Modul 6: Portal Mandiri Karyawan (`/ess/*`)
* **Widget Presensi Interaktif (`/ess/home`):** Menampilkan jam digital *real-time* (WITA/WIB), pemilih mode kerja (`WFO` atau `WFH`), serta tombol utama **Clock-In** bergradasi `#FA4D09` $\rightarrow$ `#FC7A0B` $\rightarrow$ `#FF9F03` yang berubah menjadi **Clock-Out** lengkap dengan penghitung durasi kerja aktif (*live timer*) setelah presensi masuk dilakukan.
* **Formulir Pengajuan Cuti Mandiri (`/ess/leaves`):** Pemilih jenis cuti/izin dan rentang tanggal mulai hingga selesai dengan kalkulator hari kerja efektif otomatis (Senin–Jumat, mengecualikan Sabtu dan Minggu) serta validasi sisa kuota cuti secara *real-time*.
* **Arsip Slip Gaji Pribadi (`/ess/payslips`):** Kartu riwayat gaji bulanan untuk periode berstatus *Final / Dibayarkan* dengan pratinjau dan cetak PDF A4.

---

## 5. Aturan Bisnis & Formula Sistem (Business Rules)

1. **Aturan Jam Kerja & Keterlambatan:**
   * Jam kerja standar ditetapkan pukul `09:00 – 17:00` ($8\text{ jam}$ kerja) pada hari Senin hingga Jumat.
   * Batas toleransi keterlambatan (*grace period*) adalah $5\text{ menit}$ (hingga pukul `09:05:59`).
   * Presensi masuk mulai pukul `09:06:00` ke atas otomatis diberi status **Terlambat** dengan perhitungan selisih menit keterlambatan:
     $$\Delta t_{\text{terlambat}} = t_{\text{masuk}} - 09:00 \quad (\text{untuk } t_{\text{masuk}} \ge 09:06)$$
2. **Aturan Perhitungan Hari & Kuota Cuti:**
   * Pengajuan **Cuti Tahunan** hanya menghitung hari kerja efektif (Senin–Jumat); hari Sabtu dan Minggu di dalam rentang tanggal otomatis dikecualikan.
   * Kuota cuti tahunan karyawan baru berkurang secara permanen ketika status pengajuan diubah HR Admin menjadi **Disetujui (Approved)**:
     $$K_{\text{sisa}} = K_{\text{awal}} - D_{\text{efektif}}$$
   * Pengajuan dengan jenis **Izin Sakit** tidak memotong kuota cuti tahunan ($D_{\text{potong}} = 0$).
3. **Formula Kalkulasi Payroll Bulanan:**
   $$\text{Total Penerimaan} = \text{Gaji Pokok} + \text{Tunjangan Tetap} + \text{Uang Lembur}$$
   $$\text{Potongan Keterlambatan} = N_{\text{terlambat}} \times \text{Rp } 25.000$$
   $$\text{Total Potongan} = \text{Potongan Keterlambatan} + \text{BPJS Kesehatan } (1\%) + \text{BPJS TK JHT } (2\%) + \text{PPh 21}$$
   $$\text{Take Home Pay (Gaji Bersih)} = \text{Total Penerimaan} - \text{Total Potongan}$$
   * *Catatan Simulasi PPh 21:* Menggunakan Tarif Efektif Rata-Rata (TER) sederhana berdasarkan lapisan penghasilan bruto bulanan ($0\%$ untuk bruto $\le \text{Rp } 5.400.000$, $1.5\%$ untuk $\text{Rp } 5.400.001 - \text{Rp } 10.000.000$, dan $3.5\%$ untuk $> \text{Rp } 10.000.000$) agar mudah diverifikasi oleh penguji demo.

---

## 6. Sistem Desain Visual Futuristik, Palet Warna, Gradasi, 3D UI & Motion Graphics

### 6.1 Arsitektur Palet Warna Komunitas & Warna Pendukung
Seluruh antarmuka dibangun di atas fondasi $4$ warna identitas utama (`#011D58`, `#FA4D09`, `#FC7A0B`, `#FF9F03`), diperkaya dengan warna permukaan gelap spasial dan warna semantik berdaya kontras tinggi ($\ge 4.5:1$ sesuai standar WCAG AA):

| Peran Token | Nama Warna | Kode Hex / RGBA | Fungsi Penggunaan dalam UI |
| :--- | :--- | :--- | :--- |
| **Primary Brand Base (Utama 1)** | **Deep Sovereign Navy** | `#011D58` | Warna utama identitas kanvas, dasar *glass card*, navigasi sidebar, dan kedalaman antarmuka. |
| **Primary Energy Accent (Utama 2)** | **Blaze Vermilion** | `#FA4D09` | Titik awal gradasi tombol aksi utama (*Primary CTA*), indikator fokus aktif, dan *radar pulse*. |
| **Mid-Tone Transition (Utama 3)** | **Solar Tangerine** | `#FC7A0B` | Titik tengah gradasi energik, status *hover*, *progress bar*, dan sorotan grafik interaktif. |
| **Luminous Highlight (Utama 4)** | **Amber Gold** | `#FF9F03` | Titik puncak gradasi, kilau tepi kaca (*rim light*), lencana *pending/warning*, dan angka sorotan KPI. |
| **Deep Abyss Canvas** | Midnight Cobalt *(Pendukung)* | `#020E2B` | Latar belakang terdalam (*base viewport*) agar panel `#011D58` tampak melayang di ruang 3D. |
| **Elevated Glass Surface** | Royal Navy Glass *(Pendukung)* | `rgba(1, 29, 88, 0.54)` | Permukaan panel *liquid glassmorphism* dengan `backdrop-filter: blur(20px)`. |
| **Crisp Ice Text** | Arctic Slate *(Pendukung)* | `#F8FAFC` / `#CBD5E1` | Teks judul utama (`#F8FAFC`) dan teks deskripsi sekunder (`#CBD5E1`) di atas permukaan navy. |
| **Semantic Success** | Emerald Pulse *(Pendukung)* | `#10B981` | Status *Hadir*, *Tepat Waktu*, *Disetujui*, dan *Dibayarkan*. |
| **Semantic Info / WFH** | Electric Sky *(Pendukung)* | `#38BDF8` | Indikator mode kerja *WFH*, *Cuti/Izin*, dan elemen analitik netral. |
| **Semantic Danger** | Crimson Rose *(Pendukung)* | `#F43F5E` | Status *Ditolak*, *Alpha*, *Kontrak Berakhir*, dan peringatan keamanan. |

### 6.2 Sistem 6 Gradasi Khas SuloHR (Signature Gradients)
Untuk memaksimalkan harmoni dari ke-4 warna utama, SuloHR menerapkan $6$ formula gradasi terstandarisasi:

1. **Solar Ember Primary CTA Gradient (`bg-sulo-cta`):**
   Digunakan pada tombol aksi utama (*Clock-In*, *Simpan Karyawan*, *Proses Payroll*) dan *active pill* navigasi.
   ```css
   background: linear-gradient(135deg, #FA4D09 0%, #FC7A0B 52%, #FF9F03 100%);
   ```
2. **Sovereign Deep Space Mesh (`bg-sulo-canvas`):**
   Latar belakang kanvas utama yang memadukan `#011D58` dan `#020E2B` dengan pendaran cahaya ambien dari `#FA4D09`, `#FC7A0B`, dan `#FF9F03`.
   ```css
   background-color: #020E2B;
   background-image:
     radial-gradient(at 88% 10%, rgba(250, 77, 9, 0.24) 0px, transparent 50%),
     radial-gradient(at 72% 28%, rgba(252, 122, 11, 0.14) 0px, transparent 42%),
     radial-gradient(at 12% 88%, rgba(255, 159, 3, 0.16) 0px, transparent 50%),
     linear-gradient(160deg, #011D58 0%, #020E2B 65%, #01133A 100%);
   ```
3. **Luminous Glass Card Surface & Rim Refraction (`glass-sulo-card`):**
   Permukaan kaca semi-transparan `#011D58` dengan pantulan cahaya tepi atas berwarna `#FF9F03` dan bayangan dalam berwarna `#FA4D09`.
   ```css
   background: linear-gradient(145deg, rgba(1, 29, 88, 0.68) 0%, rgba(2, 14, 43, 0.58) 100%);
   backdrop-filter: blur(20px);
   -webkit-backdrop-filter: blur(20px);
   border: 1px solid rgba(255, 255, 255, 0.12);
   box-shadow:
     inset 0 1px 0 0 rgba(255, 159, 3, 0.34),
     inset 0 0 28px rgba(250, 77, 9, 0.08),
     0 24px 48px -16px rgba(1, 10, 35, 0.78);
   ```
4. **Solar Aurora Text Gradient (`text-sulo-gradient`):**
   Digunakan pada judul *Hero Landing Page* dan sorotan angka nominal *Take Home Pay*.
   ```css
   background: linear-gradient(90deg, #FFFFFF 0%, #FF9F03 48%, #FC7A0B 78%, #FA4D09 100%);
   -webkit-background-clip: text;
   -webkit-text-fill-color: transparent;
   ```
5. **Holographic Conic Border Glow (`border-sulo-conic`):**
   Bingkai bercahaya berputar halus untuk kartu profil 360° karyawan dan *Hero 3D Card Stack*.
   ```css
   background: conic-gradient(from 180deg at 50% 50%, #011D58 0deg, #FA4D09 120deg, #FC7A0B 210deg, #FF9F03 300deg, #011D58 360deg);
   ```
6. **Data Visualization Gradient Fills (SVG Charts):**
   Grafik batang dan garis progres menggunakan definisi `<linearGradient>` dari `#FA4D09` (bawah) ke `#FC7A0B` (tengah) dan `#FF9F03` (puncak) untuk memberikan efek energi visual pada data analitik.

### 6.3 Spesifikasi 3D UI & Spatial Glassmorphism
* **Liquid Glass Refraction Layers:** Hierarki kedalaman visual dibagi menjadi $3$ tingkat elevasi kaca:
  * *Level 0 (Base Mesh):* `#020E2B` $\leftrightarrow$ `#011D58`.
  * *Level 1 (Main Panels & Tables):* `rgba(1, 29, 88, 0.54)` dengan `blur(20px)`.
  * *Level 2 (Modals, Drawers & Floating Topbar):* `rgba(1, 29, 88, 0.82)` dengan `blur(28px)` dan batas tepi `#FF9F03` ($35\%$ opasitas).
* **3D Interactive Parallax Tilt Cards:**
  * Kartu KPI dan Kartu ID Karyawan menggunakan `perspective(1000px)` dan pelacakan koordinat pointer berbasis `useMotionValue` + `useTransform` (tanpa *React re-render*) untuk rotasi halus pada sumbu $X$ dan $Y$ sebesar $\pm 6^\circ$, disertai lapisan kilau spekular (*radial spotlight sheen*) berwarna `#FF9F03` yang mengikuti pergerakan kursor.
* **Isometric 3D Hero Visualization (`/`):**
  * Susunan $3$ kartu kaca melayang pada ruang 3D (`transform-style: preserve-3d`): *Layer Belakang* (Grafik Payroll Otomatis), *Layer Tengah* (Matriks RBAC & Keamanan), dan *Layer Depan* (Widget Presensi *Real-Time* PT Sulo) yang bergerak mengambang secara organik.

### 6.4 Koreografi UI Animation & Motion Graphics
* **Stack Animasi:** `framer-motion` untuk transisi komponen, layout, dan interaksi taktil, dipadukan dengan *GPU-composited CSS keyframes* untuk pendaran ambien.
* **Fisika Pegas Standar (*Spring Physics*):** Seluruh transisi modal, *drawer*, dan kartu interaktif menggunakan konfigurasi pegas terkalibrasi:
  ```ts
  export const SULO_SPRING = { type: "spring", stiffness: 280, damping: 26, mass: 0.9 };
  ```
* **Shared Element Transitions (`layoutId`):** Indikator aktif pada sidebar navigasi, tab pada Profil 360°, dan tombol *Dynamic Island Role Switcher* meluncur mulus antar posisi.
* **Staggered Waterfall Entrance:** Baris tabel karyawan, kartu KPI, dan daftar persetujuan muncul berurutan dengan jeda $45\text{ ms}$ (`staggerChildren: 0.045`).
* **Kinetic Number Roll-Up:** Angka statistik pada KPI Dashboard dan kalkulasi gaji beranimasi menghitung naik secara halus setiap kali periode atau filter diubah.
* **Micro-Interactions Taktil:**
  * Tombol utama memiliki efek tekan fisik (`whileTap={{ scale: 0.97, y: 1 }}`) dan kilau cahaya melintas (*shimmer sweep*) saat *hover*.
  * Tombol **Clock-In** memancarkan cincin radar berdenyut (*animated pulse ring*) bergradasi `#FA4D09` $\rightarrow$ `#FF9F03` saat menunggu presensi masuk, dan bertransisi menjadi cahaya stabil `#10B981` setelah *Clock-In* berhasil.

### 6.5 Tipografi Futuristik & Presisi Data
* **Display & Headings:** `Outfit` atau `Plus Jakarta Sans` (Weight `600` & `700`, `tracking-tight`) untuk kesan modern dan tegas.
* **Body & UI Controls:** `Plus Jakarta Sans` (Weight `400` & `500`) untuk keterbacaan formulir dan navigasi.
* **Numeric & Financial Data:** `JetBrains Mono` dengan `font-variant-numeric: tabular-nums` wajib diterapkan pada NIP (`SLO-2026-XXX`), jam presensi, durasi kerja, dan seluruh angka Rupiah pada tabel payroll agar kolom sejajar presisi.

---

## 7. Arsitektur Keamanan Website (Enterprise Defense-in-Depth)

Untuk membuktikan kesiapan aplikasi kelas *enterprise* pada portofolio, SuloHR menerapkan arsitektur keamanan berlapis baik pada level *routing*, antarmuka, validasi input, maupun penyimpanan sesi:

### 7.1 Route Protection & RBAC Middleware Enforcement
* **Strict Route Guard:** Setiap rute di bawah `/admin/*` dilindungi oleh *route guard* yang memvalidasi peran aktif (`role === 'HR_ADMIN'`). Jika pengguna dengan peran `EMPLOYEE` mencoba mengakses URL `/admin/payroll` secara langsung melalui bilah alamat browser, sistem memblokir akses, mencatat insiden ke log keamanan, dan mengarahkan kembali ke `/ess/home` dengan peringatan akses ditolak (*403 Access Restricted*).
* **Action-Level Authorization:** Setiap fungsi mutasi data (`approveLeave`, `runPayroll`, `deleteEmployee`, `editAttendance`) melakukan pengecekan otorisasi peran di dalam *state store* sebelum mengeksekusi perubahan, bukan sekadar menyembunyikan tombol pada antarmuka.

### 7.2 Perlindungan Data Pribadi (PII Masking & UU PDP Compliance)
* **Default PII Data Masking:** Data sensitif karyawan seperti Nomor Induk Kependudukan (NIK), Nomor Rekening Bank, NPWP, dan nominal gaji pada tampilan tabel umum disamarkan secara otomatis (`****-****-7821`).
* **Explicit Unmasking & Auto-Relock Timer:** HR Admin harus menekan tombol otorisasi (*Unmask*) untuk melihat data asli, dan sistem otomatis menyamarkannya kembali setelah $30\text{ detik}$ atau saat berpindah halaman (*auto-relock*) untuk mencegah kebocoran visual (*shoulder surfing*).
* **Global Session Privacy Shield:** Tombol *Privacy Shield* di bilah atas memungkinkan seluruh nominal gaji dan data pribadi di layar diburamkan seketika saat HR membagikan layar dalam rapat.

### 7.3 Validasi Input, Sanitasi & Pencegahan Injeksi
* **Strict Schema Validation (Zod):** Seluruh input formulir (tambah karyawan, pengajuan cuti, koreksi absensi) divalidasi menggunakan skema `Zod` (panjang karakter, tipe data, batas tanggal logis, dan sanitasi karakter HTML) sebelum diproses.
* **Anti-XSS & Anti-CSV Formula Injection:**
  * Seluruh teks input bebas (seperti alasan cuti atau catatan penolakan) di-escape secara otomatis dan dibersihkan dari tag skrip berbahaya.
  * Fitur **Ekspor CSV** secara otomatis menambahkan awalan kutip tunggal (`'`) pada nilai sel yang diawali karakter `=`, `+`, `-`, atau `@` untuk mencegah eksekusi makro berbahaya (*CSV Formula Injection*) di aplikasi *spreadsheet*.

### 7.4 Integritas State Demo & Immutable Audit Trail
* **Tamper-Evident Demo Vault:** Data simulasi pada `localStorage` disimpan dengan struktur terversi dan tanda tangan integritas (*checksum*) serta validasi skema saat aplikasi dimuat. Jika struktur JSON dimodifikasi secara ilegal hingga korup/tidak valid, aplikasi otomatis mendeteksi anomali dan memulihkan *snapshot* aman tanpa mengalami *crash*.
* **Immutable Security & Activity Audit Log:** Setiap aksi krusial (persetujuan/penolakan cuti, koreksi jam presensi, penerbitan payroll, upaya akses ilegal, dan pergantian peran) tercatat dalam riwayat audit lengkap dengan stempel waktu (`ISO-8601`), identitas aktor, tingkat keparahan (*Info / Warning / Security Alert*), dan ringkasan perubahan.
* **Slip Gaji Cryptographic Verification Hash:** Setiap slip gaji PDF yang dicetak menyertakan kode referensi dan *verification hash* unik (misal: `SULO-202611-SLO004-9C4E`) untuk membuktikan keaslian dokumen.

### 7.5 Konfigurasi Security Headers (Next.js Production Config)
Untuk implementasi pada `next.config.ts`, aplikasi menyertakan konfigurasi *HTTP Security Headers* standar industri:
* `Content-Security-Policy (CSP)`: Membatasi sumber pemuatan skrip, *stylesheet*, font, dan gambar hanya dari sumber tepercaya.
* `X-Frame-Options: DENY`: Mencegah serangan *Clickjacking* melalui penyematan `<iframe>` ilegal.
* `X-Content-Type-Options: nosniff`: Mencegah *MIME-type sniffing*.
* `Referrer-Policy: strict-origin-when-cross-origin`: Melindungi kebocoran parameter URL sensitif.
* `Permissions-Policy`: Menonaktifkan akses kamera, mikrofon, dan geolokasi yang tidak diperlukan.

---

## 8. Spesifikasi Model Data & Skema Entitas (TypeScript Blueprint)

```ts
export type UserRole = "HR_ADMIN" | "EMPLOYEE";
export type EmploymentStatus = "PKWTT" | "PKWT" | "MAGANG";
export type WorkMode = "WFO" | "WFH" | "DINAS_LUAR";
export type AttendanceStatus = "TEPAT_WAKTU" | "TERLAMBAT" | "CUTI_IZIN" | "BELUM_ABSEN";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Employee {
  id: string;
  nip: string; // Format: SLO-2026-001
  fullName: string;
  email: string;
  phone: string;
  nikMasked: string;
  bankAccount: string; // Disamarkan secara default oleh PII Masking
  bankName: string;
  department: "Engineering" | "Product & Design" | "Marketing" | "Finance" | "HR";
  position: string;
  status: EmploymentStatus;
  joinDate: string; // ISO Date
  contractEndDate?: string; // Khusus PKWT/Magang
  baseSalary: number;
  fixedAllowance: number;
  annualLeaveQuota: number;
  remainingLeaveQuota: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  clockIn: string | null; // HH:mm:ss
  clockOut: string | null; // HH:mm:ss
  workMode: WorkMode;
  status: AttendanceStatus;
  lateMinutes: number;
  auditNote?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: "CUTI_TAHUNAN" | "IZIN_SAKIT" | "CUTI_MELAHIRKAN" | "KLAIM_LEMBUR";
  startDate: string;
  endDate: string;
  effectiveDays: number;
  reason: string;
  attachmentName?: string;
  status: ApprovalStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  details: string;
}
```

---

## 9. Blueprint Token Desain & Konfigurasi CSS (`globals.css`)

```css
@import "tailwindcss";

:root {
  /* 4 Palet Warna Utama Komunitas */
  --sulo-navy: #011D58;
  --sulo-vermilion: #FA4D09;
  --sulo-tangerine: #FC7A0B;
  --sulo-gold: #FF9F03;

  /* Warna Permukaan Futuristik & Semantik Pendukung */
  --sulo-abyss: #020E2B;
  --sulo-glass: rgba(1, 29, 88, 0.54);
  --sulo-glass-elevated: rgba(1, 29, 88, 0.82);
  --sulo-border-glass: rgba(255, 255, 255, 0.12);
  --sulo-border-gold: rgba(255, 159, 3, 0.34);

  --text-primary: #F8FAFC;
  --text-secondary: #CBD5E1;
  --text-muted: #94A3B8;
  --status-success: #10B981;
  --status-info: #38BDF8;
  --status-danger: #F43F5E;
}

/* 1. Sovereign Deep Space Mesh Background */
.bg-sulo-canvas {
  background-color: var(--sulo-abyss);
  background-image:
    radial-gradient(at 88% 10%, rgba(250, 77, 9, 0.24) 0px, transparent 50%),
    radial-gradient(at 72% 28%, rgba(252, 122, 11, 0.14) 0px, transparent 42%),
    radial-gradient(at 12% 88%, rgba(255, 159, 3, 0.16) 0px, transparent 50%),
    linear-gradient(160deg, #011D58 0%, #020E2B 65%, #01133A 100%);
}

/* 2. Solar Ember Primary CTA Gradient */
.bg-sulo-cta {
  background: linear-gradient(135deg, #FA4D09 0%, #FC7A0B 52%, #FF9F03 100%);
  box-shadow: 0 10px 28px -8px rgba(250, 77, 9, 0.55);
}

.bg-sulo-cta:hover {
  background: linear-gradient(135deg, #FF5A17 0%, #FC7A0B 48%, #FFB029 100%);
  box-shadow: 0 14px 32px -6px rgba(255, 159, 3, 0.6);
}

/* 3. Liquid Glass Card & Rim Highlight */
.glass-sulo-card {
  background: linear-gradient(145deg, rgba(1, 29, 88, 0.68) 0%, rgba(2, 14, 43, 0.58) 100%);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--sulo-border-glass);
  box-shadow:
    inset 0 1px 0 0 var(--sulo-border-gold),
    inset 0 0 28px rgba(250, 77, 9, 0.08),
    0 24px 48px -16px rgba(1, 10, 35, 0.78);
}

/* 4. Solar Aurora Text Gradient */
.text-sulo-gradient {
  background: linear-gradient(90deg, #FFFFFF 0%, #FF9F03 48%, #FC7A0B 78%, #FA4D09 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}

/* Print Override: Konversi Tema Gelap Futuristik ke Kertas A4 Putih Bersih */
@media print {
  body {
    background: #FFFFFF !important;
    color: #0F172A !important;
  }
  .no-print {
    display: none !important;
  }
  .print-payslip-sheet {
    background: #FFFFFF !important;
    color: #0F172A !important;
    border: 1px solid #CBD5E1 !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 16mm !important;
  }
}
```

---

## 10. Spesifikasi Non-Fungsional & Kriteria Penyelesaian (Definition of Done v3.0)

| Aspek Kualitas | Target & Kriteria Penerimaan |
| :--- | :--- |
| **Responsivitas Perangkat** | Tata letak *desktop-first* optimal pada resolusi $\ge 1280\text{px}$ untuk tabel HR Admin, dan sepenuhnya responsif pada layar ponsel ($\ge 375\text{px}$) untuk halaman Employee Self-Service tanpa *horizontal overflow*. |
| **Performa Rendering & Motion** | Animasi berjalan stabil pada $60\text{ fps}$ dengan properti GPU (`transform` dan `opacity`). Perpindahan halaman dan *Role Switcher* berlangsung $< 200\text{ ms}$ tanpa *full-page reload*, serta menghormati `prefers-reduced-motion: reduce`. |
| **Konsistensi Identitas & Warna** | Seluruh penamaan produk konsisten menggunakan **SuloHR (PT Sulo)** serta menerapkan $4$ warna utama (`#011D58`, `#FA4D09`, `#FC7A0B`, `#FF9F03`) dan $6$ gradasi turunannya secara harmonis di seluruh halaman. |
| **Verifikasi Keamanan Aktif** | *Route Guard* RBAC memblokir akses ilegal antar-peran, *PII Masking* melindungi data sensitif secara *default* dengan *auto-relock* $30\text{ detik}$, validasi *Zod* dan sanitasi ekspor CSV berjalan aktif, serta *Security Audit Log* mencatat setiap peristiwa penting. |
| **Presisi Cetak Slip Gaji A4** | Pratinjau slip gaji di layar tampil dalam estetika *liquid glassmorphism*, dan saat tombol **Cetak / Simpan PDF** ditekan, dokumen tercetak bersih dalam $1$ halaman A4 potret berlatar putih tanpa elemen navigasi. |