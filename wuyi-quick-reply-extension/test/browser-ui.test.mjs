import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const artifacts = '/opt/cursor/artifacts';
const chromeBin = '/usr/local/bin/google-chrome';

function syntheticPages() {
  const pages = {};
  for (let p = 1; p <= 10; p += 1) pages[String(p)] = Array(20).fill(null);
  pages['1'][0] = { id: 't1', category: '💐', title: '合成甲', text: '合成內文甲' };
  pages['1'][12] = { id: 'hid', category: '🎂', title: '合成藏', text: '合成內文藏' };
  return pages;
}

const PRELOAD = `
window.__ui = { paste: [], clip: [], script: [], keys: [] };
const OrigKey = window.KeyboardEvent;
window.KeyboardEvent = function (type, init) {
  try {
    if (init && (init.key === 'Enter' || init.code === 'Enter' || init.keyCode === 13)) window.__ui.keys.push(String(type));
  } catch (e) {}
  return new OrigKey(type, init);
};
window.KeyboardEvent.prototype = OrigKey.prototype;
try {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText(text) { window.__ui.clip.push(String(text).length); return Promise.resolve(); } }
  });
} catch (e) {}
localStorage.setItem('wuyi_defaults_version', '1.0.2-003851d4');
localStorage.setItem('wuyi_slots_per_page', '10');
localStorage.setItem('wuyi_100_pages_data', ${JSON.stringify(JSON.stringify(syntheticPages()))});
window.chrome = {
  runtime: {
    getManifest() { return { version: '1.0.7' }; },
    getURL(p) { return location.origin + '/' + String(p).replace(/^\\//, ''); },
    id: 'isolated-test'
  },
  tabs: { query: async () => [] },
  windows: {
    getCurrent: async () => ({ id: 1 }),
    getLastFocused: async () => ({ id: 1 }),
    create: async () => { throw new Error('popup-create-blocked'); },
    onFocusChanged: { addListener() {} },
    onBoundsChanged: { addListener() {} }
  },
  sidePanel: { setPanelBehavior: async () => {}, open: async () => {} },
  scripting: { executeScript: async () => { window.__ui.script.push(1); return []; } }
};
`;

function serve(dir) {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
    const file = path.normalize(path.join(dir, pathname));
    if (!file.startsWith(dir)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); res.end('missing'); return; }
      const ext = path.extname(file);
      const type = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'content-type': `${type}; charset=utf-8` });
      res.end(data);
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function launchChrome(port) {
  return new Promise((resolve, reject) => {
    const child = spawn(chromeBin, [
      '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--disable-dev-shm-usage', '--disable-background-networking', '--disable-sync',
      `--remote-debugging-port=${port}`, `--user-data-dir=/tmp/wuyi-ui-${port}`, 'about:blank'
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let buf = '';
    const timer = setTimeout(() => reject(new Error('chrome debug port timeout')), 20000);
    const onData = chunk => {
      buf += chunk.toString();
      const match = buf.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/);
      if (match) { clearTimeout(timer); resolve({ child, port: Number(match[1]) }); }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);
    child.on('exit', code => reject(new Error('chrome exited ' + code)));
  });
}

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.next = 0;
    this.pending = new Map();
    this.requests = [];
    ws.addEventListener('message', event => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Network.requestWillBeSent') this.requests.push(msg.params.request.url);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.next;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  async eval(expression) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ' ' + (result.exceptionDetails.exception?.description || ''));
    return result.result.value;
  }
}

async function connectPage(port) {
  const list = await fetch(`http://127.0.0.1:${port}/json/list`).then(r => r.json());
  const page = list.find(item => item.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); });
  return new Cdp(ws);
}

async function shot(cdp, file, width, height) {
  const metrics = await cdp.send('Page.getLayoutMetrics');
  const full = Math.min(Math.ceil(metrics.cssContentSize.height), 2400);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: Math.max(full, height), deviceScaleFactor: 1, mobile: false });
  const image = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(file, Buffer.from(image.data, 'base64'));
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
}

async function click(cdp, selector) {
  const box = await cdp.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 20), w: r.width, h: r.height };
  })()`);
  assert.ok(box && box.w > 0 && box.h > 0, '找不到可點的 ' + selector);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', buttons: 1, clickCount: 1 });
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', buttons: 0, clickCount: 1 });
  const hit = await cdp.eval(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    const r = el.getBoundingClientRect();
    const at = document.elementFromPoint(r.x + r.width / 2, r.y + Math.min(r.height / 2, 20));
    return !!(at && (at === el || el.contains(at)));
  })()`);
  if (!hit) await cdp.eval(`document.querySelector(${JSON.stringify(selector)}).click()`);
  await new Promise(resolve => setTimeout(resolve, 120));
}

