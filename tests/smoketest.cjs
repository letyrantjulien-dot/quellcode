const { JSDOM } = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync(require('path').join(process.env.QC_ROOT || require('path').join(__dirname, '..'), 'index.html'), 'utf8');
let js = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
js = js.replace(/import \{ createClient \}[^\n]*\n/, '');

const dom = new JSDOM(html.replace(/<script type="module">[\s\S]*?<\/script>/, ''), {
  url: 'http://localhost/',
  runScripts: 'dangerously',
  pretendToBeVisual: true,
});
const w = dom.window;

const prelude = `
window.QC_CONFIG = { supabaseUrl: 'https://example.supabase.co', supabaseKey: 'test-key' };
const chain = () => { const p = Promise.resolve({ data: [], error: null, count: 0 });
  return new Proxy({}, { get: (_, k) => {
    if (k === 'then') return p.then.bind(p);
    if (k === 'catch') return p.catch.bind(p);
    return () => chainProxy; } }); };
let chainProxy; chainProxy = chain();
const createClient = () => ({ from: () => chainProxy, rpc: (name) => Promise.resolve(name === 'echo_openers' ? { data: [{year:1967,pump_id:'p1',ref:'92',district:'Kreuzberg',photo_path:'a.jpg'},{year:1966,pump_id:'p2',ref:'44',district:'Kreuzberg',photo_path:null}], error: null } : { data: [{year:1968,theme:'ocean',dating:'exact',text_de:'Fakt 1968',text_en:'x',text_fr:'x',text_ru:'x',text_tr:'x',source_url:'https://example.org'},{year:1967,theme:'chronik',dating:'exact',text_de:'Fakt 1967',text_en:'x',text_fr:'x',text_ru:'x',text_tr:'x',source_url:'https://example.org'},{year:1966,theme:'chronik',dating:'exact',text_de:'Fakt 1966',text_en:'x',text_fr:'x',text_ru:'x',text_tr:'x',source_url:'https://example.org'}], error: null }),
  storage: { from: () => ({ getPublicUrl: () => ({ data:{ publicUrl:'x' } }) }) } });
class MapStub { addControl(c){ if (c && c.onAdd){ const el = c.onAdd(this); el.id = el.id || 'ctlBox'; document.body.appendChild(el); } } on(){} once(){} addSource(){} addLayer(){} getZoom(){ return 12; }
  getSource(){ return { setData(){} }; } getLayer(){ return null; }
  setLayoutProperty(){} project(){ return {x:0,y:0}; } flyTo(){}
  queryRenderedFeatures(){ return []; } getCanvas(){ return { style:{} }; } }
class MarkerStub { constructor(){ window.__marker = (window.__marker||0) + 1; } setLngLat(){ return this; } addTo(){ return this; } remove(){ window.__marker--; } }
const maplibregl = { Map: MapStub, GeolocateControl: class {}, Marker: MarkerStub };
window.__geoMode = 'silent'; window.__watchers = [];
Object.defineProperty(navigator, 'geolocation', { configurable:true, value: {
  watchPosition(ok, err){ const id = window.__watchers.length + 1; window.__watchers.push({ ok, err });
    if (window.__geoMode === 'fix') setTimeout(() => ok({ coords:{ latitude:52.54, longitude:13.41 } }), 5);
    if (window.__geoMode === 'deny') setTimeout(() => err({ code:1 }), 5);
    return id; },
  clearWatch(){} } });
window.fetch = async () => ({ ok:true, json: async () => ({}) });
window.__errors = [];
window.onerror = (m) => { window.__errors.push('onerror: ' + m); };
`;

const s = w.document.createElement('script');
s.textContent = prelude + '\ntry {\n' + js + '\n} catch(e){ window.__boot = e.message + " | " + (e.stack||"").split("\\n")[1]; }';
w.document.body.appendChild(s);

