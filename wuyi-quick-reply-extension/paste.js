// 把文字貼進 chat.line.biz 目前開著的客人對話框（只貼上，絕不自動傳送、不按任何鍵）。
(function () {
  'use strict';
  const LINE_URL_RE = /^https:\/\/chat\.line\.biz\//;
  const VERSION = (chrome.runtime.getManifest && chrome.runtime.getManifest().version) || '?';
  const MESSAGES = {
    'no-line-tab': '目前分頁不是 LINE 聊天（chat.line.biz），請先切到客人對話',
    'inject-failed': '無法連到 LINE 分頁，請重新整理 LINE 頁面後再試',
    'input-not-found': '找不到 LINE 對話框，請先打開客人對話',
    'error': '貼上時發生錯誤'
  };
  let lastDiag = null;

  function toast(msg, icon) { if (typeof window.showToast === 'function') window.showToast(msg, icon); }
  function copyText(text) {
    if (typeof window.performSafeCopy === 'function') window.performSafeCopy(text, () => {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  }
  function safeUrl(u) {
    if (!u) return null;
    try { const x = new URL(u); return x.host + x.pathname; } catch (e) { return '(無法解析)'; }
  }

  // (a) 先找目前視窗的作用中分頁，再找最後聚焦視窗的作用中分頁
  // 小視窗模式：目標是「最後使用的一般瀏覽器視窗」的作用中分頁（不是小視窗自己）
  const IS_POPUP = new URLSearchParams(location.search).get('mode') === 'popup';
  async function getCandidateTabs() {
    const seen = new Set(), tabs = [];
    const add = res => (res || []).forEach(t => { if (t && t.id != null && !seen.has(t.id)) { seen.add(t.id); tabs.push(t); } });
    async function lastNormal() {
      try {
        const w = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
        if (w && w.id != null) add(await chrome.tabs.query({ active: true, windowId: w.id }));
      } catch (e) {}
    }
    if (IS_POPUP) { await lastNormal(); return tabs; }
    for (const q of [{ active: true, currentWindow: true }, { active: true, lastFocusedWindow: true }]) {
      try { add(await chrome.tabs.query(q)); } catch (e) {}
    }
    await lastNormal();
    return tabs;
  }
  async function getActiveLineTab() {
    const tabs = await getCandidateTabs();
    return tabs.find(t => t.url && LINE_URL_RE.test(t.url)) || null;
  }

  // (b) 在所有 frame 注入並探測，挑分數最高的 frame 填入
  async function pasteToTab(tabId, text, urlKnown) {
    const diag = { tabId };
    try {
      await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ['content.js'] });
    } catch (e) {
      return { ok: false, reason: urlKnown === false ? 'no-line-tab' : 'inject-failed', error: String(e && e.message || e), diag };
    }
    let probes;
    try {
      probes = await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        func: () => (window.__wuyiQR && window.__wuyiQR.probe) ? window.__wuyiQR.probe() : { found: false, diag: { frame: location.host + location.pathname, notLoaded: true } }
      });
    } catch (e) {
      return { ok: false, reason: 'inject-failed', error: String(e && e.message || e), diag };
    }
    diag.frameCount = probes.length;
    diag.frames = probes.map(p => Object.assign({ frameId: p.frameId }, p.result ? p.result.diag : { error: 'no result' }));
    const best = probes.filter(p => p.result && p.result.found).sort((a, b) => b.result.score - a.result.score)[0];
    if (!best) return { ok: false, reason: 'input-not-found', diag };
    try {
      const [res] = await chrome.scripting.executeScript({
        target: { tabId, frameIds: [best.frameId] },
        func: t => window.__wuyiQR.insert(t),
        args: [text]
      });
      const r = (res && res.result) || { ok: false, reason: 'error' };
      return Object.assign({}, r, { frameId: best.frameId, diag });
    } catch (e) {
      return { ok: false, reason: 'error', error: String(e && e.message || e), diag };
    }
  }

  async function pasteToLine(text) {
    if (!text) return { ok: false, reason: 'empty' };
    let res = null;
    const info = { version: VERSION, time: new Date().toLocaleString('zh-TW', { hour12: false }) + '（本機時間）' };
    try {
      const tabs = await getCandidateTabs();
      info.tabsChecked = tabs.map(t => ({ urlReadable: !!t.url, url: safeUrl(t.url) }));
      // 網址看得到且是 LINE 的優先；看不到網址的也試試看（注入失敗＝不是 LINE）
      const ordered = tabs.filter(t => t.url && LINE_URL_RE.test(t.url)).concat(tabs.filter(t => !t.url));
      if (!ordered.length) res = { ok: false, reason: 'no-line-tab' };
      for (const t of ordered) {
        info.tab = { url: safeUrl(t.url), urlReadable: !!t.url };
        res = await pasteToTab(t.id, text, t.url ? true : false);
        if (res.ok || res.reason !== 'no-line-tab') break;
      }
    } catch (e) {
      res = { ok: false, reason: 'error', error: String(e && e.message || e) };
    }
    res = res || { ok: false, reason: 'no-line-tab' };
    if (res.ok) {
      hideDiagBar();
      toast(res.appended ? '已接在對話框原有文字後面（換行），請確認後自己按「傳送」' : '已貼進 LINE 對話框，請確認後自己按「傳送」', '📥');
    } else {
      copyText(text);
      lastDiag = buildDiag(info, res);
      toast((MESSAGES[res.reason] || MESSAGES.error) + '（文字已複製，可手動貼上）', '⚠️');
      showDiagBar(res.reason);
    }
    return res;
  }

  // (f) 診斷資訊：不含任何訊息內容
  function buildDiag(info, res) {
    const d = res.diag || {};
    const lines = [
      '梧藝客服小幫手 診斷資訊',
      '版本：' + info.version,
      '時間：' + info.time,
      '結果：' + res.reason + (res.error ? '（' + String(res.error).slice(0, 120) + '）' : ''),
      '分頁：' + (info.tab ? (info.tab.url || '(看不到網址)') : '(沒有作用中分頁)'),
      '網址可讀：' + (info.tab ? (info.tab.urlReadable ? '是' : '否') : '-'),
      '檢查過的分頁：' + (info.tabsChecked || []).map(t => (t.url || '(看不到網址)')).join('、'),
      'frame 數：' + (d.frameCount != null ? d.frameCount : '-')
    ];
    (d.frames || []).forEach((f, i) => {
      lines.push(`— frame ${i + 1}（id ${f.frameId}${f.isTop ? '，最上層' : ''}）：${f.frame || '?'}`);
      if (f.notLoaded) { lines.push('   內容腳本未載入'); return; }
      lines.push(`   textarea ${f.textarea}、contenteditable ${f.contenteditable}、role=textbox ${f.roleTextbox}、shadow root ${f.shadowRoots}、可用候選 ${f.usable}`);
      (f.candidates || []).forEach(c => lines.push('   · ' + c));
      if (f.iframes && f.iframes.length) lines.push('   內嵌 iframe：' + f.iframes.join('、'));
    });
    return lines.join('\n');
  }

  let bar = null;
  function ensureBar() {
    if (bar) return bar;
    bar = document.createElement('div');
    bar.id = 'wuyiDiagBar';
    bar.className = 'wuyi-diag-bar';
    bar.innerHTML = '<span class="wuyi-diag-text" id="wuyiDiagText"></span>' +
      '<button type="button" class="wuyi-diag-copy" id="wuyiDiagCopy">📋 複製診斷資訊</button>' +
      '<button type="button" class="wuyi-diag-close" id="wuyiDiagClose" title="關閉">✕</button>';
    document.body.appendChild(bar);
    bar.querySelector('#wuyiDiagCopy').addEventListener('click', () => {
      if (!lastDiag) return;
      copyText(lastDiag);
      toast('已複製診斷資訊，請貼給系統部', '📋');
    });
    bar.querySelector('#wuyiDiagClose').addEventListener('click', hideDiagBar);
    return bar;
  }
  function showDiagBar(reason) {
    ensureBar();
    bar.querySelector('#wuyiDiagText').textContent = '貼上失敗：' + (MESSAGES[reason] || MESSAGES.error);
    bar.classList.add('show');
  }
  function hideDiagBar() { if (bar) bar.classList.remove('show'); }

  window.WuyiPaste = { pasteToLine, pasteToTab, getActiveLineTab, getCandidateTabs, getLastDiag: () => lastDiag };
})();
