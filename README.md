# Otakudesu Scraper

Scraper otakudesu.blog Nol dependensi. Node 18+.

![Node](https://img.shields.io/badge/node-%3E%3D18-16a34a?logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)
![Zero Deps](https://img.shields.io/badge/deps-0-lightgrey)
![ESM](https://img.shields.io/badge/module-ESM-2563eb)

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

Arsip penuh. `type`: `'ongoing'` | `'complete'`. Default `'ongoing'`.

```js
const ongoing = await getList('ongoing');
const complete = await getList('complete');
```

Item sama seperti `getHome()`.

### 3. `search(query)`

Cari anime.

```js
const hasil = await search('slime');
```

```json
{
  "title": "Tensei shitara Slime Datta Ken Season 4 Subtitle Indonesia",
  "slug": "slime-s4-sub-indo",
  "cover": "https://otakudesu.blog/wp-content/uploads/2026/04/156389.jpg",
  "genres": "Action, Comedy, Fantasy, Isekai, Reincarnation, Shounen",
  "status": "Ongoing",
  "rating": "7.69"
}
```

### 4. `getAnime(slug)`

Detail anime + daftar episode. `slug` dari `getHome()` / `search()`.

```js
const anime = await getAnime('slime-s4-sub-indo');
```

```json
{
  "info": {
    "Judul": "Tensei shitara Slime Datta Ken Season 4",
    "Japanese": "転生したらスライムだった件 第4期",
    "Skor": "7.69",
    "Produser": "Bandai Namco Filmworks",
    "Tipe": "TV",
    "Status": "Ongoing",
    "Total Episode": "Unknown",
    "Durasi": "24 min.",
    "Tanggal Rilis": "Apr 03, 2026",
    "Studio": "8bit",
    "Genre": "Action, Comedy, Fantasy, Isekai, Reincarnation, Shounen"
  },
  "genres": ["Action", "Comedy", "Fantasy", "Isekai", "Reincarnation", "Shounen"],
  "cover": "https://otakudesu.blog/wp-content/uploads/2026/04/156389.jpg",
  "episodes": [
    {
      "slug": "tenslem-s4-episode-21-sub-indo",
      "title": "Tensei shitara Slime Datta Ken Season 4 Episode 21 Subtitle Indonesia",
      "date": "4 September,2026"
    }
  ],
  "batch": []
}
```

### 5. `getEpisode(slug)`

Data nonton dan download. `slug` dari `anime.episodes[].slug`.

```js
const ep = await getEpisode('tenslem-s4-episode-21-sub-indo');
```

```json
{
  "title": "Tensei shitara Slime Datta Ken Season 4 Episode 21 Subtitle Indonesia",
  "video": "https://cdn.odcloud.net/anime/Otakudesu.io_TenseiSlime.S4--21_720p.mp4",
  "iframe": "https://desustream.net/dstream/odcdn/?id=TXdXSlhBdGVKMGNnWkQyZHF4NWR0dEU1cTNuejAyYlFzR1FvaWU5bEhVcVJUYnRPYTlZQjZtSnNnaElUaWdWaA==",
  "prev": "tenslem-s4-episode-20-sub-indo",
  "servers": [
    {
      "quality": "720p",
      "label": "odstream",
      "token": "eyJpZCI6MjAzNjU2LCJpIjowLCJxIjoiNzIwcCJ9",
      "payload": { "id": 203656, "i": 0, "q": "720p" }
    }
  ],
  "downloads": [
    {
      "format": "Mp4 360p",
      "size": "32.9 MB",
      "links": [
        { "host": "Filedon", "url": "https://link.desustream.com/?id=..." }
      ]
    }
  ],
  "allEpisodes": [
    { "slug": "tenslem-s4-episode-21-sub-indo", "label": "Episode 21" }
  ]
}
```

Pakai `video` untuk tag `<video>` langsung:

```html
<video src="..." controls playsinline></video>
```

Link `downloads[].links[].url` adalah redirect asli situs, buka di tab baru.

### 6. `resolveMirror(payload, nonce?)`

Tukar server player. `payload` dari `ep.servers[].payload`.

```js
const r = await resolveMirror(ep.servers[0].payload);
console.log(r.iframe);
```

Return: `{ nonce, html, iframe }`.

## Test Cepat

```bash
node otakudesu.js
```

Output JSON: `{ home, listCount, found, anime, ep }`. Contoh lengkap: `respon.log`.

## Error Umum

| Gejala | Penyebab | Perbaikan |
| --- | --- | --- |
| `HTTP 403` | IP datacenter diblokir Cloudflare | Jalankan dari IP rumah, bukan server. |
| `video` kosong | Embed bukan desustream | Pakai `iframe` sebagai fallback. |
| `episodes` kosong | Slug salah | Ambil slug dari `getHome()` / `search()`, bukan tebak manual. |

## Batasan

Sumber data milik pihak ketiga (`otakudesu.blog`). Struktur HTML bisa berubah sewaktu-waktu. Kode ini hanya membaca halaman publik.

## Terms

# Terms of Use & Disclaimer

Project ini dibuat hanya untuk tujuan edukasi dan riset teknis (educational purpose).

1. **Hak Cipta**: Seluruh konten media, video, poster, dan materi intelektual yang diambil melalui scraper ini adalah milik sah dari pemilik hak cipta dan penyedia aslinya.
2. **Penggunaan**: Pengembang tidak berafiliasi dengan penyedia konten terkait dan tidak bertanggung jawab atas segala bentuk penyalahgunaan script ini oleh pihak ketiga.
3. **Tanpa Garansi**: Script ini disediakan "as is" tanpa jaminan ketersediaan atau kelanjutan fungsi jika struktur web sumber berubah.
[`TERMS.md`](./TERMS.md).

## Donasi

Terbantu? Traktir kopi:

[![Buy Me A Coffee](https://img.shields.io/badge/☕-Buy%20Me%20A%20Coffee-FFDD00?logo=buymeacoffee&logoColor=black)](https://warungerik.com/payment)

## Lisensi

MIT. Lihat [`LICENSE`](./LICENSE).