console.log('boot error:', w.__boot || 'none');
const list = w.document.getElementById('lgList');
console.log('picker buttons:', list ? list.children.length : 'no #lgList');
if (list && list.children.length){
  try {
    list.children[0].dispatchEvent(new w.MouseEvent('click', { bubbles: true }));
    console.log('after click · lgModal hidden =', w.document.getElementById('lgModal').hidden,
                '· inModal hidden =', w.document.getElementById('inModal').hidden,
                '· intro title =', JSON.stringify(w.document.getElementById('inTitle').textContent));
  } catch (e){
    console.log('CLICK THREW:', e.message, '|', (e.stack||'').split('\n')[1]);
  }
}
(w.__errors||[]).forEach(e => console.log(e));

// exercise every guide entry and every tip, in every language
const langs = ['de','en','fr','ru','tr'];
let failures = 0;
for (const l of langs){
  w.localStorage.setItem('qc-lang', l);
  try {
    w.document.getElementById('langBtn').click();
  } catch(e){ console.log('lang cycle threw in', l, e.message); failures++; }
}
const help = w.document.getElementById('helpList');
console.log('guide entries:', help ? help.children.length : 'none');
if (help){
  for (const b of Array.from(help.children)){
    try { b.dispatchEvent(new w.MouseEvent('click', { bubbles:true })); }
    catch(e){ console.log('guide threw:', b.textContent, e.message); failures++; }
  }
}
for (const id of ['kzBtn','jnBtn','ecBtn','glBtn','fnBtn','stBtn','pgBtn','sqBtn']){
  try { w.document.getElementById(id).dispatchEvent(new w.MouseEvent('click', { bubbles:true })); }
  catch(e){ console.log(id, 'threw:', e.message); failures++; }
}
console.log(failures ? failures + ' FAILURES' : 'all panels and guides ran clean');

(async () => {
  await new Promise(r => setTimeout(r, 50));
  try {
    await w.__ecOpened(1967);
    const pop = w.document.getElementById('ecPop');
    console.log('echo popup hidden =', pop.hidden, '| head =', JSON.stringify(w.document.getElementById('ecPopHead').textContent),
      '| body =', JSON.stringify(w.document.getElementById('ecPopBody').textContent.slice(0,60)));
    w.document.getElementById('ecPopAll').click();
    await new Promise(r => setTimeout(r, 20));
    console.log('archive open =', !w.document.getElementById('ecModal').hidden,
      '| now =', JSON.stringify(w.document.getElementById('ecNow').textContent),
      '| entries =', w.document.getElementById('ecList').children.length);
    for (const l of ['en','fr','ru','tr','de']){ w.localStorage.setItem('qc-lang', l); w.document.getElementById('langBtn').click(); }
    console.log('language cycle with archive open: ok');
  } catch(e){ console.log('ECHO THREW:', e.message, (e.stack||'').split('\n')[1]); }
  (w.__errors||[]).forEach(e => console.log(e));
})();

(async () => {
  await new Promise(r => setTimeout(r, 120));
  const d = w.document;
  try {
    await w.__ecOpened(1967);
    const row = d.querySelector('#ecPopBody .ecOpen');
    console.log('popup opener row =', row ? JSON.stringify(row.textContent) : 'MISSING',
      '| nudge =', JSON.stringify((d.querySelector('#ecPopBody .ecNudge')||{}).textContent));
    row.click();
    console.log('opener photo -> lightbox open =', !d.getElementById('lightbox').hidden,
      '| station button =', JSON.stringify(d.getElementById('lbGoto').textContent),
      '| echo button hidden =', d.getElementById('lbEcho').hidden);
    d.getElementById('lbGoto').click();
    console.log('station button -> lightbox closed =', d.getElementById('lightbox').hidden,
      '| popup closed =', d.getElementById('ecPop').hidden);
    await w.__ecOpened(1966);
    console.log('1966 nudge (no photo) =', JSON.stringify((d.querySelector('#ecPopBody .ecNudge')||{}).textContent));
    for (const l of ['en','fr','ru','tr']){ w.localStorage.setItem('qc-lang', l); d.getElementById('langBtn').click(); }
    console.log('5-language cycle with opener popup: ok');
  } catch(e){ console.log('OPENERS THREW:', e.message, (e.stack||'').split('\n')[1]); }
  (w.__errors||[]).forEach(e => console.log(e));
})();
(async () => {
  await new Promise(r => setTimeout(r, 400));
  const d = w.document;
  try {
    d.getElementById('glBtn').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
    await new Promise(r => setTimeout(r, 50));
    const im = d.createElement('img'); im.dataset.pump = 'p1'; im.src = 'https://example.org/x.jpg';
    d.getElementById('glGrid').appendChild(im);
    im.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
    console.log('gallery photo -> echo button =', JSON.stringify(d.getElementById('lbEcho').textContent),
      '| visible =', !d.getElementById('lbEcho').hidden);
    d.getElementById('lbEcho').click();
    await new Promise(r => setTimeout(r, 50));
    console.log('echo button -> archive open =', !d.getElementById('ecModal').hidden,
      '| gallery closed =', d.getElementById('glModal').hidden,
      '| card 1967 present =', !!d.querySelector('#ecList .ecCard[data-year="1967"]'));
  } catch(e){ console.log('GALLERY PATH THREW:', e.message); }
})();

