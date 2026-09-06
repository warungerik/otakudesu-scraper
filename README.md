# Otakudesu Scraper

Satu file scraper anime subtitle Indonesia. Nol dependensi. Node 18+.

![Node](https://img.shields.io/badge/node-%3E%3D18-16a34a?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)
![Zero Deps](https://img.shields.io/badge/deps-0-lightgrey)
![ESM](https://img.shields.io/badge/module-ESM-2563eb)

## Isi Repo

| File | Fungsi |
| --- | --- |
| `otakudesu.js` | Scraper utama (6 fungsi). |
| `index.html` + `docs.css` + `docs.js` | Web dokumentasi (Vue 3 via CDN, deploy langsung ke Vercel). |
| `vercel.json` | Routing statis untuk Vercel. |
| `LICENSE` | Lisensi MIT. |

## Install

Tidak ada install. Node 18+ sudah cukup, `fetch` bawaan.

```bash
node --version
```

## Cara Pakai

Simpan `otakudesu.js` di project, lalu:

```js
import { getHome, getList, search, getAnime, getEpisode, resolveMirror } from './otakudesu.js';
```

### 1. `getHome()`

Ambil ongoing + complete dari halaman depan.

```js
const { ongoing, complete } = await getHome();
```

Return:

```
ongoing:  [{ title, slug, episode, day, date, cover }]
complete: [{ title, slug, episode, day, date, cover }]
```

Contoh nilai:

```json
{
  "title": "Neko to Ryuu",
  "slug": "neko-ryuu-sub-indo",
  "episode": "Episode 11",
  "day": "Sabtu",
  "date": "06 Sep",
  "cover": "https://otakudesu.blog/wp-content/uploads/2026/07/157796.jpg"
}
```

### 2. `getList(type)`

Arsip penuh.

```js
const ongoing = await getList('ongoing');
const complete = await getList('complete');
```

`type` hanya menerima `'ongoing'` atau `'complete'`. Default `'ongoing'`.

### 3. `search(query)`

Cari anime.

```js
const hasil = await search('naruto');
```

Return:

```json
[
  {
    "title": "Boruto: Naruto Next Generations Subtitle Indonesia",
    "slug": "borot-sub-indo",
    "cover": "https://otakudesu.blog/wp-content/uploads/2020/05/Boruto-Sub-Indo.jpg",
    "genres": "Action, Adventure, Martial Arts, Shounen, Super Power",
    "status": "Drop",
    "rating": "6.15"
  }
]
```

### 4. `getAnime(slug)`

Detail anime + daftar episode.

```js
const anime = await getAnime('slime-s4-sub-indo');
```

Return:

```
{
  info,      // Judul, Japanese, Skor, Produser, Tipe, Status, Durasi, Tanggal Rilis, Studio
  genres,    // ["Action", "Comedy", ...]
  cover,
  episodes,  // [{ slug, title, date }]
  batch      // [{ url, label }]
}
```

`slug` diambil dari field `slug` hasil `getHome()` / `search()`. Contoh yang valid: `slime-s4-sub-indo`, `borot-sub-indo`.

### 5. `getEpisode(slug)`

Data nonton dan download.

```js
const ep = await getEpisode('tenslem-s4-episode-21-sub-indo');
```

Return:

```
{
  title,
  video,       // MP4 langsung, contoh: https://cdn.odcloud.net/anime/....mp4
  iframe,      // embed desustream, fallback kalau video kosong
  prev,        // slug episode sebelumnya
  servers,     // [{ quality, label, payload }] — payload dipakai resolveMirror
  downloads,   // [{ format, size, links: [{ host, url }] }]
  allEpisodes  // [{ slug, label }]
}
```

Pakai `video` untuk tag `<video>` langsung:

```html
<video src="..." controls playsinline></video>
```

Link di `downloads[].links[].url` adalah redirect asli situs (`link.desustream.com`), buka di tab baru.

### 6. `resolveMirror(payload, nonce?)`

Tukar server player (filedon, vidhide, mega, odcdn).

```js
const ep = await getEpisode('tenslem-s4-episode-21-sub-indo');
const r = await resolveMirror(ep.servers[0].payload);
console.log(r.iframe);
```

`payload` wajib dari `ep.servers[].payload`. `nonce` opsional, diambil otomatis kalau kosong.

## Test Cepat

```bash
node otakudesu.js
```

Output yang diharapkan:

```
Home ongoing: 15
```

## Deploy Docs ke Vercel

Repo ini sudah termasuk web dokumentasi statis.

```bash
git add -A
git commit -m "docs"
git push
```

Vercel: Import repo > Deploy. Tanpa build command.

## Error Umum

| Gejala | Penyebab | Perbaikan |
| --- | --- | --- |
| `HTTP 403` | IP datacenter diblokir Cloudflare | Jalankan dari IP rumah, bukan server. |
| `video` kosong | Embed bukan desustream | Pakai `iframe` sebagai fallback. |
| `episodes` kosong | Slug salah | Ambil slug dari `getHome()` / `search()`, bukan tebak manual. |

## Batasan

Sumber data milik pihak ketiga (`otakudesu.blog`). Struktur HTML bisa berubah sewaktu-waktu. Kode ini hanya membaca halaman publik.

## Donasi

Terbantu? Traktir kopi:

[![Buy Me A Coffee](https://img.shields.io/badge/☕-Buy%20Me%20A%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://warungerik.com/payment)

https://warungerik.com/payment

## Lisensi

MIT. Lihat `LICENSE`.
