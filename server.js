const http = require("http");
const { Pool } = require("pg");

const PORT = process.env.PORT || 3000;
const pakaiDB = Boolean(process.env.DB_HOST);
const pool = pakaiDB
  ? new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })
  : null;
const memori = [];

async function siapkanTabel() {
  if (!pakaiDB) return;
  await pool.query(
    "CREATE TABLE IF NOT EXISTS tamu (id SERIAL PRIMARY KEY, nama TEXT NOT NULL, pesan TEXT NOT NULL, waktu TIMESTAMP DEFAULT NOW())"
  );
}

async function ambilTamu() {
  if (!pakaiDB) return memori;
  const hasil = await pool.query("SELECT nama, pesan FROM tamu ORDER BY id DESC");
  return hasil.rows;
}

async function simpanTamu(nama, pesan) {
  if (!pakaiDB) return memori.unshift({ nama, pesan });
  await pool.query("INSERT INTO tamu (nama, pesan) VALUES ($1, $2)", [nama, pesan]);
}

function amankan(teks) {
  return String(teks).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

const GAYA = `
*{box-sizing:border-box}
body{margin:0;font-family:"Plus Jakarta Sans",Segoe UI,Arial,sans-serif;
  background:#f1f5fb;color:#1e293b}
header{position:relative;overflow:hidden;color:#fff;text-align:center;
  padding:48px 16px 80px;background:linear-gradient(135deg,#1e3a8a,#2563eb 60%,#0ea5e9)}
header::before,header::after{content:"";position:absolute;border-radius:50%;
  background:rgba(255,255,255,.08)}
header::before{width:260px;height:260px;top:-90px;left:-60px}
header::after{width:200px;height:200px;bottom:-110px;right:-40px}
.logo{font-size:40px}
header h1{margin:8px 0 4px;font-size:32px;font-weight:800;letter-spacing:-.5px}
header p{margin:0;opacity:.9}
main{position:relative;max-width:660px;margin:-52px auto 24px;padding:0 16px}
.kartu{background:#fff;border-radius:18px;padding:24px;margin-bottom:20px;
  box-shadow:0 10px 30px rgba(30,58,138,.12)}
.kartu h2{margin:0 0 16px;font-size:20px;display:flex;align-items:center;gap:10px}
.jumlah{background:#dbeafe;color:#1e40af;border-radius:20px;padding:2px 12px;font-size:14px}
.status{display:inline-block;background:#dcfce7;color:#166534;border-radius:20px;
  padding:5px 14px;font-size:13px;font-weight:600;margin-bottom:16px}
label{font-weight:600;font-size:14px}
input,textarea{width:100%;padding:12px 14px;margin:6px 0 14px;border:2px solid #e2e8f0;
  border-radius:12px;font:inherit;background:#f8fafc;transition:.2s}
input:focus,textarea:focus{outline:none;border-color:#2563eb;background:#fff}
button{width:100%;background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff;
  border:0;border-radius:12px;padding:13px;font:inherit;font-weight:700;
  cursor:pointer;transition:.2s}
button:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(249,115,22,.35)}
ul{list-style:none;padding:0;margin:0}
li{display:flex;gap:14px;padding:14px;border-radius:14px;background:#f8fafc;
  margin-bottom:10px;transition:.2s}
li:hover{background:#eff6ff}
.avatar{flex:none;width:42px;height:42px;border-radius:50%;color:#fff;
  font-weight:700;display:grid;place-items:center}
li b{display:block;color:#1e3a8a}
li span{color:#475569}
.kosong{color:#94a3b8;text-align:center;padding:20px}
footer{text-align:center;color:#94a3b8;font-size:13px;padding-bottom:28px}`;

const WARNA = ["#2563eb", "#f97316", "#16a34a", "#9333ea", "#e11d48", "#0891b2"];

function warnaAvatar(nama) {
  let total = 0;
  for (const huruf of nama) total = (total * 31 + huruf.charCodeAt(0)) % 997;
  return WARNA[total % WARNA.length];
}

function halaman(daftar) {
  const isi = daftar
    .map((t) => `<li><div class="avatar" style="background:${warnaAvatar(t.nama)}">
${amankan(t.nama.charAt(0).toUpperCase())}</div>
<div><b>${amankan(t.nama)}</b><span>${amankan(t.pesan)}</span></div></li>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Buku Tamu Kampus</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap">
<style>${GAYA}</style></head><body>
<header><div class="logo">&#127891;</div><h1>Buku Tamu Kampus</h1>
<p>Terima kasih telah berkunjung! Tinggalkan nama dan pesan Anda.</p></header>
<main>
<div class="kartu">
<span class="status">&#9679; Penyimpanan: ${pakaiDB ? "PostgreSQL" : "memori sementara"}</span>
<form method="POST" action="/">
<label>Nama</label><input name="nama" placeholder="Nama lengkap" required>
<label>Pesan</label><textarea name="pesan" rows="3" placeholder="Tulis pesan atau kesan Anda" required></textarea>
<button type="submit">Kirim Pesan</button></form></div>
<div class="kartu"><h2>Daftar Tamu <span class="jumlah">${daftar.length}</span></h2>
<ul>${isi || '<p class="kosong">Belum ada tamu. Jadilah yang pertama!</p>'}</ul></div>
</main>
<footer>Dijalankan di dalam container Docker &#128051;</footer>
</body></html>`;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST") {
      let badan = "";
      for await (const potong of req) badan += potong;
      const data = new URLSearchParams(badan);
      await simpanTamu(data.get("nama") || "Anonim", data.get("pesan") || "-");
      res.writeHead(303, { Location: "/" });
      return res.end();
    }
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      return res.end("OK");
    }
    const daftar = await ambilTamu();
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(halaman(daftar));
  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Terjadi galat: " + err.message);
  }
});

siapkanTabel()
  .then(() => server.listen(PORT, () =>
    console.log(`Buku Tamu berjalan di port ${PORT} (DB: ${pakaiDB})`)))
  .catch((err) => { console.error("Gagal terhubung ke DB:", err.message); process.exit(1); });
