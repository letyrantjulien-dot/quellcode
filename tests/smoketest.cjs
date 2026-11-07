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
HTMLCanvasElement.prototype.getContext = function(){ return new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { o[k] = v; return true; } }); };
const chain = () => { const p = Promise.resolve({ data: [], error: null, count: 0 });
  return new Proxy({}, { get: (_, k) => {
    if (k === 'then') return p.then.bind(p);
    if (k === 'catch') return p.catch.bind(p);
    return () => chainProxy; } }); };
let chainProxy; chainProxy = chain();
const createClient = () => ({ from: () => chainProxy, rpc: (name) => Promise.resolve(name === 'echo_openers' ? { data: [{year:1967,pump_id:'p1',ref:'92',district:'Kreuzberg',photo_path:'a.jpg'},{year:1966,pump_id:'p2',ref:'44',district:'Kreuzberg',photo_path:null}], error: null } : { data: [{year:1968,theme:'ocean',dating:'exact',text_de:'Fakt 1968',text_en:'x',text_fr:'x',text_ru:'x',text_tr:'x',source_url:'https://example.org'},{year:1967,theme:'chronik',dating:'exact',text_de:'Fakt 1967',text_en:'x',text_fr:'x',text_ru:'x',text_tr:'x',source_url:'https://example.org'},{year:1966,theme:'chronik',dating:'exact',text_de:'Fakt 1966',text_en:'x',text_fr:'x',text_ru:'x',text_tr:'x',source_url:'https://example.org'}], error: null }),
  storage: { from: () => ({ getPublicUrl: () => ({ data:{ publicUrl:'x' } }) }) } });
class MapStub { addControl(){} on(){} once(){} addSource(){} addLayer(){}
  getSource(){ return { setData(){} }; } getLayer(){ return null; }
  setLayoutProperty(){} project(){ return {x:0,y:0}; } flyTo(){}
  queryRenderedFeatures(){ return []; } getCanvas(){ return { style:{} }; } }
const maplibregl = { Map: MapStub, GeolocateControl: class {} };
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

(async () => {
  await new Promise(r => setTimeout(r, 600));
  const d = w.document; let bad = 0;
  try {
    d.getElementById('ecBtn').dispatchEvent(new w.MouseEvent('click', { bubbles:true }));
    await new Promise(r => setTimeout(r, 30));
    const open = d.getElementById('tlOpen');
    console.log('time-lapse button in ECHO =', JSON.stringify(open.textContent));
    open.click(); await new Promise(r => setTimeout(r, 50));
    console.log('time-lapse open =', !d.getElementById('tlModal').hidden, '| info =', JSON.stringify(d.getElementById('tlInfo').textContent));
    for (const k of [' ', 'ArrowUp', 'ArrowDown', 'f', 'f', 'f', 'r', 'Enter'])
      d.dispatchEvent(new w.KeyboardEvent('keydown', { key:k, bubbles:true }));
    for (const id of ['tlPlay','tlRestart','tlFmt','tlRec']) d.getElementById(id).click();
    for (const l of ['de','en','fr','ru','tr']){
      w.localStorage.setItem('qc-lang', l); d.getElementById('langBtn').click();
      const labels = ['tlPlay','tlRestart','tlRec','tlSpeedLbl'].map(id => d.getElementById(id).textContent);
      if (labels.some(x => !x || x.includes('undefined'))){ bad++; console.log('missing label in', l, labels); }
      else console.log(l, '·', d.querySelector('#tlModal h3').textContent, '·', labels.join(' | '), '·', d.getElementById('tlInfo').textContent);
    }
    d.getElementById('inOk').click();
    d.dispatchEvent(new w.KeyboardEvent('keydown', { key:'Escape', bubbles:true }));
    console.log('Escape closes =', d.getElementById('tlModal').hidden, '| guide entries =', d.getElementById('helpList').children.length);
  } catch(e){ bad++; console.log('TIME-LAPSE THREW:', e.message, (e.stack||'').split('\n')[1]); }
  (w.__errors||[]).forEach(e => { bad++; console.log(e); });
  console.log(bad ? bad + ' TIME-LAPSE FAILURES' : 'time-lapse panel ran clean in 5 languages');
})();