test('full sidepanel layout and real clicks at 320px and 280px', { timeout: 120000 }, async () => {
  const server = await serve(root);
  const origin = `http://127.0.0.1:${server.address().port}`;
  let chrome;
  try {
    chrome = await launchChrome(9333);
    const cdp = await connectPage(chrome.port);
    await cdp.send('Page.enable');
    await cdp.send('Network.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: PRELOAD });
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp.send('Page.navigate', { url: origin + '/sidepanel.html' });
    await cdp.eval('document.fonts ? document.fonts.ready : null');
    await new Promise(resolve => setTimeout(resolve, 400));

    const layout = await cdp.eval(`(() => {
      const tops = sel => [...document.querySelectorAll(sel)].map(el => Math.round(el.getBoundingClientRect().top));
      const spread = arr => arr.length ? Math.max(...arr) - Math.min(...arr) : -1;
      const pills = tops('.cat-pill');
      const slots = tops('[aria-label^="每頁顯示"]');
      const header = document.querySelector('.app-title')?.getBoundingClientRect();
      const card = document.querySelector('.reply-card')?.getBoundingClientRect();
      const css = getComputedStyle(document.querySelector('.category-pills'));
      return {
        title: document.querySelector('.app-title')?.textContent || '',
        pillCount: pills.length,
        pillSpread: spread(pills),
        pillWrap: css.flexWrap,
        pillDirection: css.flexDirection,
        slotCount: slots.length,
        slotSpread: spread(slots),
        headerTop: header ? header.top : -1,
        headerWidth: header ? header.width : 0,
        cardWidth: card ? card.width : 0,
        hasMove: !!document.querySelector('.btn-card-move'),
        hasQuote: !!document.querySelector('#quoteCollapse'),
        leaked: ['玉山銀行', '匯款帳號'].filter(s => document.body.innerText.includes(s)).length,
        showsSynthetic: document.body.innerText.includes('合成甲')
      };
    })()`);
    assert.equal(layout.leaked, 0);
    assert.equal(layout.showsSynthetic, true);
    assert.match(layout.title, /梧藝客服小幫手/);
    assert.equal(layout.pillDirection, 'row');
    assert.equal(layout.pillWrap, 'nowrap');
    assert.ok(layout.pillCount >= 14, '類別膠囊不足');
    assert.ok(layout.pillSpread < 12, '類別不是橫向一列，spread=' + layout.pillSpread);
    assert.equal(layout.slotCount, 3);
    assert.ok(layout.slotSpread < 12, '每頁格數不是同一列，spread=' + layout.slotSpread);
    assert.ok(layout.headerTop >= 0 && layout.headerTop < 20);
    assert.ok(layout.headerWidth > 80);
    assert.ok(layout.cardWidth > 240, '回覆卡寬度異常 ' + layout.cardWidth);
    assert.equal(layout.hasMove, true);
    assert.equal(layout.hasQuote, true);
    fs.mkdirSync(artifacts, { recursive: true });
    await shot(cdp, path.join(artifacts, 'wuyi-full-sidebar-320.png'), 320, 900);

    await cdp.eval(`(() => {
      window.__ui.paste = []; window.__ui.clip = []; window.__ui.script = []; window.__ui.keys = [];
      const orig = window.WuyiPaste.pasteToLine.bind(window.WuyiPaste);
      window.WuyiPaste.pasteToLine = (text) => { window.__ui.paste.push(String(text).length); return orig(text); };
    })()`);

    await click(cdp, '.btn-card-move');
    const afterMove = await cdp.eval(`({ modal: document.getElementById('moveModal').classList.contains('show'), paste: window.__ui.paste.length })`);
    assert.equal(afterMove.modal, true);
    assert.equal(afterMove.paste, 0);
    const slotLabel = await cdp.eval(`document.getElementById('targetSlotLabel').textContent`);
    assert.match(slotLabel, /#1~#20/);
    await shot(cdp, path.join(artifacts, 'wuyi-full-move-320.png'), 320, 900);
    await click(cdp, '#moveModal .btn-modal-close');

    await click(cdp, '.btn-card-edit');
    const afterEdit = await cdp.eval(`({ modal: document.getElementById('editModal').classList.contains('show'), paste: window.__ui.paste.length })`);
    assert.equal(afterEdit.modal, true);
    assert.equal(afterEdit.paste, 0);
    await click(cdp, '#editModal .btn-modal-close');

    await click(cdp, '.reply-card-title');
    await new Promise(resolve => setTimeout(resolve, 200));
    const afterCard = await cdp.eval(`window.__ui`);
    assert.equal(afterCard.paste.length, 1);
    assert.equal(afterCard.script.length, 0);
    assert.equal(afterCard.keys.length, 0);

    await click(cdp, '[aria-label="每頁顯示 20 格"]');
    const wide = await cdp.eval(`({
      hidden: document.body.innerText.includes('合成藏'),
      active: document.querySelector('[aria-label="每頁顯示 20 格"]').classList.contains('active')
    })`);
    assert.equal(wide.hidden, true);
    assert.equal(wide.active, true);
    await click(cdp, '[aria-label="每頁顯示 10 格"]');
    const back = await cdp.eval(`document.body.innerText.includes('此頁有 1 則在目前未顯示的格子（13）')`);
    assert.equal(back, true);

    await cdp.eval(`document.querySelector('[data-category-index="1"]').focus()`);
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37, modifiers: 1 });
    await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37, modifiers: 1 });
    const order = await cdp.eval(`[...document.querySelectorAll('[data-category-index]')].slice(0, 2).map(el => el.textContent)`);
    assert.deepEqual(order, ['🌹', '💐']);

    await click(cdp, '#quoteCollapse .collapse-header');
    await click(cdp, '#btnC30');
    await click(cdp, '#btnC30');
    await click(cdp, '#customAddonName');
    await cdp.send('Input.insertText', { text: '合成加購' });
    await click(cdp, '#customAddonAmount');
    await cdp.send('Input.insertText', { text: '30' });
    await new Promise(resolve => setTimeout(resolve, 100));
    const quote = await cdp.eval(`({
      candle: document.getElementById('btnC30').textContent,
      total: document.getElementById('quoteTotalValue').textContent,
      items: document.getElementById('quoteTotalItems').textContent,
      open: document.getElementById('quoteCollapse').classList.contains('open'),
      grids: getComputedStyle(document.querySelector('.sp-q-grid-3')).gridTemplateColumns.split(' ').length
    })`);
    assert.equal(quote.open, true);
    assert.equal(quote.candle, '數字蠟燭 x2 +$60');
    assert.equal(quote.total, '$90');
    assert.match(quote.items, /數字蠟燭x2\$60/);
    assert.match(quote.items, /合成加購\$30/);
    assert.equal(quote.grids, 3);
    await shot(cdp, path.join(artifacts, 'wuyi-full-quote-320.png'), 320, 900);

    const pasteBeforeReset = await cdp.eval(`window.__ui.paste.length`);
    await click(cdp, '[data-on-click="resetQuote()"]');
    const reset = await cdp.eval(`({
      candle: document.getElementById('btnC30').textContent,
      name: document.getElementById('customAddonName').value,
      amount: document.getElementById('customAddonAmount').value,
      total: document.getElementById('quoteTotalValue').textContent,
      paste: window.__ui.paste.length
    })`);
    assert.equal(reset.candle, '數字蠟燭 $30');
    assert.equal(reset.name, '');
    assert.equal(reset.amount, '');
    assert.equal(reset.total, '$0');
    assert.equal(reset.paste, pasteBeforeReset);

    await cdp.send('Page.navigate', { url: origin + '/sidepanel.html?mode=popup' });
    await new Promise(resolve => setTimeout(resolve, 400));
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 280, height: 700, deviceScaleFactor: 1, mobile: false });
    const popup = await cdp.eval(`(() => {
      const pills = [...document.querySelectorAll('.cat-pill')].map(el => Math.round(el.getBoundingClientRect().top));
      const slots = [...document.querySelectorAll('[aria-label^="每頁顯示"]')].map(el => Math.round(el.getBoundingClientRect().top));
      const header = document.querySelector('.sp-header')?.getBoundingClientRect();
      return {
        popup: document.body.classList.contains('popup-mode'),
        pillSpread: Math.max(...pills) - Math.min(...pills),
        slotSpread: Math.max(...slots) - Math.min(...slots),
        headerHeight: header ? header.height : 0,
        title: document.querySelector('.app-title')?.textContent || ''
      };
    })()`);
    assert.equal(popup.popup, true);
    assert.ok(popup.pillSpread < 12);
    assert.ok(popup.slotSpread < 12);
    assert.ok(popup.headerHeight >= 24 && popup.headerHeight <= 48);
    assert.match(popup.title, /梧藝客服小幫手/);
    await shot(cdp, path.join(artifacts, 'wuyi-full-window-280.png'), 280, 700);

    const outside = cdp.requests.filter(url => /line\.(biz|me)|chat\.line/i.test(url));
    assert.deepEqual(outside, []);
    fs.writeFileSync(path.join(artifacts, 'wuyi-browser-ui-result.json'), JSON.stringify({
      layout, afterMove, afterEdit, afterCard: { paste: afterCard.paste.length, script: afterCard.script.length, keys: afterCard.keys.length },
      wide, order, quote, reset, popup, lineRequests: outside.length
    }, null, 2));
  } finally {
    server.close();
    if (chrome) chrome.child.kill('SIGKILL');
  }
});
