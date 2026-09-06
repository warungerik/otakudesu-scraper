export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const BASE = 'https://otakudesu.blog';
  const type = (req.query.type || 'home').toString();
  const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7', 'Referer': 'https://www.google.com/', 'Upgrade-Insecure-Requests': '1' };
  const RAW = async (url) => { const r = await fetch(url, { headers: UA, redirect: 'follow' }); return { status: r.status, html: await r.text() }; };
  // ponytail: IP datacenter (Vercel) sering diblokir; fallback via proxy publik tanpa dep baru
  const get = async (url, init) => {
    const direct = await RAW(url);
    if (direct.html && direct.html.length > 5000) return direct.html;
    for (const p of [`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`]) {
      try { const r = await fetch(p, { headers: { 'User-Agent': UA['User-Agent'] } }); const t = await r.text(); if (t && t.length > 5000) return t; } catch {}
    }
    return direct.html;
  };
  const pic = (html) => {
    const out = [];
    const re = /<div class=['"]detpost['"]>([\s\S]*?)<\/li>/g;
    let m;
    while ((m = re.exec(html))) {
      const b = m[1];
      const t = (r) => (b.match(r) || [])[1];
      out.push({
        episode: (t(/class=['"]epz['"][^>]*>([\s\S]*?)<\/div>/) || '').replace(/<[^>]+>/g, '').trim(),
        day: (t(/class=['"]epztipe['"][^>]*>([\s\S]*?)<\/div>/) || '').replace(/<[^>]+>/g, '').trim(),
        date: (t(/class=['"]newnime['"][^>]*>([\s\S]*?)<\/div>/) || '').trim(),
        slug: (t(/<a href="https:\/\/otakudesu\.blog\/anime\/([^/]+)\//) || ''),
        title: (t(/class=['"]jdlflm['"][^>]*>([^<]+)/) || '').trim(),
        cover: (t(/<img[^>]+src="([^"]+)"/) || ''),
      });
    }
    return out;
  };

  try {
    if (type === 'home') {
      const html = await get(BASE + '/');
      const [on, cp] = html.split('Complete Anime');
      return res.status(200).json({ ongoing: pic(on), complete: pic(cp || '') });
    }
    if (type === 'ongoing' || type === 'complete') {
      const html = await get(`${BASE}/${type === 'ongoing' ? 'ongoing-anime' : 'complete-anime'}/`);
      return res.status(200).json({ items: pic(html) });
    }
    if (type === 'search') {
      const q = encodeURIComponent(req.query.q || '');
      const html = await get(`${BASE}/?s=${q}&post_type=anime`);
      const out = [];
      const re = /<li style='list-style:none;'>([\s\S]*?)<\/li>/g;
      let m;
      while ((m = re.exec(html))) {
        const b = m[1];
        const t = (r) => (b.match(r) || [])[1] || '';
        out.push({
          title: t(/<h2><a[^>]*>([^<]+)/).trim(),
          slug: t(/\/anime\/([^/]+)\//),
          cover: t(/<img[^>]+src="([^"]+)/),
          genres: t(/<b>Genres<\/b>([\s\S]*?)<\/div>/).replace(/<[^>]+>/g, '').replace(/^ :/, '').trim(),
          status: t(/<b>Status<\/b>([\s\S]*?)<\/div>/).replace(/<[^>]+>/g, '').replace(/^ :/, '').trim(),
          rating: t(/<b>Rating<\/b>([\s\S]*?)<\/div>/).replace(/<[^>]+>/g, '').replace(/^ :/, '').trim(),
        });
      }
      return res.status(200).json({ items: out });
    }
    if (type === 'anime') {
      const slug = req.query.slug;
      const html = await get(`${BASE}/anime/${slug}/`);
      const info = {};
      const im = html.match(/<div class="infozingle">([\s\S]*?)<\/div><\/div>/) || [];
      (im[1] || '').replace(/<p><span><b>([^<]+)<\/b>: ([\s\S]*?)<\/span><\/p>/g, (_, k, v) => {
        info[k.trim()] = v.replace(/<[^>]+>/g, '').trim(); return '';
      });
      const genres = [...(im[1] || '').matchAll(/\/genres\/([^/]+)\/">([^<]+)/g)].map((g) => g[2]);
      const cover = (html.match(/<div class='fotoanime'[\s\S]*?<img[^>]+src="([^"]+)/) || [])[1] || '';
      const eps = [];
      const list = (html.match(/Episode List[\s\S]*?<ul>([\s\S]*?)<\/ul>/) || [])[1] || '';
      list.replace(/<a href="https:\/\/otakudesu\.blog\/episode\/([^/]+)\/"[^>]*>([^<]+)<\/a><\/span><span[^>]*>([^<]*)/g,
        (_, s, t, d) => { eps.push({ slug: s, title: t.trim(), date: d.trim() }); return ''; });
      const batch = (html.match(/monktit">([^<]*Batch[^<]*)<\/span><\/div><ul>([\s\S]*?)<\/ul>/) || [])[2] || '';
      const batchLinks = [...batch.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)</g)].map((m) => ({ url: m[1], label: m[2] }));
      return res.status(200).json({ info, genres, cover, episodes: eps, batch: batchLinks });
    }
    if (type === 'episode') {
      const slug = req.query.slug;
      const html = await get(`${BASE}/episode/${slug}/`);
      const iframe = (html.match(/responsive-embed-stream"><iframe src="([^"]+)/) || [])[1] || '';
      const title = (html.match(/<h1 class="posttl">([^<]+)/) || [])[1] || '';
      const prev = (html.match(/class='flir'><a href="https:\/\/otakudesu\.blog\/episode\/([^/]+)\/" title="Episode Sebelumnya"/) || [])[1] || '';
      const anime = (html.match(/rel="follow"[^>]*href="https:\/\/otakudesu\.blog\/anime\/([^/]+)/) || [])[1] || '';
      const servers = [];
      (html.match(/<div class="mirrorstream"[\s\S]*?<\/div><\/div>/) || [''])
        .toString().replace(/Mirror (\w+)<li>([\s\S]*?)(?=<\/ul|$)/g, (_, q, li) => {
          const opts = [...li.matchAll(/data-content="([^"]+)"[^>]*>([^<]+)</g)]
            .map((m) => ({ q, label: m[2].trim(), token: m[1], payload: JSON.parse(Buffer.from(m[1], 'base64').toString()) }));
          servers.push(...opts); return '';
        });
      // ponytail: download links = link.desustream redirect asli situs, diteruskan apa adanya
      const downloads = [];
      html.replace(/<li><strong>([^<]+)<\/strong>([\s\S]*?)(?=<\/li>)/g, (_, fmt, links) => {
        const items = [...links.matchAll(/<a href="([^"]+)"[^>]*>([^<]+?)\s*<\/a>/g)]
          .map((m) => ({ host: m[2].trim(), url: m[1] }));
        const size = (links.match(/<i>([^<]+)<\/i>/) || [])[1] || '';
        if (items.length) downloads.push({ format: fmt.trim(), size, links: items });
        return '';
      });
      const allEps = [...html.matchAll(/<option value="https:\/\/otakudesu\.blog\/episode\/([^/]+)\/"[^>]*>([^<]+)</g)]
        .map((m) => ({ slug: m[1], label: m[2] }));
      return res.status(200).json({ title, iframe, prev, anime, servers, downloads, allEps });
    }
    if (type === 'mirror') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const nonceAction = 'aa1208d27f29ca340c92c66d1926f13f';
      const playAction = '2a3505c93b0035d3f455df82bf976b84';
      const post = async (data) => (await fetch(`${BASE}/wp-admin/admin-ajax.php`, {
        method: 'POST', headers: { ...UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data),
      })).json();
      let nonce = body.nonce;
      if (!nonce) nonce = (await post({ action: nonceAction })).data;
      const r = await post({ ...body.payload, nonce, action: playAction });
      return res.status(200).json({ nonce, html: Buffer.from(r.data, 'base64').toString() });
    }
    return res.status(400).json({ error: 'unknown type' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
