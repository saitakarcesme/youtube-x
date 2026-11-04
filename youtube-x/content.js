// YouTube X — YouTube'u X (Twitter) arayüzüne dönüştürür.
// Tüm arayüz DOM API'leriyle kurulur (innerHTML yok), çünkü YouTube Trusted Types kullanır.
(() => {
  'use strict';
  if (window.__ytxLoaded) return;
  window.__ytxLoaded = true;

  const NS = 'http://www.w3.org/2000/svg';
  const DOC = document.documentElement;
  const store = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local ? chrome.storage.local : null;

  const S = {
    enabled: true,
    hadDark: DOC.hasAttribute('dark'),
    likes: new Set(),
    avatars: {},
    path: null,
    title: '',
    myAvatar: '',
    signedIn: null,
    acct: null,
    loaded: new Set(),
  };

  // ---------------------------------------------------------------- icons
  const VERIFIED =
    'M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z';
  const ICONS = {
    logo: {
      fill: 1,
      p: [
        ['M6 3.5h12a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5H6a5 5 0 0 1-5-5v-7a5 5 0 0 1 5-5z', { fill: '#ff0033' }],
        ['M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z', { fill: '#fff', transform: 'translate(6.6 6.6) scale(0.45)' }],
      ],
    },
    ytplay: {
      fill: 1,
      p: ['M23.5 6.6a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.5A3 3 0 0 0 .5 6.6C0 8.5 0 12 0 12s0 3.5.5 5.4a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.4.5-5.4s0-3.5-.5-5.4z', ['M9.6 15.6 15.8 12 9.6 8.4z', { fill: '#fff' }]],
    },
    home: { p: ['M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5.5v-6.5h-5V21H4a1 1 0 0 1-1-1z'] },
    search: { p: ['M10.5 3.5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M20.5 20.5l-5-5'] },
    people: { p: ['M15.5 20v-1.5a4 4 0 0 0-4-4h-5a4 4 0 0 0-4 4V20', 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M21.5 20v-1.5a4 4 0 0 0-3-3.85', 'M15.5 4.15a3.5 3.5 0 0 1 0 6.7'] },
    bookmark: { p: ['M6 3.5h12V21l-6-4.2L6 21z'] },
    list: { p: ['M6 3.5h12A1.5 1.5 0 0 1 19.5 5v14a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5z', 'M8.5 8.5h7', 'M8.5 12h7', 'M8.5 15.5h4'] },
    heart: { p: ['M12 20.5s-7.8-4.7-9.3-9.6C1.6 7.3 3.9 4 7.3 4c2.1 0 3.6 1.2 4.7 2.9C13.1 5.2 14.6 4 16.7 4c3.4 0 5.7 3.3 4.6 6.9-1.5 4.9-9.3 9.6-9.3 9.6z'] },
    history: { p: ['M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z', 'M12 7.5V12l3 2'] },
    user: { p: ['M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9z', 'M4 21a8 8 0 0 1 16 0'] },
    more: { p: ['M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z', ['M8 12h.01M12 12h.01M16 12h.01', { 'stroke-width': '2.6' }]] },
    dots: { p: [['M5 12h.01M12 12h.01M19 12h.01', { 'stroke-width': '2.8' }]] },
    back: { p: ['M20 12H4.5', 'M10.5 18l-6-6 6-6'] },
    plus: { p: ['M12 5v14', 'M5 12h14'] },
    reply: { p: ['M4.5 11a6.5 6.5 0 0 1 6.5-6.5h2a6.5 6.5 0 0 1 0 13h-1l-5 3.5v-4.1A6.5 6.5 0 0 1 4.5 11z'] },
    repost: { p: ['M4.5 10.5V8a2 2 0 0 1 2-2H18', 'M15 3l3 3-3 3', 'M19.5 13.5V16a2 2 0 0 1-2 2H6', 'M9 21l-3-3 3-3'] },
    views: { p: ['M5 20v-7', 'M10 20V5', 'M15 20v-10', 'M20 20v-4'] },
    share: { p: ['M12 3.5V15', 'M7.5 8 12 3.5 16.5 8', 'M4.5 14v4.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V14'] },
    image: { p: ['M5 4.5h14A1.5 1.5 0 0 1 20.5 6v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V6A1.5 1.5 0 0 1 5 4.5z', 'M3.5 16l5-5 4.5 4.5 2.5-2.5 5 5', ['M15.5 9h.01', { 'stroke-width': '2.6' }]] },
    poll: { p: ['M4 6h9', 'M4 12h16', 'M4 18h6'] },
    emoji: { p: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M8.5 14a4 4 0 0 0 7 0', ['M9 9.5h.01M15 9.5h.01', { 'stroke-width': '2.6' }]] },
    calendar: { p: ['M5 5.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1z', 'M4 10h16', 'M8.5 3v4', 'M15.5 3v4'] },
    location: { p: ['M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z', 'M12 7.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'] },
    play: { fill: 1, p: ['M8.5 5.8v12.4a.8.8 0 0 0 1.2.7l9.8-6.2a.8.8 0 0 0 0-1.4L9.7 5.1a.8.8 0 0 0-1.2.7z'] },
    shorts: { p: ['M13.5 2.5 5.5 13h6l-1 8.5 8-10.5h-6z'] },
    studio: { p: ['M4 5.5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z', 'M10 9.5v5l4.5-2.5z'] },
    gear: { p: ['M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 'M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z'] },
    power: { p: ['M12 3v8', 'M7 6.3a7.5 7.5 0 1 0 10 0'] },
    verified: { fill: 1, p: [VERIFIED, ['M10.2 16.3 6.6 12.7l1.4-1.4 2.2 2.2 5.7-5.7 1.4 1.4z', { fill: '#0f0f0f' }]] },
  };

  function icon(name, cls) {
    const def = ICONS[name];
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', name === 'ytplay' ? '0 4 24 16' : '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('class', 'xt-ic' + (def.fill ? ' xt-fill' : '') + (cls ? ' ' + cls : ''));
    for (const entry of def.p) {
      const [d, attrs] = Array.isArray(entry) ? entry : [entry, null];
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      if (attrs) for (const k in attrs) p.setAttribute(k, attrs[k]);
      s.append(p);
    }
    return s;
  }

  // ---------------------------------------------------------------- helpers
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') e.className = v;
        else if (k === 'text') e.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
        else e.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of kids.flat()) if (c != null && c !== false) e.append(c);
    return e;
  }

  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const norm = (x) => x.toLocaleLowerCase('tr').replace(/ı/g, 'i').normalize('NFD').replace(/\p{M}/gu, '');
  const VIEWS_RE = /(görüntüleme|izlenme|\bviews?\b|watching|izliyor|izleyici)/i;
  const TIME_RE = /(önce|\bago\b|yayınlandı|streamed|akış|premiere|prömiyer|planlandı|scheduled)/i;
  const DUR_RE = /^\d{1,2}(:\d{2}){1,2}$/;

  function parseId(href) {
    if (!href) return '';
    let m = href.match(/[?&]v=([\w-]{11})/);
    if (m) return m[1];
    m = href.match(/\/shorts\/([\w-]{11})/);
    return m ? m[1] : '';
  }

  function shortTime(t) {
    if (!t) return '';
    const s = t.toLocaleLowerCase('tr');
    const m = s.match(/(\d+)\s*(saniye|sn|dakika|dk|saat|sa|gün|g|hafta|hf|ay|yıl|second|sec|minute|min|hour|hr|day|week|wk|month|mo|year|yr)(?![\p{L}])/u) || s.match(/(\d+)\s*(saniye|dakika|saat|gün|hafta|second|minute|hour|day|week|month|year)/);
    if (!m) return t;
    const unit = { saniye: 'sn', sn: 'sn', dakika: 'dk', dk: 'dk', saat: 'sa', sa: 'sa', gün: 'g', g: 'g', hafta: 'h', hf: 'h', ay: 'ay', yıl: 'y', second: 's', sec: 's', minute: 'm', min: 'm', hour: 'h', hr: 'h', day: 'd', week: 'w', wk: 'w', month: 'mo', mo: 'mo', year: 'y', yr: 'y' };
    return m[1] + unit[m[2]];
  }

  function shortViews(v) {
    if (!v) return '';
    if (/(yok|no views)/i.test(v)) return '0';
    return clean(v.replace(/(kişi|kullanıcı)?\s*(görüntüleme|izlenme|views?|watching|izliyor|izleyici)/gi, ''));
  }

  function colorFor(name) {
    let x = 0;
    for (const ch of name || '?') x = (x * 31 + ch.charCodeAt(0)) >>> 0;
    return `hsl(${x % 360} 55% 42%)`;
  }

  function avatarEl(src, name, cls) {
    const wrap = h('div', { class: 'xt-avatar' + (cls ? ' ' + cls : '') });
    const letter = () => h('span', { class: 'xt-letter', style: 'background:' + colorFor(name), text: (clean(name).charAt(0) || '?').toLocaleUpperCase('tr') });
    if (src) {
      const img = h('img', { src, alt: '', loading: 'lazy', referrerpolicy: 'no-referrer' });
      img.addEventListener('error', () => img.replaceWith(letter()));
      wrap.append(img);
    } else wrap.append(letter());
    return wrap;
  }

  function toast(msg) {
    let t = document.getElementById('xt-toast');
    if (!t) {
      t = h('div', { id: 'xt-toast' });
      document.body.append(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2400);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = h('textarea', { style: 'position:fixed;opacity:0' });
      ta.value = text;
      document.body.append(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }

  function save(key, val) {
    if (store) store.set({ [key]: val });
  }
  let avatarSaveT;
  function saveAvatarsSoon() {
    clearTimeout(avatarSaveT);
    avatarSaveT = setTimeout(() => {
      const keys = Object.keys(S.avatars);
      if (keys.length > 600) for (const k of keys.slice(0, keys.length - 600)) delete S.avatars[k];
      save('xtAvatars', S.avatars);
    }, 1500);
  }

  // ---------------------------------------------------------------- navigation
  const modifier = (e) => e && (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1);

  // YouTube'un kendi bağlantısına tıkla (SPA); geçiş başlamazsa normal yükle.
  let navStarted = false;
  document.addEventListener('yt-navigate-start', () => (navStarted = true), true);
  function clickNav(a, url) {
    navStarted = false;
    const before = location.href;
    if (a) a.click();
    setTimeout(() => {
      if (!navStarted && location.href === before) location.assign(url);
    }, a ? 900 : 0);
  }

  function go(url, e) {
    if (modifier(e)) return;
    if (e) e.preventDefault();
    const u = new URL(url, location.origin);
    if (u.origin !== location.origin) {
      window.open(u.href, '_blank', 'noopener');
      return;
    }
    const path = u.pathname + u.search;
    if (path === location.pathname + location.search) {
      if (S.explore) {
        closeExplore();
        route(true);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // YouTube'un kendi (gizli) bağlantılarına tıklamak sayfa yenilemeden SPA geçişi sağlar.
    const native = [...document.querySelectorAll('ytd-guide-entry-renderer a, ytd-mini-guide-entry-renderer a, ytd-page-manager a[href]')].find(
      (a) => a.getAttribute('href') === path && !a.closest('.xt-post')
    );
    clickNav(native, u.href);
  }

  function search(q) {
    q = clean(q);
    if (!q) return;
    const url = '/results?search_query=' + encodeURIComponent(q);
    const input = document.querySelector('input[name="search_query"]') || document.querySelector('input.ytSearchboxComponentInput, input#search');
    const btn = document.querySelector('button.ytSearchboxComponentSearchButton') || document.querySelector('#search-icon-legacy, yt-searchbox button[class*="SearchButton"]');
    try {
      if (!input || !btn) throw new Error('no searchbox');
      input.value = q;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      btn.click();
      setTimeout(() => {
        if (new URLSearchParams(location.search).get('search_query') !== q) location.assign(url);
      }, 1500);
    } catch {
      location.assign(url);
    }
  }

  // ---------------------------------------------------------------- routing
  function pageFor(p) {
    if (p === '/') return 'home';
    if (p === '/feed/subscriptions') return 'subs';
    if (p === '/results') return 'results';
    if (p === '/watch') return 'watch';
    if (p.startsWith('/shorts')) return 'shorts';
    if (/^\/(@|channel\/|c\/|user\/)/.test(p)) return 'channel';
    if (p.startsWith('/hashtag/') || p.startsWith('/feed/trending') || p.startsWith('/feed/explore')) return 'explore';
    return 'other';
  }
  const modeFor = (page) => (page === 'shorts' ? 'shorts' : ['home', 'subs', 'results', 'channel', 'explore'].includes(page) ? 'narrow' : 'wide');

  function route(force) {
    const key = location.pathname + location.search;
    const title = document.title;
    if (!force && key === S.path && title === S.title) return;
    const navChanged = key !== S.path;
    if (navChanged && S.path !== null) closeExplore();
    S.path = key;
    S.title = title;
    const page = S.explore ? 'explore' : pageFor(location.pathname);
    DOC.setAttribute('xt-page', page);
    DOC.setAttribute('xt-mode', modeFor(page));
    renderHeader();
    if (navChanged || force) {
      renderFlow();
      updateNav();
      const input = document.querySelector('#xt-right .xt-search input');
      if (input) input.value = page === 'results' ? new URLSearchParams(location.search).get('search_query') || '' : '';
      if (page === 'watch' && sessionStorage.getItem('xt-comments')) {
        sessionStorage.removeItem('xt-comments');
        scrollToComments();
      }
    }
    sidebarSoon();
  }

  // ---------------------------------------------------------------- explore (X'in Keşfet sayfası)
  const CATS = [
    ['Müzik', '/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ'],
    ['Oyun', '/gaming'],
    ['Haberler', '/channel/UCYfdidRxbB8Qhf0Nx7ioOYw'],
    ['Spor', '/channel/UCEgdi0XIXXZ-qJOFPf4JSKw'],
    ['Canlı', '/channel/UC4R8DWoMoI7CAwX8_LjQHig'],
    ["Podcast'ler", '/feed/podcasts'],
    ['Öğrenim', '/channel/UCtFRv9O2AHqOZjjynzrv-xg'],
    ['Filmler ve Diziler', '/feed/storefront'],
    ['Oynanabilirler', '/playables'],
  ];

  function openExplore() {
    S.explore = true;
    route(true);
    window.scrollTo(0, 0);
    setTimeout(() => document.querySelector('#xt-head .xt-search input')?.focus(), 50);
  }
  function closeExplore() {
    S.explore = false;
  }

  function trendRow(name, meta, count, url) {
    const onclick = (e) => {
      if (url.startsWith('/results') && !modifier(e)) {
        e.preventDefault();
        search(name);
      } else go(url, e);
    };
    return h(
      'a',
      { class: 'xt-trend', href: url, onclick },
      h('div', { class: 'xt-trend-meta' }, h('span', { text: meta }), icon('dots')),
      h('div', { class: 'xt-trend-name', text: name }),
      count ? h('div', { class: 'xt-trend-count', text: count }) : null
    );
  }

  function searchBox(placeholder) {
    const input = h('input', { type: 'search', placeholder, 'aria-label': 'Ara', autocomplete: 'off' });
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        search(input.value);
      }
    });
    return h('label', { class: 'xt-search' }, icon('search'), input);
  }

  function buildExplore() {
    const live = (S.trends || []).filter((t) => t.count);
    return h(
      'div',
      { class: 'xt-explore' },
      h('h2', { class: 'xt-section-title', text: 'Gündemdekiler' }),
      live.length
        ? live.map((t) => trendRow(t.name, t.meta, t.count, t.url))
        : h('p', { class: 'xt-empty', text: 'Bir arama yap ya da akışını kaydır; başlıklarda en çok geçen konular burada görünür.' }),
      h('h2', { class: 'xt-section-title', text: 'Kategoriler' }),
      CATS.map(([name, url]) => trendRow(name, 'Keşfet · Kategori', '', url))
    );
  }

  function scrollToComments() {
    let n = 0;
    const t = setInterval(() => {
      const c = document.querySelector('ytd-watch-flexy:not([hidden]) ytd-comments#comments');
      if (c || ++n > 40) {
        clearInterval(t);
        if (c) window.scrollTo({ top: c.getBoundingClientRect().top + scrollY - 70, behavior: 'smooth' });
      }
    }, 250);
  }

  // ---------------------------------------------------------------- left nav
  const NAV = [
    ['home', 'Anasayfa', '/'],
    ['search', 'Keşfet', '#explore'],
    ['people', 'Takip edilenler', '/feed/subscriptions'],
    ['list', 'Listeler', '/feed/playlists'],
    ['bookmark', 'Yer İşaretleri', '/playlist?list=WL'],
    ['heart', 'Beğeniler', '/playlist?list=LL'],
    ['history', 'Geçmiş', '/feed/history'],
    ['user', 'Profil', '/feed/you'],
  ];

  function buildNav() {
    const items = NAV.map(([ic, label, path]) =>
      h(
        'a',
        {
          class: 'xt-nav-item',
          href: path === '#explore' ? '/' : path,
          'data-path': path,
          title: label,
          onclick: (e) => {
            if (path !== '#explore') return go(path, e);
            e.preventDefault();
            openExplore();
          },
        },
        icon(ic),
        h('span', { class: 'xt-label', text: label })
      )
    );
    const moreBtn = h('button', { class: 'xt-nav-item', type: 'button', title: 'Daha fazla' }, icon('more'), h('span', { class: 'xt-label', text: 'Daha fazla' }));
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openMenu(moreBtn, [
        ['shorts', 'Shorts', () => go('/shorts')],
        ['studio', 'YouTube Studio', () => go('https://studio.youtube.com')],
        ['gear', 'Ayarlar', () => go('/account')],
        ['power', "Klasik YouTube'a dön", () => setEnabled(false, true)],
      ]);
    });
    const account = h('div', { class: 'xt-account', id: 'xt-account' });
    return h(
      'nav',
      { id: 'xt-nav' },
      h('a', { class: 'xt-logo', href: '/', title: 'Anasayfa', onclick: (e) => go('/', e) }, icon('logo')),
      h('div', { class: 'xt-nav-list' }, items, moreBtn),
      h('a', { class: 'xt-btn xt-btn-primary xt-post-btn', href: 'https://studio.youtube.com', title: 'Video yükle', onclick: (e) => go('https://studio.youtube.com', e) }, h('span', { text: 'Gönder' }), icon('plus')),
      account
    );
  }

  function updateNav() {
    const cur = location.pathname + location.search;
    document.querySelectorAll('#xt-nav .xt-nav-item[data-path]').forEach((a) => {
      const p = a.dataset.path;
      a.classList.toggle('on', S.explore ? p === '#explore' : p === '/' ? cur === '/' : cur.startsWith(p));
    });
  }

  // Giriş yapılmışsa hesap adı ve @kullanıcı adı (YouTube'un hesap değiştirici uç noktası).
  async function loadAccount() {
    if (S.acctTried) return;
    S.acctTried = true;
    try {
      const t = await (await fetch('/getAccountSwitcherEndpoint', { credentials: 'include' })).text();
      const pick = (re) => {
        const m = t.match(re);
        try {
          return m ? JSON.parse('"' + m[1] + '"') : '';
        } catch {
          return '';
        }
      };
      const name = pick(/"accountName":\{"simpleText":"((?:[^"\\]|\\.)*)"/);
      const handle = pick(/"channelHandle":\{"simpleText":"((?:[^"\\]|\\.)*)"/);
      if (name) {
        S.acct = { name, handle };
        S.signedIn = null;
        updateAccount();
      }
    } catch {}
  }

  function updateAccount() {
    const box = document.getElementById('xt-account');
    if (!box) return;
    const img = document.querySelector('ytd-masthead #avatar-btn img, ytd-masthead button#avatar-btn img, ytd-topbar-menu-button-renderer img');
    const src = img && /yt3|ggpht|googleusercontent/.test(img.src) ? img.src : '';
    const signedIn = !!document.querySelector('ytd-masthead #avatar-btn, ytd-masthead button#avatar-btn') || !!src;
    if (src === S.myAvatar && signedIn === S.signedIn) return;
    const signedInChanged = signedIn !== S.signedIn;
    S.myAvatar = src;
    S.signedIn = signedIn;
    if (signedIn) loadAccount();
    box.textContent = '';
    if (signedIn) {
      box.append(
        avatarEl(src, 'Sen'),
        h(
          'div',
          { class: 'xt-account-text' },
          h('div', { class: 'xt-account-name', text: S.acct?.name || 'Hesabım' }),
          h('div', { class: 'xt-account-handle', text: S.acct?.handle || 'Kanalın' })
        ),
        icon('dots', 'xt-account-dots')
      );
      box.onclick = () => go('/feed/you');
    } else {
      box.append(
        h(
          'a',
          { class: 'xt-btn xt-btn-primary xt-signin', title: 'Giriş yap', href: 'https://accounts.google.com/ServiceLogin?service=youtube&continue=' + encodeURIComponent(location.href) },
          icon('user'),
          h('span', { text: 'Giriş yap' })
        )
      );
      box.onclick = null;
    }
    const ca = document.querySelector('.xt-compose > .xt-avatar');
    if (ca && S.myAvatar) ca.replaceWith(avatarEl(S.myAvatar, S.acct?.name || 'Sen'));
    if (signedInChanged) {
      renderFlow();
      sidebarSoon();
    }
  }

  function openMenu(anchor, entries) {
    closeMenu();
    const menu = h(
      'div',
      { id: 'xt-menu', role: 'menu' },
      entries.map(([ic, label, fn]) =>
        h('button', { class: 'xt-menu-item', type: 'button', onclick: () => { closeMenu(); fn(); } }, icon(ic), h('span', { text: label }))
      )
    );
    document.body.append(menu);
    const r = anchor.getBoundingClientRect();
    menu.style.left = Math.max(8, r.left) + 'px';
    menu.style.top = Math.max(8, r.top - menu.offsetHeight - 8) + 'px';
    setTimeout(() => document.addEventListener('click', closeMenu, { once: true }));
  }
  function closeMenu() {
    document.getElementById('xt-menu')?.remove();
  }

  // ---------------------------------------------------------------- header + compose
  function headerText(page) {
    const docTitle = clean(document.title.replace(/^\(\d+\+?\)\s*/, '').replace(/\s*-\s*YouTube\s*$/, ''));
    const q = new URLSearchParams(location.search);
    switch (page) {
      case 'watch':
        return ['Gönderi', ''];
      case 'results':
        return [q.get('search_query') || 'Arama', 'Arama sonuçları'];
      case 'channel':
        return [pageChannel()?.name || docTitle, 'Profil'];
      case 'explore':
        return ['Keşfet', docTitle !== 'YouTube' ? docTitle : ''];
      case 'shorts':
        return ['Shorts', ''];
    }
    const p = location.pathname;
    const list = q.get('list');
    if (list === 'WL') return ['Yer İşaretleri', 'Daha sonra izle'];
    if (list === 'LL') return ['Beğeniler', 'Beğenilen videolar'];
    if (p === '/feed/history') return ['Geçmiş', 'İzleme geçmişi'];
    if (p === '/feed/playlists') return ['Listeler', 'Oynatma listelerin'];
    if (p === '/feed/you') return ['Profil', 'Sen'];
    if (p === '/feed/channels') return ['Takip edilenler', 'Kanallar'];
    return [docTitle || 'YouTube', ''];
  }

  function renderHeader() {
    let head = document.getElementById('xt-head');
    if (!head) return;
    const page = DOC.getAttribute('xt-page');
    head.textContent = '';
    if (S.explore) {
      head.append(
        h('button', { class: 'xt-back', type: 'button', title: 'Geri', onclick: () => { closeExplore(); route(true); } }, icon('back')),
        searchBox('Ara')
      );
      return;
    }
    if (page === 'home' || page === 'subs') {
      const tab = (label, path, on) =>
        h('a', { class: 'xt-tab' + (on ? ' on' : ''), href: path, onclick: (e) => go(path, e) }, h('span', { text: label }));
      head.append(h('div', { class: 'xt-tabs' }, tab('Sana özel', '/', page === 'home'), tab('Takip edilenler', '/feed/subscriptions', page === 'subs')));
    } else {
      const [title, sub] = headerText(page);
      head.append(
        h('button', { class: 'xt-back', type: 'button', title: 'Geri', onclick: () => (history.length > 1 ? history.back() : go('/')) }, icon('back')),
        h('div', { class: 'xt-head-text' }, h('div', { class: 'xt-head-title', text: title }), sub ? h('div', { class: 'xt-head-sub', text: sub }) : null)
      );
    }
  }

  function ensureFlow() {
    const pm = document.querySelector('ytd-app ytd-page-manager#page-manager') || document.querySelector('ytd-page-manager');
    if (!pm || !pm.parentNode) return null;
    let f = document.getElementById('xt-flow');
    if (!f) f = h('div', { id: 'xt-flow' });
    if (f.parentNode !== pm.parentNode || f.nextElementSibling !== pm) pm.parentNode.insertBefore(f, pm);
    return f;
  }

  function renderFlow() {
    const f = ensureFlow();
    if (!f) return;
    const page = DOC.getAttribute('xt-page');
    const has = f.querySelector('.xt-compose');
    if (page === 'home' && !S.explore && !has) f.append(buildCompose());
    if ((page !== 'home' || S.explore) && has) has.remove();
    f.querySelector('.xt-explore')?.remove();
    if (S.explore) f.append(buildExplore());
    const empty = f.querySelector('.xt-empty-state');
    const wantEmpty = page === 'home' && !S.explore && S.signedIn === false;
    if (wantEmpty && !empty)
      f.append(
        h(
          'div',
          { class: 'xt-empty-state' },
          icon('ytplay'),
          h('h2', { text: 'Akışın seni bekliyor' }),
          h('p', { text: 'Takip ettiğin kanalların videoları ve sana özel öneriler burada gönderi olarak akar. Giriş yap ya da yukarıdan bir şey ara.' }),
          h('a', { class: 'xt-btn xt-btn-primary', href: 'https://accounts.google.com/ServiceLogin?service=youtube&continue=' + encodeURIComponent(location.origin + '/'), text: 'Giriş yap' })
        )
      );
    if (!wantEmpty && empty) empty.remove();
  }

  function buildCompose() {
    const input = h('textarea', { class: 'xt-compose-input', rows: '1', placeholder: "Neler oluyor?! — YouTube'da ara", 'aria-label': 'YouTube’da ara' });
    const btn = h('button', { class: 'xt-btn xt-btn-primary', type: 'button', disabled: true, title: "YouTube'da ara", text: 'Gönder' });
    input.addEventListener('input', () => {
      btn.disabled = !input.value.trim();
      input.style.height = 'auto';
      input.style.height = input.scrollHeight + 'px';
    });
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        search(input.value);
      }
    });
    btn.addEventListener('click', () => search(input.value));
    return h(
      'div',
      { class: 'xt-compose' },
      S.myAvatar ? avatarEl(S.myAvatar, 'Sen') : h('div', { class: 'xt-avatar xt-avatar-anon' }, icon('user')),
      h(
        'div',
        { class: 'xt-compose-main' },
        input,
        h('div', { class: 'xt-compose-bar' }, h('div', { class: 'xt-compose-tools' }, ['image', 'poll', 'emoji', 'calendar', 'location'].map((n) => h('span', { class: 'xt-tool' }, icon(n)))), btn)
      )
    );
  }

  // ---------------------------------------------------------------- right sidebar
  function buildRight() {
    const foot = [
      ['Hizmet Şartları', 'https://www.youtube.com/t/terms'],
      ['Gizlilik Politikası', 'https://policies.google.com/privacy'],
      ['Çerez Politikası', 'https://policies.google.com/technologies/cookies'],
      ['Erişilebilirlik', 'https://support.google.com/youtube/answer/189278'],
      ['Reklam bilgisi', 'https://www.youtube.com/ads'],
    ].map(([t, u]) => h('a', { href: u, target: '_blank', rel: 'noopener', text: t }));
    return h(
      'aside',
      { id: 'xt-right' },
      h('div', { class: 'xt-right-sticky' }, searchBox('Ara')),
      h('section', { class: 'xt-box', id: 'xt-trends' }, h('h2', { text: 'Neler oluyor' }), h('div', { class: 'xt-list' })),
      h(
        'section',
        { class: 'xt-box', id: 'xt-subs', hidden: true },
        h('h2', { text: 'Takip ettiklerin' }),
        h('div', { class: 'xt-list' }),
        h('a', { class: 'xt-box-more', href: '/feed/channels', onclick: (e) => go('/feed/channels', e), text: 'Tümünü göster' })
      ),
      h(
        'section',
        { class: 'xt-box', id: 'xt-follow' },
        h('h2', { text: 'Kimi takip etmeli' }),
        h('div', { class: 'xt-list' }),
        h('a', { class: 'xt-box-more', href: '/feed/channels', onclick: (e) => go('/feed/channels', e), text: 'Daha fazla göster' })
      ),
      h('footer', { class: 'xt-foot' }, foot, h('span', { text: '© 2026 YouTube X' }))
    );
  }

  const STOP = new Set(
    ('için daha gibi nasıl neden olan oldu olarak kadar yeni ilk son bütün tüm bunu şimdi sonra önce bana sana bizim sizin onun ama veya hakkında karşı arasında içinde ' +
      'official video music with your this that from what when have will about shorts bölüm resmi full part episode feat live canlı oldu here they them just more most ' +
      'into than then over after like best ever only into does were been being their there which while also kısım klip şarkı')
      .split(' ')
      .map(norm)
  );

  function visibleCards() {
    return [...document.querySelectorAll('ytd-page-manager > :not([hidden]) .xt-post')].map((c) => c._xt).filter(Boolean);
  }

  let sideT;
  function sidebarSoon() {
    clearTimeout(sideT);
    sideT = setTimeout(renderSidebar, 600);
  }

  function renderSidebar() {
    const tBox = document.querySelector('#xt-trends .xt-list');
    const fBox = document.querySelector('#xt-follow .xt-list');
    if (!tBox || !fBox) return;
    const cards = visibleCards();

    // Gündem: akıştaki başlıklarda en çok geçen kelimeler/etiketler (gerçek sayımlar).
    const counts = new Map();
    const queryWords = new Set(norm(new URLSearchParams(location.search).get('search_query') || '').split(/\s+/).filter(Boolean));
    for (const d of cards) {
      const seen = new Set();
      for (const raw of d.title.match(/#?[\p{L}\p{N}_']{4,}/gu) || []) {
        const w = raw.replace(/'.*$/, '');
        const key = norm(w);
        if (key.length < 4 || STOP.has(key.replace(/^#/, '')) || /^#?\d+$/.test(key) || seen.has(key) || queryWords.has(key.replace(/^#/, ''))) continue;
        seen.add(key);
        const e = counts.get(key) || { n: 0, forms: new Map() };
        e.n++;
        e.forms.set(w, (e.forms.get(w) || 0) + 1);
        counts.set(key, e);
      }
    }
    const trends = [...counts.entries()]
      .filter(([, e]) => e.n >= 2)
      .sort((a, b) => b[1].n - a[1].n || (b[0].startsWith('#') ? 1 : 0) - (a[0].startsWith('#') ? 1 : 0))
      .slice(0, 5)
      .map(([, e]) => {
        const form = [...e.forms.entries()].sort((a, b) => b[1] - a[1])[0][0];
        const name = form.charAt(0).toLocaleUpperCase('tr') + form.slice(1);
        const url = name.startsWith('#') ? '/hashtag/' + encodeURIComponent(name.slice(1)) : '/results?search_query=' + encodeURIComponent(name);
        return { name, meta: 'Akışında gündemde', count: e.n + ' gönderi', url };
      });
    if (trends.length) S.trends = trends;
    const shown = trends.slice();
    for (const [name, url] of CATS) {
      if (shown.length >= 5) break;
      if (!shown.some((t) => norm(t.name) === norm(name))) shown.push({ name, meta: 'Keşfet · Kategori', count: '', url });
    }
    tBox.textContent = '';
    for (const t of shown) tBox.append(trendRow(t.name, t.meta, t.count, t.url));

    // Kimi takip etmeli: akışta en sık görünen kanallar.
    const chans = new Map();
    for (const d of cards) {
      if (!d.channel || !d.chHref) continue;
      const c = chans.get(d.chHref) || { ...d, n: 0 };
      c.n++;
      if (!c.avatar && d.avatar) c.avatar = d.avatar;
      chans.set(d.chHref, c);
    }
    renderSubs();
    const subs = new Set(guideSubs().map((x) => x.href));
    const top = [...chans.values()].filter((c) => !subs.has(c.chHref)).sort((a, b) => b.n - a.n).slice(0, 3);
    fBox.textContent = '';
    document.getElementById('xt-follow').hidden = !top.length;
    for (const c of top) {
      fBox.append(
        h(
          'a',
          { class: 'xt-follow', href: c.chHref, onclick: (e) => go(c.chHref, e) },
          avatarEl(c.avatar || S.avatars[c.chHref], c.channel),
          h(
            'div',
            { class: 'xt-follow-text' },
            h('div', { class: 'xt-follow-name' }, h('span', { text: c.channel }), c.verified ? icon('verified', 'xt-verified') : null),
            h('div', { class: 'xt-follow-handle', text: c.handle })
          ),
          h('span', { class: 'xt-btn xt-btn-primary xt-btn-sm', text: 'Takip et' })
        )
      );
    }
  }

  // Rehberdeki (gizli) abonelik listesinden "Takip ettiklerin".
  function guideSubs() {
    const out = new Map();
    for (const sec of document.querySelectorAll('ytd-guide-section-renderer')) {
      const title = clean(sec.querySelector('#guide-section-title')?.textContent);
      if (!/abonelik|subscription/i.test(title)) continue;
      for (const a of sec.querySelectorAll('ytd-guide-entry-renderer a#endpoint')) {
        const href = a.getAttribute('href') || '';
        if (!/^\/(@|channel\/)/.test(href) || out.has(href)) continue;
        const img = a.querySelector('img');
        const src = img && /yt3|ggpht|googleusercontent/.test(img.src) ? img.src : '';
        const name = clean(a.getAttribute('title') || a.querySelector('.title, yt-formatted-string')?.textContent);
        if (!name) continue;
        const entry = a.closest('ytd-guide-entry-renderer');
        const fresh = !!entry?.querySelector('#newness-dot:not([hidden]), .guide-entry-badge:not([hidden]) yt-icon');
        out.set(href, { name, href, avatar: src || S.avatars[href] || '', fresh });
      }
    }
    return [...out.values()];
  }

  function renderSubs() {
    const box = document.getElementById('xt-subs');
    if (!box) return;
    const list = guideSubs();
    box.hidden = !list.length;
    const wrap = box.querySelector('.xt-list');
    wrap.textContent = '';
    for (const c of list.slice(0, 7))
      wrap.append(h('a', { class: 'xt-sub', href: c.href, title: c.name, onclick: (e) => go(c.href, e) }, avatarEl(c.avatar, c.name), h('span', { text: c.name }), c.fresh ? h('i') : null));
  }

  // ---------------------------------------------------------------- feed → posts
  const ITEM_SEL =
    'ytd-rich-item-renderer, ytd-video-renderer, ytd-search ytd-item-section-renderer > #contents > yt-lockup-view-model, ytd-search ytd-vertical-list-renderer #items > yt-lockup-view-model, ' +
    'ytd-watch-flexy #related ytd-item-section-renderer > #contents > yt-lockup-view-model, ytd-watch-flexy #related ytd-compact-video-renderer';
  const CH_SEL = 'a[href^="/@"], a[href^="/channel/"], a[href^="/c/"], a[href^="/user/"]';

  function pageChannel() {
    const p = location.pathname;
    if (!/^\/(@|channel\/|c\/|user\/)/.test(p)) return null;
    const parts = p.split('/');
    const base = parts.slice(0, p.startsWith('/@') ? 2 : 3).join('/');
    const root = document.querySelector('ytd-browse:not([hidden])') || document;
    const name =
      clean(root.querySelector('yt-page-header-view-model h1, yt-dynamic-text-view-model h1, #channel-name #text, #channel-header #text')?.textContent) ||
      clean(document.title.replace(/^\(\d+\+?\)\s*/, '').replace(/\s*-\s*YouTube\s*$/, ''));
    const img = root.querySelector('yt-page-header-view-model yt-avatar-shape img, yt-decorated-avatar-view-model img, #channel-header #avatar img, #avatar img');
    const avatar = img && /yt3|ggpht|googleusercontent/.test(img.src) ? img.src : '';
    const verified = !!root.querySelector('yt-page-header-view-model [aria-label*="erifi"], yt-page-header-view-model [aria-label*="oğrula"], #channel-header .badge-style-type-verified');
    return { name, href: base, avatar, verified };
  }

  const qa = (root, sel) => [...root.querySelectorAll(sel)].filter((n) => !n.closest('.xt-post'));
  const q1 = (root, sel) => qa(root, sel)[0] || null;

  function extract(item) {
    if (item.querySelector('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer, ytd-display-ad-renderer, ytd-promoted-video-renderer, ytd-promoted-sparkles-web-renderer')) return { ad: true };
    const a = q1(item, 'a[href*="/watch?v="], a[href*="/shorts/"]');
    if (!a) return null;
    const href = a.getAttribute('href');
    const id = parseId(href);
    if (!id) return null;
    const isShort = href.includes('/shorts/');

    const titleEl = q1(item, '#video-title') || q1(item, 'h3');
    const title = clean(titleEl?.textContent) || clean(a.getAttribute('title')) || clean(q1(item, 'a[title]')?.getAttribute('title'));
    if (!title) return null;

    // Kanal
    let channel = '';
    let chHref = '';
    for (const ca of qa(item, CH_SEL)) {
      if (!chHref) chHref = ca.getAttribute('href');
      const t = clean(ca.textContent);
      if (t) {
        channel = t;
        chHref = ca.getAttribute('href');
        break;
      }
    }
    if (!channel) channel = clean(q1(item, 'ytd-channel-name #text, #channel-name #text')?.textContent);
    if (!channel) {
      const row = q1(item, '[class*="metadata-row"], [class*="MetadataRow"]');
      if (row) channel = clean(row.textContent.split('•')[0]);
    }
    if (VIEWS_RE.test(channel) || TIME_RE.test(channel)) channel = '';
    const pc = pageChannel();
    if (pc && (!channel || !chHref)) {
      channel = channel || pc.name;
      chHref = chHref || pc.href;
    }
    chHref = chHref.split('?')[0].replace(/\/(videos|shorts|streams|featured)$/, '');

    // Görüntüleme, zaman, süre
    let views = '';
    let time = '';
    let dur = '';
    let live = false;
    qa(item, 'span, yt-formatted-string').forEach((n) => {
      if (n.querySelector('span, yt-formatted-string')) return;
      for (const part of n.textContent.split('•')) {
        const t = clean(part);
        if (!t || t.length > 60) continue;
        if (!views && VIEWS_RE.test(t)) views = t;
        else if (!time && TIME_RE.test(t)) time = t;
        else if (!dur && DUR_RE.test(t)) dur = t;
        if (/^(canlı|live|canlı yayın)$/i.test(t)) live = true;
      }
    });
    if (!dur) {
      for (const b of qa(item, 'badge-shape, ytd-thumbnail-overlay-time-status-renderer, [class*="time-status"], [class*="badge"], [class*="Badge"]')) {
        const t = clean(b.textContent);
        if (DUR_RE.test(t)) {
          dur = t;
          break;
        }
        if (/^(canlı|live)$/i.test(t)) live = true;
      }
    }
    if (/watching|izliyor|izleyici/i.test(views)) live = true;

    // Görseller
    let avatar = '';
    let thumb = '';
    for (const im of qa(item, 'img')) {
      const s = im.currentSrc || im.src || '';
      if (!s || s.startsWith('data:')) continue;
      if (/yt3\.|ggpht|googleusercontent/.test(s)) avatar = avatar || s;
      else if (/i\.ytimg\.com\/vi(_webp)?\//.test(s) && s.includes(id)) thumb = thumb || s;
    }
    if (avatar) avatar = avatar.replace(/=s\d+-/, '=s88-');
    if (!avatar && pc && chHref === pc.href) avatar = pc.avatar;
    if (!avatar && chHref) avatar = S.avatars[chHref] || '';

    const verified =
      !!q1(item, '.badge-style-type-verified, .badge-style-type-verified-artist, [aria-label*="erifi"], [aria-label*="oğrula"], [title*="erifi"], [title*="oğrula"]') ||
      !!(pc && chHref === pc.href && pc.verified);

    const prog = q1(item, 'ytd-thumbnail-overlay-resume-playback-renderer #progress, [class*="progress-bar-segment"], [class*="ProgressBarSegment"]');
    const progress = prog ? prog.style.width || '' : '';

    const handle = chHref.startsWith('/@') ? decodeURIComponent(chHref.slice(1)) : channel ? '@' + channel.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}_]/gu, '').slice(0, 15) : '';

    return { id, href, isShort, title, channel, chHref, handle, avatar, thumb, views, time, dur, live, verified, progress };
  }

  function titleNodes(title) {
    return title.split(/(#[\p{L}\p{N}_]+)/u).map((part) =>
      part.startsWith('#') && part.length > 1
        ? h('a', { class: 'xt-tag', href: '/hashtag/' + encodeURIComponent(part.slice(1)), onclick: (e) => { e.stopPropagation(); go('/hashtag/' + encodeURIComponent(part.slice(1)), e); }, text: part })
        : part
    );
  }

  function act(name, ic, label, count) {
    return h('button', { class: 'xt-act', type: 'button', 'data-act': name, title: label, 'aria-label': label }, h('span', { class: 'xt-ic-wrap' }, icon(ic)), h('span', { class: 'xt-count', text: count || '' }));
  }

  function findOriginal(item, sel) {
    const all = [...item.querySelectorAll(sel)].filter((x) => !x.closest('.xt-post'));
    return all.find((x) => x.getClientRects().length) || all[0];
  }

  function openVideo(item, d, e) {
    const url = new URL(d.href, location.origin).href;
    if (modifier(e)) {
      window.open(url, '_blank');
      return;
    }
    if (e) e.preventDefault();
    clickNav(findOriginal(item, 'a[href*="/watch?v="], a[href*="/shorts/"]'), url);
  }

  function thumbImg(d) {
    const fallback = `https://i.ytimg.com/vi/${d.id}/hqdefault.jpg`;
    const src = d.thumb || fallback;
    const img = h('img', { src, alt: '', loading: 'lazy', decoding: 'async', class: S.loaded.has(src) ? 'ld' : null });
    img.addEventListener('load', () => {
      if (img.naturalWidth <= 120 && !img.src.includes('/hqdefault')) return void (img.src = fallback);
      S.loaded.add(img.src);
      img.classList.add('ld');
    });
    img.addEventListener('error', () => {
      if (!img.src.includes('/hqdefault')) img.src = fallback;
      else img.classList.add('ld');
    });
    return img;
  }

  function mediaEl(d, play) {
    return h(
      'div',
      { class: 'xt-media' },
      thumbImg(d),
      play ? h('span', { class: 'xt-play' }, icon('ytplay')) : null,
      d.live ? h('span', { class: 'xt-live', text: 'CANLI' }) : d.dur ? h('span', { class: 'xt-dur', text: d.dur }) : null,
      d.progress ? [h('span', { class: 'xt-progress-bg' }), h('span', { class: 'xt-progress', style: 'width:' + d.progress })] : null
    );
  }

  function renderCompact(d) {
    const card = h('article', { class: 'xt-post xt-compact', 'data-id': d.id });
    card._xt = d;
    const meta = [shortViews(d.views) && shortViews(d.views) + ' görüntüleme', d.time].filter(Boolean).join(' · ');
    card.append(
      mediaEl(d, false),
      h(
        'div',
        { class: 'xt-body' },
        h('a', { class: 'xt-ctitle', href: d.href, title: d.title, text: d.title }),
        h(
          'div',
          { class: 'xt-cmeta' },
          h(d.chHref ? 'a' : 'span', { class: 'xt-name', href: d.chHref || null, 'data-act': d.chHref ? 'channel' : null }, h('span', { class: 'xt-name-text', text: d.channel || '' }), d.verified ? icon('verified', 'xt-verified') : null)
        ),
        meta ? h('div', { class: 'xt-cmeta', text: meta }) : null
      ),
      h('button', { class: 'xt-more', type: 'button', 'data-act': 'menu', title: 'Daha fazla' }, icon('dots'))
    );
    return card;
  }

  function renderCard(d, item) {
    const compact = !!item.closest('ytd-watch-flexy');
    const card = compact ? renderCompact(d) : h('article', { class: 'xt-post' + (d.isShort ? ' xt-short' : ''), 'data-id': d.id });
    card._xt = d;
    if (!item._xtRendered) card.classList.add('xt-enter');
    item._xtRendered = true;
    bindCard(card, d, item);
    if (compact) return card;
    const liked = S.likes.has(d.id);

    const nameLink = h(
      'a',
      { class: 'xt-name', href: d.chHref || '#', 'data-act': 'channel' },
      h('span', { class: 'xt-name-text', text: d.channel || 'YouTube' }),
      d.verified ? icon('verified', 'xt-verified') : null
    );
    const time = shortTime(d.time);

    card.append(
      h('a', { class: 'xt-avatar-link', href: d.chHref || '#', 'data-act': 'channel' }, avatarEl(d.avatar, d.channel)),
      h(
        'div',
        { class: 'xt-body' },
        h(
          'div',
          { class: 'xt-line' },
          nameLink,
          d.handle ? h('span', { class: 'xt-handle', text: d.handle }) : null,
          time ? h('span', { class: 'xt-dot', text: '·' }) : null,
          time ? h('a', { class: 'xt-time', href: d.href, title: d.time, text: time }) : null,
          h('button', { class: 'xt-more', type: 'button', 'data-act': 'menu', title: 'Daha fazla' }, icon('dots'))
        ),
        h('div', { class: 'xt-text' }, h('a', { class: 'xt-title', href: d.href }, titleNodes(d.title))),
        mediaEl(d, true),
        h(
          'div',
          { class: 'xt-actions' },
          act('reply', 'reply', 'Yanıtla (yorumlar)'),
          act('repost', 'repost', 'Yeniden gönder (bağlantıyı kopyala)'),
          (() => {
            const b = act('like', 'heart', 'Beğen');
            if (liked) b.classList.add('on');
            return b;
          })(),
          act('views', 'views', 'Görüntüleme', shortViews(d.views)),
          act('share', 'share', 'Paylaş')
        )
      )
    );
    return card;
  }

  function bindCard(card, d, item) {
    card.addEventListener('click', (e) => {
      const t = e.target.closest('[data-act]');
      const actName = t && card.contains(t) ? t.dataset.act : null;
      const url = new URL(d.href, location.origin).href;
      switch (actName) {
        case 'channel': {
          if (!d.chHref) return openVideo(item, d, e);
          if (modifier(e)) return;
          e.preventDefault();
          clickNav(findOriginal(item, `a[href="${CSS.escape(d.chHref)}"], a[href^="${CSS.escape(d.chHref)}"]`), new URL(d.chHref, location.origin).href);
          return;
        }
        case 'menu': {
          e.preventDefault();
          const btn = findOriginal(item, 'ytd-menu-renderer button, button[aria-label*="enü"], button[aria-label*="menu" i], button[aria-label*="İşlem"], button[aria-label*="Diğer"]');
          if (btn) btn.click();
          else toast('Menü bulunamadı');
          return;
        }
        case 'reply':
          sessionStorage.setItem('xt-comments', '1');
          return openVideo(item, d, e);
        case 'repost':
          e.preventDefault();
          copy(url);
          t.classList.add('on');
          toast('Gönderi bağlantısı kopyalandı');
          return;
        case 'like': {
          e.preventDefault();
          const on = !S.likes.has(d.id);
          on ? S.likes.add(d.id) : S.likes.delete(d.id);
          save('xtLikes', [...S.likes].slice(-2000));
          t.classList.toggle('on', on);
          t.classList.remove('pop');
          void t.offsetWidth;
          if (on) t.classList.add('pop');
          return;
        }
        case 'share':
          e.preventDefault();
          if (navigator.share) navigator.share({ title: d.title, url }).catch(() => {});
          else {
            copy(url);
            toast('Bağlantı panoya kopyalandı');
          }
          return;
      }
      if (e.target.closest('a.xt-tag')) return;
      openVideo(item, d, e);
    });
    card.addEventListener('auxclick', (e) => {
      if (e.button === 1 && !e.target.closest('a')) window.open(new URL(d.href, location.origin).href, '_blank');
    });
  }

  function unmark(item) {
    item.querySelector(':scope > .xt-post')?.remove();
    item.removeAttribute('xt-done');
    item._xtSig = null;
  }

  let changed = false;
  function scan() {
    if (!S.enabled) return;
    if (!DOC.classList.contains('xt-on')) DOC.classList.add('xt-on');
    if (!DOC.hasAttribute('dark')) DOC.setAttribute('dark', '');
    ensureShell();
    route(false);
    ensureFlow();
    updateAccount();

    const pm = document.querySelector('ytd-page-manager');
    if (!pm) return;
    for (const b of pm.querySelectorAll('yt-page-header-view-model yt-flexible-actions-view-model button-view-model:not([xt-hide])')) {
      if (/^(katıl|join)$/i.test(clean(b.textContent))) (b.closest('.ytFlexibleActionsViewModelAction, .yt-flexible-actions-view-model-wiz__action') || b).setAttribute('xt-hide', '');
    }
    for (const item of pm.querySelectorAll(ITEM_SEL)) {
      if (item.parentElement && item.parentElement.closest(ITEM_SEL)) continue;
      if (item.closest('ytd-shorts, yt-horizontal-list-renderer, ytd-universal-watch-card-renderer, ytd-horizontal-card-list-renderer, ytd-playlist-panel-renderer')) continue;
      if (item.closest('ytd-watch-flexy') && !item.closest('#related')) continue;
      const d = extract(item);
      if (!d) {
        if (item.hasAttribute('xt-done')) unmark(item);
        continue;
      }
      if (d.ad) {
        item.setAttribute('xt-skip', '');
        continue;
      }
      item.removeAttribute('xt-skip');
      if (d.avatar && d.chHref && S.avatars[d.chHref] !== d.avatar) {
        S.avatars[d.chHref] = d.avatar;
        saveAvatarsSoon();
      }
      const sig = [d.id, d.title, d.channel, d.chHref, d.avatar, d.views, d.time, d.dur, d.live, d.verified, d.progress, d.thumb].join('|');
      const existing = item.querySelector(':scope > .xt-post');
      if (item._xtSig === sig && existing) continue;
      item._xtSig = sig;
      const card = renderCard(d, item);
      existing ? existing.replaceWith(card) : item.append(card);
      item.setAttribute('xt-done', '');
      changed = true;
    }
    if (changed) {
      changed = false;
      sidebarSoon();
    }
  }

  let scanQueued = false;
  function scanSoon() {
    if (scanQueued) return;
    scanQueued = true;
    setTimeout(() => {
      scanQueued = false;
      try {
        scan();
      } catch (err) {
        console.warn('[YouTube X]', err);
      }
    }, 120);
  }

  function ensureShell() {
    if (!document.body) return;
    if (!document.getElementById('xt-nav')) {
      document.body.append(buildNav(), h('header', { id: 'xt-head' }), buildRight());
      route(true);
    }
  }

  // ---------------------------------------------------------------- enable / disable
  function setEnabled(on, persist) {
    // Kapatırken YouTube'un kendi koyu/açık temasına temiz dönmek için sayfayı yenile.
    if (!on && S.booted && S.enabled) {
      S.enabled = false;
      if (persist) save('xtEnabled', false);
      setTimeout(() => location.reload(), 150);
      return;
    }
    S.enabled = on;
    if (persist) save('xtEnabled', on);
    DOC.classList.toggle('xt-on', on);
    if (on) {
      if (!DOC.hasAttribute('dark')) DOC.setAttribute('dark', '');
      scanSoon();
      route(true);
    } else {
      if (!S.hadDark) DOC.removeAttribute('dark');
      DOC.removeAttribute('xt-mode');
      DOC.removeAttribute('xt-page');
      closeMenu();
    }
    window.dispatchEvent(new Event('resize'));
  }

  // ---------------------------------------------------------------- boot
  DOC.classList.add('xt-on');

  function boot(data) {
    S.likes = new Set(data.xtLikes || []);
    S.avatars = data.xtAvatars || {};
    setEnabled(data.xtEnabled !== false, false);
    S.booted = true;

    new MutationObserver((muts) => {
      if (!S.enabled) return;
      for (const m of muts) {
        const t = m.target.nodeType === 1 ? m.target : m.target.parentElement;
        if (t && t.closest && t.closest('#movie_player, .html5-video-player, #xt-nav, #xt-right, #xt-head, .xt-post, #xt-toast')) continue;
        scanSoon();
        return;
      }
    }).observe(DOC, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href', 'hidden'] });

    document.addEventListener('yt-navigate-finish', () => {
      route(true);
      scanSoon();
    });
    window.addEventListener('popstate', scanSoon);
    document.addEventListener('fullscreenchange', () => DOC.toggleAttribute('xt-fs', !!document.fullscreenElement));
    setInterval(scanSoon, 1500);
    scanSoon();

    if (store && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((ch, area) => {
        if (area === 'local' && ch.xtEnabled) setEnabled(ch.xtEnabled.newValue !== false, false);
      });
    }
  }

  if (store) store.get(['xtEnabled', 'xtLikes', 'xtAvatars'], (data) => boot(data || {}));
  else boot({});
})();
