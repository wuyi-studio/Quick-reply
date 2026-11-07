(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.WuyiModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const PAGE_COUNT = 10;
  const MAX_STORED_SLOTS = 20;
  const DEFAULT_VISIBLE = 10;

  function padPage(slots) {
    const copy = slots.slice();
    while (copy.length < MAX_STORED_SLOTS) copy.push(null);
    return copy;
  }

  function hiddenNumbers(page, visibleSlots) {
    const nums = [];
    for (let i = visibleSlots; i < page.length; i += 1) if (page[i]) nums.push(i + 1);
    return nums;
  }

  function hiddenNotice(page, visibleSlots) {
    const nums = hiddenNumbers(page, visibleSlots);
    if (!nums.length) return '';
    const shown = nums.slice(0, 10).join('、');
    const extra = nums.length > 10 ? `等共 ${nums.length} 則` : '';
    return `此頁有 ${nums.length} 則在目前未顯示的格子（${shown}${extra}）。改選較多格即可看到，這些內容沒有被刪除。`;
  }

  function pageHasHidden(page, visibleSlots) {
    return hiddenNumbers(page, visibleSlots).length > 0;
  }

  function pageAriaLabel(pageNumber, page, visibleSlots) {
    return pageHasHidden(page, visibleSlots) ? `第 ${pageNumber} 頁，有未顯示內容` : `第 ${pageNumber} 頁`;
  }

  function rawPageNotice(pageNumber) {
    return `第 ${pageNumber} 頁的儲存格式無法顯示，尚未寫回，原資料仍在瀏覽器儲存裡。`;
  }

  function normalizePages(raw) {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const pages = {};
    const rawPages = {};
    let blocked = false;
    let padded = false;
    for (let p = 1; p <= PAGE_COUNT; p += 1) {
      const key = String(p);
      const value = source[key];
      if (Array.isArray(value)) {
        if (value.length < MAX_STORED_SLOTS) padded = true;
        pages[key] = padPage(value);
      } else if (value === undefined) {
        padded = true;
        pages[key] = Array(MAX_STORED_SLOTS).fill(null);
      } else {
        blocked = true;
        rawPages[key] = value;
        pages[key] = Array(MAX_STORED_SLOTS).fill(null);
      }
    }
    return { pages, rawPages, writeBack: padded && !blocked };
  }

  function serializePagesForStorage(pages, rawPages) {
    const out = {};
    for (let p = 1; p <= PAGE_COUNT; p += 1) {
      const key = String(p);
      out[key] = rawPages && Object.prototype.hasOwnProperty.call(rawPages, key) ? rawPages[key] : pages[key];
    }
    return out;
  }

  function pagesFromFlatList(list) {
    const pages = {};
    for (let p = 1; p <= PAGE_COUNT; p += 1) pages[String(p)] = Array(MAX_STORED_SLOTS).fill(null);
    list.forEach((entry, idx) => {
      const p = Math.floor(idx / 10) + 1;
      const s = idx % 10;
      if (p <= PAGE_COUNT) pages[String(p)][s] = entry;
    });
    return pages;
  }

  function parseVisibleSlots(stored) {
    if (stored === '10' || stored === '15' || stored === '20') return Number(stored);
    return DEFAULT_VISIBLE;
  }

  return {
    PAGE_COUNT, MAX_STORED_SLOTS, DEFAULT_VISIBLE,
    padPage, normalizePages, serializePagesForStorage, pagesFromFlatList,
    parseVisibleSlots, hiddenNotice, pageAriaLabel, pageHasHidden, rawPageNotice
  };
});
