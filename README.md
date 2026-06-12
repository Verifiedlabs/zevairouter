<div align="center">

# ZevaiRouter

**Satu dashboard untuk merutekan, mengotomasi, dan memantau semua provider AI kamu.**

ZevaiRouter adalah AI router self-hosted dengan API yang kompatibel-OpenAI, otomasi multi-akun, dan pelacakan kuota bawaan — dibungkus dashboard 3D yang modern.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Node](https://img.shields.io/badge/Node-%E2%89%A518-339933)
![License](https://img.shields.io/badge/License-MIT-blue)

</div>

---

## ✨ Fitur Utama

- **Router terpadu** — satu endpoint kompatibel-OpenAI (`/v1`) di depan banyak provider AI.
- **Otomasi multi-akun** — hubungkan dan rotasi banyak akun provider secara otomatis.
- **Pelacak kuota (Quota Tracker)** — lihat penggunaan & limit tiap provider/akun secara real-time dalam satu layar.
- **Dashboard 3D** — antarmuka glassmorphism dengan kedalaman, bayangan lembut berlapis, dan animasi hover yang halus.
- **Self-hosted** — jalankan di lokal atau server sendiri. API key kamu tetap milikmu.
- **API kompatibel-OpenAI** — langsung dipakai oleh tool/coding agent yang sudah mendukung format OpenAI.

## 🚀 Mulai Cepat

```bash
# 1. Siapkan environment
cp .env.example .env

# 2. Install dependency
npm install

# 3. Build & jalankan
npm run build
npm run start
```

Setelah jalan, buka:

| Halaman | URL |
| --- | --- |
| Dashboard | `http://localhost:20128/dashboard` |
| API (OpenAI-compatible) | `http://localhost:20128/v1` |
| Automation | `http://localhost:20128/dashboard/automation` |
| Quota Tracker | `http://localhost:20128/dashboard/quota` |

> Untuk pengembangan dengan hot-reload, gunakan `npm run dev`.

## 🌐 Akses Publik / Hosting

Secara default app bind ke semua interface (`0.0.0.0`) supaya bisa diakses dari luar localhost. Untuk produksi:

```bash
npm run build
PORT=20128 HOSTNAME=0.0.0.0 NEXT_PUBLIC_BASE_URL=http://<host-atau-domain-kamu>:20128 npm run start
```

## ⚙️ Konfigurasi (`.env`)

| Variabel | Keterangan |
| --- | --- |
| `JWT_SECRET` | Secret acak untuk menandatangani sesi login (wajib diganti). |
| `INITIAL_PASSWORD` | Password awal untuk login pertama ke dashboard. |
| `REQUIRE_API_KEY` | `true` untuk mewajibkan API key saat memanggil `/v1`. |
| `AUTH_COOKIE_SECURE` | `true` jika diakses lewat HTTPS. |
| `BASE_URL` / `NEXT_PUBLIC_BASE_URL` | URL dasar tempat app diakses. |
| `PORT` / `HOSTNAME` | Port (default `20128`) dan host bind (default `0.0.0.0`). |

Lihat `.env.example` untuk daftar lengkapnya.

## 🐳 Docker

```bash
docker build -t zevairouter .
docker run -d -p 20128:20128 \
  -e JWT_SECRET="ganti-dengan-string-acak" \
  -e INITIAL_PASSWORD="password-kamu" \
  --name zevairouter zevairouter
```

## 🧱 Tech Stack

- **Next.js 16** + **React 19** (App Router, output standalone)
- **Tailwind CSS v4**
- **Express** untuk layer proxy/API
- **SQLite** (`better-sqlite3` opsional, fallback `sql.js`) untuk penyimpanan lokal

## 📄 Lisensi

Dirilis di bawah lisensi **MIT** — lihat berkas [LICENSE](LICENSE).
