# Ajaxtreon Storefront

Ajaxtreon Storefront adalah frontend e-commerce berbasis **Nuxt 3** yang terintegrasi dengan **Ajaxtreon Backend** (ERP). Aplikasi ini memungkinkan pelanggan untuk menjelajahi produk, membuat pesanan, dan melakukan pembayaran melalui antarmuka pengguna yang responsif dan modern.

---

## 📦 Fitur Utama

* Menampilkan katalog produk dengan gambar dan deskripsi
* Filter dan pencarian produk
* Keranjang belanja
* Checkout dan integrasi pembayaran (Midtrans)
* Riwayat pesanan pelanggan
* Login & register pelanggan (Firebase Auth atau custom auth)
* Desain responsif untuk desktop dan mobile

---

## 🚀 Teknologi yang Digunakan

* **Nuxt 3** – Framework Vue generasi terbaru
* **TypeScript** – Bahasa utama
* **Tailwind CSS** – Styling responsif
* **Firebase Authentication** – Login & register pelanggan
* **Cloudinary** – Penyimpanan dan optimasi gambar
* **Midtrans (Sandbox)** – Simulasi pembayaran
* **Pinia** – Manajemen state
* **Axios** – HTTP client untuk integrasi API backend

---

## 📂 Struktur Direktori

```
src/
├── components/      # Komponen UI reusable
├── pages/           # Halaman aplikasi
├── store/           # State management (Pinia)
├── composables/     # Reusable logic/functions
├── assets/          # Gambar, style global
├── utils/           # Helper functions
├── plugins/         # Plugin Nuxt
└── types/           # TypeScript types
```

---

## 🔧 Instalasi

### Prasyarat

* Node.js 18.x atau lebih baru
* NPM / Yarn / pnpm

### Langkah-langkah

1. **Clone repositori**

```bash
git clone https://github.com/Ajax-Z01/ajaxtreon-storefront.git
cd ajaxtreon-storefront
```

2. **Install dependencies**

```bash
npm install
# atau
yarn install
```

3. **Salin dan atur file `.env`**

```bash
cp .env.example .env
```

Isi dengan konfigurasi berikut:

```
NUXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NUXT_PUBLIC_FIREBASE_API_KEY=...
NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NUXT_PUBLIC_FIREBASE_PROJECT_ID=...
NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NUXT_PUBLIC_FIREBASE_APP_ID=...

NUXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
NUXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...

NUXT_PUBLIC_MIDTRANS_CLIENT_KEY=...
```

---

## ▶️ Menjalankan Proyek

### Mode Development

```bash
npm run dev
```

### Build untuk Production

```bash
npm run build
npm run preview
```

### Format Kode

```bash
npm run lint
```

---

## 📄 Lisensi

MIT License