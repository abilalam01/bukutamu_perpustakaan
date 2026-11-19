# Buku Tamu Kampus — Aplikasi Contoh Modul Docker

Aplikasi contoh untuk modul *Cloud Computing: Mengemas dan Menjalankan Aplikasi Web dengan Docker* (pendekatan PjBL).

## Kebutuhan
- Docker Engine 27.x atau lebih baru (Docker Desktop di Windows/macOS)
- Docker Compose v2

## Menjalankan dengan Docker Compose
1. Clone repositori ini lalu masuk ke foldernya.
2. Jalankan `docker compose up -d --build`
3. Buka http://localhost:8080
4. Lihat status: `docker compose ps`
5. Hentikan: `docker compose down` (tambahkan `-v` untuk menghapus data)

## Menjalankan image saja (tanpa basis data)
```
docker build -t modul-web:1.0 .
docker run -d --name web -p 8080:3000 modul-web:1.0
```

## Versi yang dipakai
| Komponen | Versi/tag |
|---|---|
| Image Node.js | node:20-alpine |
| Image basis data | postgres:16-alpine |
| Pustaka pg | 8.13.1 |
