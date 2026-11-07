// 梧藝客服小幫手：LINE 聊天頁內容腳本（v2）
// 只負責「找到對話輸入框 → 填入文字 → 游標放到最後」。
// 絕不點擊傳送鈕、絕不送出 Enter / Command+Enter 等任何按鍵，傳送由使用者自己按。
(function () {
  'use strict';
  const VERSION = 2;
  if (window.__wuyiQR && window.__wuyiQR.version >= VERSION) return; // 已載入新版

  const CE_SEL = '[contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]';
  const CAND_SEL = 'textarea, input, [contenteditable], [role="textbox"]';
  const SEARCH_RE = /搜尋|搜索|検索|search|filter|篩選|查詢/i;
  const COMPOSER_RE = /傳送|传送|送信|發送|Enter|send|訊息|讯息|メッセージ|message|輸入|输入|reply|回覆/i;
  const COMPOSER_CTX_RE = /compos|editor|message|chat-?input|input-?area|footer|reply|send|textarea/i;

  // ---- 走訪 document 與所有「開放的」shadow root ----
  function collectRoots() {
    const roots = [document];
    for (let i = 0; i < roots.length; i++) {
      const root = roots[i];
      const all = root.querySelectorAll('*');
      for (const el of all) if (el.shadowRoot) roots.push(el.shadowRoot);
    }
    return roots;
  }
  function queryAllDeep(sel, roots) {
    const out = [];
    roots.forEach(r => r.querySelectorAll(sel).forEach(el => out.push(el)));
    return out;
  }

  function parentOf(el) {
    return el.parentElement || (el.getRootNode && el.getRootNode().host) || null;
  }
  function styleHidden(el) {
    const cs = getComputedStyle(el);
    return cs.display === 'none' || cs.visibility === 'hidden';
  }
  // 放寬可見判斷：自動長高的 textarea 可能高度很小，只要自己有 1px 或父層看得到就算
  function isVisible(el) {
    if (!el || !el.isConnected || styleHidden(el)) return false;
    if (el.closest && el.closest('[aria-hidden="true"]')) return false;
    const r = el.getBoundingClientRect();
    if (r.width >= 1 && r.height >= 1) return true;
    const p = parentOf(el);
    if (!p || !(p instanceof Element) || styleHidden(p)) return false;
    const pr = p.getBoundingClientRect();
    return pr.width >= 2 && pr.height >= 2;
  }

  function hintOf(el) {
    return [el.getAttribute('placeholder'), el.getAttribute('aria-label'), el.getAttribute('data-placeholder'),
      el.getAttribute('name'), el.id, typeof el.className === 'string' ? el.className : ''].filter(Boolean).join(' ');
  }
  function isSearchBox(el) {
    if (el.closest && el.closest('[role="search"]')) return true;
    return SEARCH_RE.test(hintOf(el)) || (el.tagName === 'INPUT' && (el.type || '').toLowerCase() === 'search');
  }
  function inComposerContext(el) {
    let n = el, depth = 0;
    while (n && depth < 8) {
      if (n instanceof Element) {
        if (n.tagName === 'FORM' || n.tagName === 'FOOTER') return true;
        const c = (typeof n.className === 'string' ? n.className : '') + ' ' + (n.id || '');
        if (COMPOSER_CTX_RE.test(c)) return true;
      }
      n = parentOf(n); depth++;
    }
    return false;
  }

  // 判斷元素屬於哪一種輸入框；不合格回傳 null
  function classify(el) {
    if (el instanceof HTMLTextAreaElement) return (el.disabled || el.readOnly) ? null : 'textarea';
    if (el instanceof HTMLInputElement) {
      const t = (el.getAttribute('type') || 'text').toLowerCase();
      if (t !== 'text' || el.disabled || el.readOnly) return null;
      return inComposerContext(el) || COMPOSER_RE.test(hintOf(el)) ? 'input' : null;
    }
    if (el.isContentEditable) {
      // 只取最外層的 contenteditable
      const p = parentOf(el);
      if (p && p instanceof Element && p.isContentEditable) return null;
      return 'contenteditable';
    }
    if (el.getAttribute && el.getAttribute('role') === 'textbox') return 'role-textbox';
    return null;
  }

  let lastFocused = null;
  document.addEventListener('focusin', e => {
    const el = e.composedPath ? e.composedPath()[0] : e.target;
    if (el instanceof Element && classify(el) && !isSearchBox(el)) lastFocused = el;
  }, true);

  function scoreOf(el, kind) {
    let s = 0;
    const hint = hintOf(el);
    if (COMPOSER_RE.test(hint)) s += 100;
    if (kind === 'textarea') s += 20;
    else if (kind === 'contenteditable') s += 15;
    else if (kind === 'role-textbox') s += 12;
    else if (kind === 'input') s += 5;
    if (inComposerContext(el)) s += 10;
    if (el === lastFocused) s += 50;
    const r = el.getBoundingClientRect();
    s += Math.max(0, Math.min(r.bottom, 5000)) / 10000; // 越下方越優先（對話框通常在最下面）
    return s;
  }

  function scan() {
    const roots = collectRoots();
    const els = queryAllDeep(CAND_SEL, roots);
    const cands = [];
    els.forEach(el => {
      const kind = classify(el);
      if (!kind || isSearchBox(el) || !isVisible(el)) return;
      cands.push({ el, kind, score: scoreOf(el, kind) });
    });
    cands.sort((a, b) => b.score - a.score);
    return { roots, cands };
  }

  function findInput() {
    const { cands } = scan();
    return cands.length ? cands[0] : null;
  }

  // ---- 填入 ----
  function setNativeValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value); // 原生 setter，讓 React/Vue 偵測到
    el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }
  function insertIntoField(el, text, isInput) {
    const existing = el.value || '';
    const appended = existing.trim().length > 0;
    const sep = isInput ? ' ' : '\n';
    const next = appended ? existing.replace(/\s+$/, '') + sep + (isInput ? text.replace(/\n+/g, ' ') : text) : (isInput ? text.replace(/\n+/g, ' ') : text);
    setNativeValue(el, next);
    el.focus();
    try { el.setSelectionRange(next.length, next.length); } catch (e) {}
    el.scrollTop = el.scrollHeight;
    return { appended };
  }
  function insertIntoEditable(el, text) {
    // role=textbox 但本身不可編輯：找裡面的可編輯元素
    if (!el.isContentEditable) {
      const inner = el.querySelector(CE_SEL + ', textarea, input');
      if (inner) {
        if (inner instanceof HTMLTextAreaElement) return insertIntoField(inner, text, false);
        if (inner instanceof HTMLInputElement) return insertIntoField(inner, text, true);
        el = inner;
      }
    }
    const existing = (el.innerText || el.textContent || '').replace(/\u200b/g, '');
    const appended = existing.trim().length > 0;
    el.focus();
    const sel = (el.getRootNode && el.getRootNode().getSelection) ? el.getRootNode().getSelection() : window.getSelection();
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false); // 游標移到最後
      (sel || window.getSelection()).removeAllRanges();
      (sel || window.getSelection()).addRange(range);
    } catch (e) {}
    const toInsert = appended ? '\n' + text : text;
    const before = el.textContent;
    let ok = false;
    try { ok = document.execCommand('insertText', false, toInsert); } catch (e) { ok = false; }
    if (!ok || el.textContent === before) {
      el.appendChild(document.createTextNode(toInsert));
      el.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: toInsert }));
    }
    return { appended };
  }

  function insert(text) {
    const found = findInput();
    if (!found) return { ok: false, reason: 'input-not-found' };
    const { el, kind } = found;
    const r = kind === 'textarea' ? insertIntoField(el, text, false)
      : kind === 'input' ? insertIntoField(el, text, true)
      : insertIntoEditable(el, text);
    return { ok: true, kind, appended: r.appended };
  }

  // ---- 診斷（不含任何訊息內容）----
  const cut = s => (s || '').replace(/\s+/g, ' ').slice(0, 40);
  function safeUrl(u) {
    try { const x = new URL(u, location.href); return x.protocol === 'about:' ? x.href.split('?')[0] : x.host + x.pathname; }
    catch (e) { return '(無法解析)'; }
  }
  function probe() {
    const { roots, cands } = scan();
    const all = queryAllDeep(CAND_SEL, roots);
    const describe = el => {
      const k = classify(el);
      return cut([el.tagName.toLowerCase() + (k ? '(' + k + ')' : ''),
        el.getAttribute('placeholder') ? 'ph=' + el.getAttribute('placeholder') : '',
        el.getAttribute('aria-label') ? 'aria=' + el.getAttribute('aria-label') : '',
        isVisible(el) ? '' : '[隱藏]', isSearchBox(el) ? '[搜尋]' : ''].filter(Boolean).join(' '));
    };
    const shown = (cands.length ? cands.map(c => c.el) : all).slice(0, 5);
    return {
      found: cands.length > 0,
      score: cands.length ? cands[0].score : -1,
      kind: cands.length ? cands[0].kind : null,
      diag: {
        frame: safeUrl(location.href),
        isTop: window === window.top,
        textarea: queryAllDeep('textarea', roots).length,
        contenteditable: queryAllDeep('[contenteditable]', roots).length,
        roleTextbox: queryAllDeep('[role="textbox"]', roots).length,
        shadowRoots: roots.length - 1,
        usable: cands.length,
        candidates: shown.map(describe),
        iframes: Array.from(document.querySelectorAll('iframe')).slice(0, 5).map(f => safeUrl(f.src || 'about:blank'))
      }
    };
  }

  window.__wuyiQR = { version: VERSION, insert, probe, findInput };
})();
