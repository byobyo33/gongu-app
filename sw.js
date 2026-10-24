// 공구장부 서비스워커: 앱 화면 저장(오프라인) + 카톡 공유 받기
const SHELL = 'gongu-shell-v7';
const FILES = ['./', './index.html', './manifest.webmanifest', './firebase-config.js?v=2', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('gongu-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request; const url = new URL(req.url);
  // 카톡 '내보내기 → 공유 → 공구장부'로 들어온 대화 파일
  if (req.method === 'POST' && url.pathname.endsWith('/share-target')) {
    e.respondWith((async () => {
      let text = '';
      try {
        const form = await req.formData();
        const files = form.getAll('chat').filter(f => f && typeof f.text === 'function');
        for (const f of files) text += (text ? '\n' : '') + await readText(f);
        if (!text) text = [form.get('title'), form.get('text')].filter(Boolean).join('\n');
      } catch (err) {}
      const c = await caches.open('gongu-shared');
      await c.put('shared-chat', new Response(text, { headers: { 'content-type': 'text/plain; charset=utf-8' } }));
      return Response.redirect(new URL('./?shared=1', self.registration.scope).href, 303);
    })());
    return;
  }
  if (req.method !== 'GET') return;
  // 같은 주소의 앱 파일: 인터넷 우선, 끊기면 저장본
  if (url.origin === self.location.origin) {
    // 항상 서버에 새 버전 확인
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok) { const cp = r.clone(); caches.open(SHELL).then(c => c.put(req, cp)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
    return;
  }
  // 글꼴·Firebase 라이브러리: 저장본 우선
  if (/fonts\.(googleapis|gstatic)\.com|gstatic\.com\/firebasejs/.test(url.href)) {
    e.respondWith(caches.open(SHELL).then(c => c.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }))));
  }
});

// UTF-8로 읽다 깨지면 EUC-KR로 다시 읽기 (오래된 PC 카톡 파일). zip이면 안의 txt를 꺼내요.
function decode(buf) {
  let t = new TextDecoder('utf-8').decode(buf);
  if (/�/.test(t.slice(0, 2000))) { try { t = new TextDecoder('euc-kr').decode(buf); } catch (e) {} }
  return t.replace(/^﻿/, '');
}
async function readText(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf[0] === 0x50 && buf[1] === 0x4b) return (await unzipTexts(buf)).join('\n');
  return decode(buf);
}
// 간단한 zip 읽기: .txt 항목만 (저장/deflate)
async function unzipTexts(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); const out = [];
  let eocd = -1; for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) return out;
  let p = dv.getUint32(eocd + 16, true); const n = dv.getUint16(eocd + 10, true);
  for (let k = 0; k < n; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
    const nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true), lho = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + xlen + clen;
    if (!/\.txt$/i.test(name)) continue;
    const start = lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
    const data = u8.subarray(start, start + csize);
    try {
      const raw = method === 0 ? data : new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
      out.push(decode(raw));
    } catch (e) {}
  }
  return out;
}
