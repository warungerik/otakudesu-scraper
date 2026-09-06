const BASE = 'https://otakudesu.blog';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' };

const get = async (url) => {
  const res = await fetch(url, { headers: UA, redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
};

const parseCards = (html) => {
  const items = [];
  const re = /<div class=['"]detpost['"]>([\s\S]*?)<\/li>/g;
  let m;
  while ((m = re.exec(html))) {
    const block = m[1];
    const pick = (r) => (block.match(r) || [])[1] || '';
    items.push({
      title: pick(/class=['"]jdlflm['"][^>]*>([^<]+)/).trim(),
      slug: pick(/<a href="https:\/\/otakudesu\.blog\/anime\/([^/]+)\//),
      episode: pick(/class=['"]epz['"][^>]*>([\s\S]*?)<\/div>/).replace(/<[^>]+>/g, '').trim(),
      day: pick(/class=['"]epztipe['"][^>]*>([\s\S]*?)<\/div>/).replace(/<[^>]+>/g, '').trim(),
      date: pick(/class=['"]newnime['"][^>]*>([\s\S]*?)<\/div>/).trim(),
      cover: pick(/<img[^>]+src="([^"]+)"/),
    });
  }
  return items;
};

export async function getHome() {
  const html = await get(BASE + '/');
  const [on, cp] = html.split('Complete Anime');
  return { ongoing: parseCards(on), complete: parseCards(cp || '') };
}

export async function getList(type = 'ongoing') {
  const path = type === 'ongoing' ? 'ongoing-anime' : 'complete-anime';
  const html = await get(`${BASE}/${path}/`);
  return parseCards(html);
}

export async function search(query) {
  const html = await get(`${BASE}/?s=${encodeURIComponent(query)}&post_type=anime`);
  const items = [];
  const re = /<li style='list-style:none;'>([\s\S]*?)<\/li>/g;
  let m;
  while ((m = re.exec(html))) {
    const b = m[1];
    const pick = (r) => (b.match(r) || [])[1] || '';
    items.push({
      title: pick(/<h2><a[^>]*>([^<]+)/).trim(),
      slug: pick(/\/anime\/([^/]+)\//),
      cover: pick(/<img[^>]+src="([^"]+)/),
      genres: pick(/<b>Genres<\/b>([\s\S]*?)<\/div>/).replace(/<[^>]+>/g, '').replace(/^ :/, '').trim(),
      status: pick(/<b>Status<\/b>([\s\S]*?)<\/div>/).replace(/<[^>]+>/g, '').replace(/^ :/, '').trim(),
      rating: pick(/<b>Rating<\/b>([\s\S]*?)<\/div>/).replace(/<[^>]+>/g, '').replace(/^ :/, '').trim(),
    });
  }
  return items;
}

export async function getAnime(slug) {
  const html = await get(`${BASE}/anime/${slug}/`);
  const info = {};
  const im = html.match(/<div class="infozingle">([\s\S]*?)<\/div><\/div>/) || [];
  (im[1] || '').replace(/<p><span><b>([^<]+)<\/b>: ([\s\S]*?)<\/span><\/p>/g, (_, k, v) => {
    info[k.trim()] = v.replace(/<[^>]+>/g, '').trim();
    return '';
  });
  const genres = [...(im[1] || '').matchAll(/\/genres\/([^/]+)\/">([^<]+)/g)].map((g) => g[2]);
  const cover = (html.match(/<div class='fotoanime'[\s\S]*?<img[^>]+src="([^"]+)/) || [])[1] || '';

  const episodes = [];
  const list = (html.match(/Episode List[\s\S]*?<ul>([\s\S]*?)<\/ul>/) || [])[1] || '';
  list.replace(/<a href="https:\/\/otakudesu\.blog\/episode\/([^/]+)\/"[^>]*>([^<]+)<\/a><\/span><span[^>]*>([^<]*)/g,
    (_, epSlug, title, date) => {
      episodes.push({ slug: epSlug, title: title.trim(), date: date.trim() });
      return '';
    });

  const batch = (html.match(/monktit">([^<]*Batch[^<]*)<\/span><\/div><ul>([\s\S]*?)<\/ul>/) || [])[2] || '';
  const batchLinks = [...batch.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)</g)].map((m) => ({ url: m[1], label: m[2] }));

  return { info, genres, cover, episodes, batch: batchLinks };
}

export async function getEpisode(slug) {
  const html = await get(`${BASE}/episode/${slug}/`);
  const iframe = (html.match(/responsive-embed-stream"><iframe src="([^"]+)/) || [])[1] || '';
  const title = (html.match(/<h1 class="posttl">([^<]+)/) || [])[1] || '';
  const prev = (html.match(/class='flir'><a href="https:\/\/otakudesu\.blog\/episode\/([^/]+)\/" title="Episode Sebelumnya"/) || [])[1] || '';

  let video = '';
  if (iframe.includes('desustream.net')) {
    try {
      const eh = await (await fetch(iframe, { headers: { Referer: `${BASE}/`, ...UA } })).text();
      video = (eh.match(/videoURL\s*=\s*"([^"]+)"/) || [])[1] || '';
    } catch {}
  }

  const servers = [];
  (html.match(/<div class="mirrorstream"[\s\S]*?<\/div><\/div>/) || [''])
    .toString().replace(/Mirror (\w+)<li>([\s\S]*?)(?=<\/ul|$)/g, (_, q, li) => {
      const opts = [...li.matchAll(/data-content="([^"]+)"[^>]*>([^<]+)</g)]
        .map((m) => ({ quality: q, label: m[2].trim(), token: m[1], payload: JSON.parse(Buffer.from(m[1], 'base64').toString()) }));
      servers.push(...opts);
      return '';
    });

  const downloads = [];
  html.replace(/<li><strong>([^<]+)<\/strong>([\s\S]*?)(?=<\/li>)/g, (_, format, links) => {
    const items = [...links.matchAll(/<a href="([^"]+)"[^>]*>([^<]+?)\s*<\/a>/g)].map((m) => ({ host: m[2].trim(), url: m[1] }));
    const size = (links.match(/<i>([^<]+)<\/i>/) || [])[1] || '';
    if (items.length) downloads.push({ format: format.trim(), size, links: items });
    return '';
  });

  const allEpisodes = [...html.matchAll(/<option value="https:\/\/otakudesu\.blog\/episode\/([^/]+)\/"[^>]*>([^<]+)</g)]
    .map((m) => ({ slug: m[1], label: m[2] }));

  return { title, video, iframe, prev, servers, downloads, allEpisodes };
}

export async function resolveMirror(payload, nonce) {
  const post = async (data) => (await fetch(`${BASE}/wp-admin/admin-ajax.php`, {
    method: 'POST',
    headers: { ...UA, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(data),
  })).json();

  if (!nonce) {
    const r = await post({ action: 'aa1208d27f29ca340c92c66d1926f13f' });
    nonce = r.data;
  }
  const res = await post({ ...payload, nonce, action: '2a3505c93b0035d3f455df82bf976b84' });
  const embedHtml = Buffer.from(res.data, 'base64').toString();
  const iframeSrc = (embedHtml.match(/src="([^"]+)/) || [])[1] || '';
  return { nonce, html: embedHtml, iframe: iframeSrc };
}

if (process.argv[1]?.endsWith('otakudesu.js')) {
  const home = await getHome();
  console.log('Home ongoing:', home.ongoing.length);
}
