const { createApp, ref, onMounted } = Vue;

const FUNC = [
  {
    id: 'getHome', name: 'getHome()', sig: 'getHome()',
    desc: 'Daftar ongoing dan complete dari halaman utama.',
    usage: `import { getHome } from './otakudesu.js';\nconst { ongoing, complete } = await getHome();`,
    out: `ongoing: [{ title, slug, episode, day, date, cover }]\ncomplete: [{ title, slug, episode, day, date, cover }]`
  },
  {
    id: 'getList', name: 'getList(type)', sig: "getList(type = 'ongoing')",
    desc: "Arsip penuh. type: 'ongoing' atau 'complete'.",
    usage: `import { getList } from './otakudesu.js';\nconst a = await getList('ongoing');\nconst b = await getList('complete');`
  },
  {
    id: 'search', name: 'search(query)', sig: 'search(query)',
    desc: 'Cari anime. Return judul, slug, genre, status, rating.',
    usage: `import { search } from './otakudesu.js';\nconst r = await search('naruto');`,
    out: `[{ title, slug, cover, genres, status, rating }]`
  },
  {
    id: 'getAnime', name: 'getAnime(slug)', sig: 'getAnime(slug)',
    desc: 'Detail anime dan daftar episode.',
    usage: `import { getAnime } from './otakudesu.js';\nconst a = await getAnime('slime-s4-sub-indo');`,
    out: `{ info, genres, cover, episodes: [{ slug, title, date }], batch }`
  },
  {
    id: 'getEpisode', name: 'getEpisode(slug)', sig: 'getEpisode(slug)',
    desc: 'Video MP4 langsung, iframe, mirror, dan link download.',
    usage: `import { getEpisode } from './otakudesu.js';\nconst e = await getEpisode('tenslem-s4-episode-21-sub-indo');`,
    out: `{ title, video, iframe, prev, servers, downloads, allEpisodes }`
  },
  {
    id: 'resolveMirror', name: 'resolveMirror(payload)', sig: 'resolveMirror(payload, nonce?)',
    desc: 'Tukar server player via AJAX resolver situs asal.',
    usage: `import { getEpisode, resolveMirror } from './otakudesu.js';\nconst e = await getEpisode('tenslem-s4-episode-21-sub-indo');\nconst r = await resolveMirror(e.servers[0].payload);`
  }
];

createApp({
  setup() {
    const open = ref(false);
    const active = ref('mulai');
    const copiedAll = ref(false);
    const source = ref('Memuat...');
    const funcs = FUNC;
    const quickStart = `import { getHome, getEpisode } from './otakudesu.js';\nconst home = await getHome();\nconst ep = await getEpisode('tenslem-s4-episode-21-sub-indo');\nconsole.log(ep.video);`;

    const scroll = (id) => {
      open.value = false;
      active.value = id;
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const copyText = (text, ev) => {
      navigator.clipboard.writeText(text);
      const btn = ev?.target;
      if (btn) {
        const old = btn.textContent;
        btn.textContent = 'Disalin';
        setTimeout(() => (btn.textContent = old), 1200);
      }
    };

    const copyFull = (ev) => {
      navigator.clipboard.writeText(source.value);
      copiedAll.value = true;
      if (ev?.target) {
        const old = ev.target.textContent;
        ev.target.textContent = 'Disalin';
        setTimeout(() => { ev.target.textContent = old; copiedAll.value = false; }, 1200);
      } else {
        setTimeout(() => (copiedAll.value = false), 1200);
      }
    };

    onMounted(async () => {
      try {
        source.value = await (await fetch('otakudesu.js')).text();
      } catch {
        source.value = 'Gagal memuat.';
      }
      const obs = new IntersectionObserver(
        (es) => es.forEach((e) => {
          if (e.isIntersecting) active.value = e.target.id;
        }),
        { rootMargin: '-70px 0px -60% 0px' }
      );
      document.querySelectorAll('#mulai, #fungsi, #kode, .card[id]').forEach((el) => obs.observe(el));
    });

    return { open, active, copiedAll, source, funcs, quickStart, scroll, copyText, copyFull };
  }
}).mount('#app');
