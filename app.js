const API = '/api/proxy';
const app = document.getElementById('app');
const j = (u, o) => fetch(u, o).then((r) => r.json());
const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const card = (a) => `
  <a class="card" href="#/anime/${a.slug}">
    <div class="thumb">
      <img loading="lazy" src="${esc(a.cover)}" alt="${esc(a.title)}" onerror="this.style.display='none'">
      <span class="badge">${esc(a.episode || a.rating || '')}</span>
      ${a.date ? `<span class="badge date">${esc(a.date)}</span>` : ''}
    </div>
    <div class="card-body">
      <div class="card-title">${esc(a.title)}</div>
      <div class="card-sub">${esc(a.day || a.genres || a.status || '')}</div>
    </div>
  </a>`;

async function home() {
  app.innerHTML = '<p class="muted">Memuat…</p>';
  try {
    const d = await j(`${API}?type=home`);
    app.innerHTML = `
      <h2>Ongoing Anime <a href="#/ongoing">Lihat semua →</a></h2>
      <div class="grid">${d.ongoing.map(card).join('')}</div>
      <h2>Complete Anime <a href="#/complete">Lihat semua →</a></h2>
      <div class="grid">${d.complete.map(card).join('')}</div>`;
  } catch { app.innerHTML = '<p class="muted">Gagal memuat. Coba lagi.</p>'; }
}

async function list(kind) {
  app.innerHTML = '<p class="muted">Memuat…</p>';
  const d = await j(`${API}?type=${kind}`);
  app.innerHTML = `<h2>${kind === 'ongoing' ? 'Ongoing' : 'Complete'} Anime</h2>
    <div class="grid">${(d.items || []).map(card).join('')}</div>`;
}

async function search(q) {
  app.innerHTML = '<p class="muted">Mencari…</p>';
  const d = await j(`${API}?type=search&q=${encodeURIComponent(q)}`);
  if (!d.items?.length) { app.innerHTML = `<p class="muted">Tidak ada hasil untuk "${esc(q)}".</p>`; return; }
  app.innerHTML = `<h2>Hasil: ${esc(q)}</h2><div class="grid">${d.items.map(card).join('')}</div>`;
}

async function anime(slug) {
  app.innerHTML = '<p class="muted">Memuat…</p>';
  const d = await j(`${API}?type=anime&slug=${slug}`);
  const kv = Object.entries(d.info || {}).map(([k, v]) => `<div class="kv"><b>${esc(k)}</b>: ${esc(v)}</div>`).join('');
  app.innerHTML = `
    <div class="detail-hero">
      <img src="${esc(d.cover)}" alt="">
      <div class="detail-info">
        <h1>${esc(d.info?.Judul || slug)}</h1>
        <div class="tags">${(d.genres || []).map((g) => `<span>${esc(g)}</span>`).join('')}</div>
        ${kv}
      </div>
    </div>
    <h2>Daftar Episode (${d.episodes.length})</h2>
    <div class="eps-list">
      ${d.episodes.map((e) => `<a class="eps-item" href="#/episode/${e.slug}">${esc(e.title)}<span>${esc(e.date)}</span></a>`).join('')}
    </div>`;
}

let nonce = null;
async function resolveServer(p) {
  const r = await j(`${API}?type=mirror`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: p, nonce }),
  });
  if (r.nonce) nonce = r.nonce;
  return r.html;
}

async function episode(slug) {
  app.innerHTML = '<p class="muted">Memuat…</p>';
  const d = await j(`${API}?type=episode&slug=${slug}`);
  const servers = d.servers || [];
  const byQ = {};
  servers.forEach((s) => { (byQ[s.q] = byQ[s.q] || []).push(s); });
  app.innerHTML = `
    <h1 style="font-size:1.2rem;margin-bottom:.6rem">${esc(d.title)}</h1>
    <div class="notice">Server default dimuat otomatis. Klik server lain bila error. Download = link asli otakudesu (link.desustream).</div>
    ${d.video
      ? `<div class="player-box"><video id="player" src="${esc(d.video)}" controls playsinline preload="metadata"></video></div>`
      : `<div class="player-box"><iframe id="player" src="${esc(d.iframe)}" allowfullscreen></iframe></div>`}
    <div class="controls">
      ${d.prev ? `<a class="btn" href="#/episode/${d.prev}">← Prev</a>` : ''}
      ${d.anime ? `<a class="btn" href="#/anime/${d.anime}">Semua Episode</a>` : ''}
    </div>
    ${Object.entries(byQ).map(([q, list]) => `
      <div class="section-title">Mirror ${esc(q)}</div>
      <div class="server-grid">
        ${list.map((s, i) => `<button class="btn srv" data-q="${esc(q)}" data-i="${i}">${esc(s.label)}</button>`).join('')}
      </div>`).join('')}
    <div class="section-title">Download</div>
    ${(d.downloads || []).map((g) => `
      <div class="dl-group"><b>${esc(g.format)}</b> <span class="muted">${esc(g.size)}</span>
        <div class="dl-links">${g.links.map((l) => `<a target="_blank" rel="noopener" href="${esc(l.url)}">${esc(l.host)}</a>`).join('')}</div>
      </div>`).join('')}
    <div class="section-title">Pindah Episode</div>
    <div class="server-grid">${(d.allEps || []).slice(0, 30).map((e) => `<a class="btn" href="#/episode/${e.slug}">${esc(e.label)}</a>`).join('')}</div>
  `;
  document.querySelectorAll('.srv').forEach((b) => b.onclick = async () => {
    b.textContent = '…';
    try {
      const html = await resolveServer(byQ[b.dataset.q][+b.dataset.i].payload);
      const src = (html.match(/src="([^"]+)/) || [])[1];
      if (src) document.getElementById('player').src = src;
      b.classList.add('active');
    } catch { b.textContent = 'Error'; }
    b.textContent = byQ[b.dataset.q][+b.dataset.i].label;
  });
}

function route() {
  const h = location.hash || '#/';
  const [, page, param] = h.split('/');
  if (page === 'ongoing' || page === 'complete') return list(page);
  if (page === 'search') return search(decodeURIComponent(param || ''));
  if (page === 'anime') return anime(param);
  if (page === 'episode') return episode(param);
  return home();
}
document.getElementById('searchForm').onsubmit = (e) => {
  e.preventDefault();
  const q = document.getElementById('q').value.trim();
  if (q) location.hash = '#/search/' + encodeURIComponent(q);
};
window.addEventListener('hashchange', route);
route();
