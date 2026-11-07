// 側邊欄 ⇄ 小視窗（popup）切換
(function () {
  'use strict';
  const IS_POPUP = new URLSearchParams(location.search).get('mode') === 'popup';
  const KEY_BOUNDS = 'wuyi_popup_bounds';
  if (IS_POPUP) document.body.classList.add('popup-mode');

  const btn = document.getElementById('btnWindowToggle');
  if (btn && IS_POPUP) {
    btn.title = '切回側邊欄';
    btn.setAttribute('aria-label', '切回側邊欄');
    btn.textContent = '🗂️';
  }

  function loadBounds() {
    try {
      const b = JSON.parse(localStorage.getItem(KEY_BOUNDS) || 'null');
      if (b && b.width >= 200 && b.height >= 200) return b;
    } catch (e) {}
    return null;
  }
  function defaultBounds() {
    const sw = screen.availWidth || 1440, sh = screen.availHeight || 900;
    const sl = (screen.availLeft != null ? screen.availLeft : 0), st = (screen.availTop != null ? screen.availTop : 0);
    const width = 280, height = Math.max(400, sh - 20);
    return { width, height, left: sl + sw - width, top: st };
  }

  // ---- 側邊欄 → 小視窗 ----
  async function openPopup() {
    const b = loadBounds() || defaultBounds();
    try {
      await chrome.windows.create({
        url: chrome.runtime.getURL('sidepanel.html?mode=popup'),
        type: 'popup', focused: true,
        width: Math.round(b.width), height: Math.round(b.height),
        left: Math.round(b.left), top: Math.round(b.top)
      });
      window.close(); // 關掉側邊欄
    } catch (e) {
      if (typeof showToast === 'function') showToast('無法開啟小視窗：' + (e && e.message || e), '⚠️');
    }
  }

  // ---- 小視窗 → 側邊欄 ----
  // sidePanel.open 必須在點擊當下同步呼叫，所以事先記住「最後使用的一般瀏覽器視窗」
  let lastNormalWindowId = null;
  async function refreshLastNormal() {
    try {
      const w = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
      if (w && w.id != null) lastNormalWindowId = w.id;
    } catch (e) {}
  }
  function backToSidePanel() {
    if (lastNormalWindowId == null) {
      if (typeof showToast === 'function') showToast('找不到 Chrome 視窗，請點工具列的「梧」圖示開啟側邊欄', '⚠️');
      refreshLastNormal();
      return;
    }
    saveBounds();
    let p;
    try { p = chrome.sidePanel.open({ windowId: lastNormalWindowId }); }
    catch (e) { p = Promise.reject(e); }
    Promise.resolve(p).then(() => window.close()).catch(e => {
      if (typeof showToast === 'function') showToast('無法切回側邊欄，請點工具列的「梧」圖示（' + (e && e.message || e) + '）', '⚠️');
    });
  }

  // ---- 記住小視窗大小與位置 ----
  let myWindowId = null;
  function saveBounds(b) {
    try {
      const v = b || { left: window.screenX, top: window.screenY, width: window.outerWidth, height: window.outerHeight };
      if (v.width >= 200 && v.height >= 200) localStorage.setItem(KEY_BOUNDS, JSON.stringify(v));
    } catch (e) {}
  }

  if (IS_POPUP) {
    refreshLastNormal();
    chrome.windows.onFocusChanged.addListener(() => refreshLastNormal());
    chrome.windows.getCurrent().then(w => { myWindowId = w && w.id; }).catch(() => {});
    if (chrome.windows.onBoundsChanged) {
      chrome.windows.onBoundsChanged.addListener(w => {
        if (w && w.id === myWindowId) saveBounds({ left: w.left, top: w.top, width: w.width, height: w.height });
      });
    }
    window.addEventListener('resize', () => saveBounds());
    window.addEventListener('pagehide', () => saveBounds());
  }

  if (btn) btn.addEventListener('click', () => { if (IS_POPUP) backToSidePanel(); else openPopup(); });

  window.WuyiWindowMode = { IS_POPUP, openPopup, backToSidePanel, refreshLastNormal, getLastNormal: () => lastNormalWindowId };
})();
