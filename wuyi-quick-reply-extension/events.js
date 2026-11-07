// 事件委派：取代原本網頁的 inline onclick 等寫法（MV3 CSP 禁止 inline 腳本）。
// HTML 上寫 data-on-click="fnName('a', 1, this, event)"，這裡安全地解析參數（不使用 eval）後呼叫全域函式。
(function () {
  'use strict';

  function parseCall(expr) {
    const m = /^\s*([A-Za-z_$][\w$]*)\s*\(([\s\S]*)\)\s*;?\s*$/.exec(expr);
    if (!m) return null;
    const name = m[1];
    const src = m[2];
    const args = [];
    let i = 0;
    const n = src.length;
    const skipWs = () => { while (i < n && /\s/.test(src[i])) i++; };
    skipWs();
    while (i < n) {
      const c = src[i];
      if (c === "'" || c === '"' || c === '`') {
        let s = '';
        i++;
        while (i < n && src[i] !== c) {
          if (src[i] === '\\' && i + 1 < n) { i++; }
          s += src[i++];
        }
        i++; // closing quote
        args.push({ t: 'lit', v: s });
      } else {
        let tok = '';
        while (i < n && src[i] !== ',') tok += src[i++];
        tok = tok.trim();
        if (tok === 'this') args.push({ t: 'this' });
        else if (tok === 'event') args.push({ t: 'event' });
        else if (tok === 'true' || tok === 'false') args.push({ t: 'lit', v: tok === 'true' });
        else if (tok === 'null') args.push({ t: 'lit', v: null });
        else if (tok !== '' && !isNaN(Number(tok))) args.push({ t: 'lit', v: Number(tok) });
        else { console.warn('[梧藝] 無法解析的參數：', tok, 'in', expr); return null; }
      }
      skipWs();
      if (src[i] === ',') { i++; skipWs(); }
    }
    return { name, args };
  }

  const cache = new Map();
  function run(el, attr, ev) {
    const expr = el.getAttribute(attr);
    if (!expr) return;
    let call = cache.get(expr);
    if (call === undefined) { call = parseCall(expr); cache.set(expr, call); }
    if (!call) return;
    const fn = window[call.name];
    if (typeof fn !== 'function') { console.warn('[梧藝] 找不到函式：', call.name); return; }
    const args = call.args.map(a => a.t === 'this' ? el : a.t === 'event' ? ev : a.v);
    // 讓原本 inline handler 用到的 event.currentTarget 指向掛 handler 的元素（委派時預設會是 document）
    try { Object.defineProperty(ev, 'currentTarget', { value: el, configurable: true }); } catch (e) {}
    return fn.apply(el, args);
  }

  // 會冒泡的事件：從 target 往上找所有掛了 data-on-xxx 的元素，模擬原生 inline handler 的冒泡順序
  const BUBBLING = ['click', 'input', 'change', 'mousedown', 'mouseup', 'touchstart', 'touchmove',
    'touchend', 'touchcancel', 'dragstart', 'dragover', 'dragleave', 'drop', 'dragend', 'keydown', 'keyup'];
  BUBBLING.forEach(type => {
    const attr = 'data-on-' + type;
    const passive = type.startsWith('touch') ? { passive: false } : false;
    document.addEventListener(type, ev => {
      let el = ev.target instanceof Element ? ev.target : ev.target && ev.target.parentElement;
      while (el && el !== document.documentElement) {
        if (el.hasAttribute && el.hasAttribute(attr)) {
          run(el, attr, ev);
          if (ev.cancelBubble) break;
        }
        el = el.parentElement;
      }
    }, passive);
  });

  // 不冒泡的事件（mouseleave / mouseenter）：用 capture 階段，只處理事件本身的元素
  ['mouseleave', 'mouseenter'].forEach(type => {
    const attr = 'data-on-' + type;
    document.addEventListener(type, ev => {
      const el = ev.target;
      if (el instanceof Element && el.hasAttribute(attr)) run(el, attr, ev);
    }, true);
  });

  window.__wuyiParseCall = parseCall; // 測試用
})();