// ---------- v1.42.0: location flows ----------
(async () => {
  await new Promise(r => setTimeout(r, 700));
  const d = w.document, sleep = (ms) => new Promise(r => setTimeout(r, ms));
  try {
    const btn = d.querySelector('.maplibregl-ctrl-geolocate');
    console.log('locate button present =', !!btn, '| aria =', btn && btn.getAttribute('aria-label'));
    // 1. browser never answers
    w.__geoMode = 'silent';
    btn.click();
    console.log('silent: waiting class =', btn.classList.contains('maplibregl-ctrl-geolocate-waiting'));
    await sleep(8300);
    console.log('silent after 8 s: help open =', !d.getElementById('inModal').hidden,
      '| title =', JSON.stringify(d.getElementById('inTitle').textContent),
      '| retry visible =', !d.getElementById('inRetry').hidden,
      '| chrome hidden =', d.getElementById('inChrome').hidden,
      '| button error =', btn.classList.contains('maplibregl-ctrl-geolocate-active-error'));
    // 2. retry, now the browser answers
    w.__geoMode = 'fix';
    d.getElementById('inRetry').click();
    await sleep(60);
    console.log('retry -> fix: help closed =', d.getElementById('inModal').hidden,
      '| button active =', btn.classList.contains('maplibregl-ctrl-geolocate-active'),
      '| me dot =', w.__marker);
    btn.click();
    console.log('second tap -> locate off, dot removed =', w.__marker === 0);
    // 3. refusal shows a tappable help line in the Peilung
    const pgB = d.getElementById('pgBtn');
    if (!pgB.classList.contains('on')) pgB.dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
    w.__geoMode = 'deny';
    d.getElementById('inRetry').click();
    await sleep(60);
    const hint = d.getElementById('pgHint');
    console.log('deny: pgHint =', JSON.stringify(hint.textContent), '| tappable =', hint.classList.contains('tap'));
    d.getElementById('inModal').hidden = true;
    hint.click();
    console.log('tap hint -> help open =', !d.getElementById('inModal').hidden);
    // 4. the help in every language
    for (const l of ['de','en','fr','ru','tr']){
      w.localStorage.setItem('qc-lang', l); d.getElementById('langBtn').click();
      const paras = d.querySelectorAll('#inBody p').length;
      console.log(' help', l, '| paragraphs =', paras, '| title =', JSON.stringify(d.getElementById('inTitle').textContent), '| retry =', JSON.stringify(d.getElementById('inRetry').textContent));
    }
    // 5. listed among the guides
    const labels = Array.from(d.getElementById('helpList').children).map(b => b.textContent);
    console.log('guides =', labels.length, '| last =', JSON.stringify(labels[labels.length-1]));
  } catch(e){ console.log('LOCATION THREW:', e.message, (e.stack||'').split('\n')[1]); }
  (w.__errors||[]).forEach(e => console.log(e));
})();
