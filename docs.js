// ponytail: tanpa dep; cukup native DOM copy
function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const old = btn.textContent;
    btn.textContent = '✓ Disalin!';
    setTimeout(() => (btn.textContent = old), 1500);
  });
}

function copyCode(btn) {
  const card = btn.closest('.api-card');
  const code = card.querySelector('.code-box pre code, pre code').innerText;
  copyText(code, btn);
}

function copyFullSource() {
  copyText(document.getElementById('fullSourceCode').innerText, document.querySelector('.nav-links .btn-raw'));
}

// sorot (highlight) sidebar aktif saat scroll & muat kode asli otakudesu.js
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const r = await fetch('otakudesu.js');
    const src = await r.text();
    document.getElementById('fullSourceCode').textContent = src;
  } catch {}

  const obs = new IntersectionObserver(
    (es) => es.forEach((e) => {
      if (e.isIntersecting) {
        document.querySelectorAll('aside a').forEach((a) => a.classList.remove('active'));
        const link = document.querySelector(`aside a[href="#${e.target.id}"]`);
        if (link) link.classList.add('active');
      }
    }),
    { rootMargin: '-90px 0px -70% 0px' }
  );
  document.querySelectorAll('main section[id], main .api-card[id]').forEach((s) => obs.observe(s));
});
