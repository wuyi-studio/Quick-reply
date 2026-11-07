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

  function clonePages(pages) {
    const out = {};
    Object.keys(pages).forEach(key => { out[key] = pages[key].slice(); });
    return out;
  }

  function moveRelative(page, index, direction, visibleSlots) {
    const next = page.slice();
    if (index >= visibleSlots) return { page: next, index, changed: false, disabled: true, toast: '' };
    const target = index + direction;
    if (target < 0) return { page: next, index, changed: false, disabled: false, toast: '已經在最上方了！' };
    if (target >= visibleSlots) return { page: next, index, changed: false, disabled: false, toast: '已經在最下方了！' };
    const tmp = next[target];
    next[target] = next[index];
    next[index] = tmp;
    return { page: next, index: target, changed: true, disabled: false, toast: `已移動至第 ${target + 1} 格！` };
  }

  function moveExtreme(page, index, pos, visibleSlots) {
    if (index >= visibleSlots) return { page: page.slice(), index, changed: false, disabled: true, toast: '' };
    const target = pos === 'top' ? 0 : visibleSlots - 1;
    if (target === index) {
      return { page: page.slice(), index, changed: false, disabled: false, toast: pos === 'top' ? '已經在最前格了！' : '已經在最後格了！' };
    }
    const visible = page.slice(0, visibleSlots);
    const hidden = page.slice(visibleSlots);
    const moved = visible.splice(index, 1)[0];
    if (pos === 'top') visible.unshift(moved);
    else visible.push(moved);
    return { page: visible.concat(hidden), index: target, changed: true, disabled: false, toast: pos === 'top' ? '已移到最前格！' : '已移到最後格！' };
  }

  function hiddenTargetToast(pageNumber, slot) {
    return `已移到第 ${pageNumber} 頁第 ${slot + 1} 格。此格目前未顯示，改選較多的每頁格數即可看到。`;
  }

  function countCrossed(before, after, visibleSlots) {
    const visible = new Set();
    for (let i = 0; i < visibleSlots && i < before.length; i += 1) if (before[i]) visible.add(before[i]);
    let count = 0;
    for (let i = visibleSlots; i < after.length; i += 1) if (after[i] && visible.has(after[i])) count += 1;
    return count;
  }

  function swapSlots(pages, srcPage, srcSlot, dstPage, dstSlot, visibleSlots) {
    const next = clonePages(pages);
    const srcKey = String(srcPage);
    const dstKey = String(dstPage);
    const srcItem = next[srcKey][srcSlot];
    next[dstKey][dstSlot] = srcItem;
    next[srcKey][srcSlot] = pages[dstKey][dstSlot];
    const toast = dstSlot >= visibleSlots
      ? hiddenTargetToast(dstPage, dstSlot)
      : `🎉 成功移動至第 ${dstPage} 頁 - 欄位 #${dstSlot + 1}！`;
    return { ok: true, pages: next, toasts: [toast] };
  }

  const DEFAULT_CATEGORY_ORDER = ['💐', '🌹', '🎂', '🍔', '🔥', '🚗', '⭐️', '‼️', '❓', '😊', '👍', '💙', '❤️'];

  function isCategoryPermutation(order) {
    if (!Array.isArray(order) || order.length !== DEFAULT_CATEGORY_ORDER.length) return false;
    const counts = new Map();
    DEFAULT_CATEGORY_ORDER.forEach(entry => counts.set(entry, (counts.get(entry) || 0) + 1));
    for (const entry of order) {
      if (!counts.get(entry)) return false;
      counts.set(entry, counts.get(entry) - 1);
    }
    return true;
  }

  function cloneItem(entry) {
    return entry && typeof entry === 'object' ? { ...entry } : null;
  }

  function normalizeItemArray(value) {
    const items = [];
    for (const entry of value) {
      if (entry == null) { items.push(null); continue; }
      if (typeof entry !== 'object' || Array.isArray(entry)) return { ok: false };
      if (typeof entry.title !== 'string' || typeof entry.category !== 'string' || typeof entry.text !== 'string') return { ok: false };
      items.push({ ...entry });
    }
    return { ok: true, items };
  }

  function exportBackup(state) {
    const pages = {};
    const rawPages = {};
    for (let p = 1; p <= PAGE_COUNT; p += 1) {
      const key = String(p);
      if (state.rawPages && Object.prototype.hasOwnProperty.call(state.rawPages, key)) rawPages[key] = state.rawPages[key];
      else pages[key] = state.pages[key].slice();
    }
    const out = {
      format: 'wuyi-quick-reply-backup',
      formatVersion: 2,
      slotsPerPage: state.slotsPerPage,
      categoryOrder: state.categoryOrder.slice(),
      pages
    };
    if (Object.keys(rawPages).length) out.rawPages = rawPages;
    return out;
  }

  function rejectImport(current) {
    return {
      ok: false,
      error: '檔案無法匯入，目前資料沒有變更。',
      pages: current.pages,
      rawPages: current.rawPages,
      slotsPerPage: current.slotsPerPage,
      categoryOrder: current.categoryOrder.slice()
    };
  }

  function importBackup(data, current) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return rejectImport(current);
    if (!Object.prototype.hasOwnProperty.call(data, 'formatVersion')) {
      const pages = {};
      for (let p = 1; p <= PAGE_COUNT; p += 1) {
        const value = data[String(p)];
        if (!Array.isArray(value)) return rejectImport(current);
        const norm = normalizeItemArray(value);
        if (!norm.ok) return rejectImport(current);
        pages[String(p)] = padPage(norm.items);
      }
      return { ok: true, error: '', pages, rawPages: {}, slotsPerPage: current.slotsPerPage, categoryOrder: current.categoryOrder.slice() };
    }
    if (data.format !== 'wuyi-quick-reply-backup' || data.formatVersion !== 2) return rejectImport(current);
    if (![10, 15, 20].includes(data.slotsPerPage) || !isCategoryPermutation(data.categoryOrder)) return rejectImport(current);
    const pagesIn = data.pages && typeof data.pages === 'object' && !Array.isArray(data.pages) ? data.pages : null;
    const rawIn = data.rawPages && typeof data.rawPages === 'object' && !Array.isArray(data.rawPages) ? data.rawPages : {};
    if (!pagesIn) return rejectImport(current);
    for (const key of Object.keys(rawIn)) if (!/^(10|[1-9])$/.test(key)) return rejectImport(current);
    const pages = {};
    const rawPages = {};
    for (let p = 1; p <= PAGE_COUNT; p += 1) {
      const key = String(p);
      const inPages = Object.prototype.hasOwnProperty.call(pagesIn, key);
      const inRaw = Object.prototype.hasOwnProperty.call(rawIn, key);
      if (inPages === inRaw) return rejectImport(current);
      if (inRaw) {
        if (Array.isArray(rawIn[key])) return rejectImport(current);
        rawPages[key] = rawIn[key];
        pages[key] = Array(MAX_STORED_SLOTS).fill(null);
      } else {
        if (!Array.isArray(pagesIn[key])) return rejectImport(current);
        const norm = normalizeItemArray(pagesIn[key]);
        if (!norm.ok) return rejectImport(current);
        pages[key] = padPage(norm.items);
      }
    }
    return { ok: true, error: '', pages, rawPages, slotsPerPage: data.slotsPerPage, categoryOrder: data.categoryOrder.slice() };
  }

  function applyBatchSlot(previous, form) {
    const title = String(form.title || '').trim();
    const text = String(form.text || '').trim();
    if (!title && !text) return null;
    const base = cloneItem(previous) || {};
    base.category = form.category || '⭐️';
    base.title = title;
    base.text = text;
    if (!base.id) base.id = `slot_${form.page}_${form.index}`;
    return base;
  }

  function applyBatchPage(page, forms) {
    const next = page.slice();
    for (let i = 0; i < MAX_STORED_SLOTS; i += 1) next[i] = applyBatchSlot(page[i], { ...forms[i], index: i });
    return next;
  }

  function commitBatchPage(pages, rawPages, pageNumber, forms) {
    const key = String(pageNumber);
    const nextRaw = { ...rawPages };
    delete nextRaw[key];
    const base = Array.isArray(pages[key]) ? pages[key] : Array(MAX_STORED_SLOTS).fill(null);
    const formsWithPage = forms.map(form => ({ ...form, page: pageNumber }));
    return { pages: { ...pages, [key]: applyBatchPage(base, formsWithPage) }, rawPages: nextRaw };
  }

  function findEmptySlot(pages, visibleSlots, rawPages) {
    const blocked = rawPages || {};
    function scan(hidden) {
      for (let p = 1; p <= PAGE_COUNT; p += 1) {
        const key = String(p);
        if (Object.prototype.hasOwnProperty.call(blocked, key)) continue;
        const page = pages[key];
        if (!Array.isArray(page)) continue;
        const start = hidden ? visibleSlots : 0;
        const end = hidden ? page.length : Math.min(visibleSlots, page.length);
        for (let s = start; s < end; s += 1) if (!page[s]) return { page: p, slot: s, hidden };
      }
      return null;
    }
    return scan(false) || scan(true);
  }

  const INSERT_REJECT = '目標頁放不下這次插入，資料沒有變更。可以改用互換。';

  function insertSlot(pages, srcPage, srcSlot, dstPage, dstSlot, visibleSlots) {
    const before = clonePages(pages);
    const srcKey = String(srcPage);
    const dstKey = String(dstPage);
    if (srcPage === dstPage) {
      const page = before[srcKey].slice();
      const moved = page.splice(srcSlot, 1)[0];
      page.splice(dstSlot, 0, moved);
      const toasts = [];
      if (dstSlot >= visibleSlots) toasts.push(hiddenTargetToast(dstPage, dstSlot));
      else toasts.push(`🎉 成功移動至第 ${dstPage} 頁 - 欄位 #${dstSlot + 1}！`);
      const crossed = countCrossed(before[srcKey], page, visibleSlots);
      if (crossed > 0) toasts.push(`有 ${crossed} 則被移到目前未顯示的格子，改選較多格即可看到，內容沒有刪除。`);
      return { ok: true, pages: { ...before, [srcKey]: page }, toasts };
    }
    const dst = before[dstKey].slice();
    if (dst.length > MAX_STORED_SLOTS) return { ok: false, pages: before, toasts: [INSERT_REJECT] };
    const trial = dst.slice();
    trial.splice(dstSlot, 0, before[srcKey][srcSlot]);
    let finalDst = trial;
    if (dst.length < MAX_STORED_SLOTS) {
      while (finalDst.length < MAX_STORED_SLOTS) finalDst.push(null);
    } else if (trial[MAX_STORED_SLOTS] != null) {
      return { ok: false, pages: before, toasts: [INSERT_REJECT] };
    } else {
      finalDst = trial.slice(0, MAX_STORED_SLOTS);
    }
    const src = before[srcKey].slice();
    src[srcSlot] = null;
    const toasts = [];
    if (dstSlot >= visibleSlots) toasts.push(hiddenTargetToast(dstPage, dstSlot));
    else toasts.push(`🎉 成功移動至第 ${dstPage} 頁 - 欄位 #${dstSlot + 1}！`);
    const crossed = countCrossed(dst, finalDst, visibleSlots);
    if (crossed > 0) toasts.push(`有 ${crossed} 則被移到目前未顯示的格子，改選較多格即可看到，內容沒有刪除。`);
    return { ok: true, pages: { ...before, [srcKey]: src, [dstKey]: finalDst }, toasts };
  }

  function moveCategory(order, from, to) {
    const next = order.slice();
    const moved = next.splice(from, 1)[0];
    next.splice(to, 0, moved);
    return next;
  }

  function swapCategoryNeighbor(order, index, direction) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return order.slice();
    const next = order.slice();
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    return next;
  }

  function parseCategoryOrder(stored) {
    try {
      const parsed = JSON.parse(stored || 'null');
      if (isCategoryPermutation(parsed)) return parsed.slice();
    } catch (e) {}
    return DEFAULT_CATEGORY_ORDER.slice();
  }

  function categoryOptions(order, current) {
    const options = order.slice();
    if (current && !options.includes(current)) options.push(current);
    return options;
  }

  const ADDON_CATALOG = {
    u2: { name: '2人餐具', price: 15 },
    u5: { name: '5人餐具', price: 30 },
    u10: { name: '10人餐具', price: 50 },
    c45: { name: '蠟燭', price: 45 },
    c55: { name: '蠟燭', price: 55 },
    c30: { name: '數字蠟燭', price: 30 }
  };
  const ADDON_KEY_ORDER = ['u2', 'u5', 'u10', 'c45', 'c55', 'c30'];
  const ADDON_BUTTON_IDS = { u2: 'btnU2', u5: 'btnU5', u10: 'btnU10', c45: 'btnC45', c55: 'btnC55', c30: 'btnC30' };
  const PASTE_BLOCK = new Set(['button', 'a', 'input', 'textarea', 'select', 'label']);

  function cycleCount(count) { return (Number(count) + 1) % 6; }
  function emptyQuoteAddons() { return { u2: 0, u5: 0, u10: 0, c45: 0, c55: 0, c30: 0 }; }
  function candleButtonText(count) {
    if (!count) return '數字蠟燭 $30';
    return `數字蠟燭 x${count} +$${count * 30}`;
  }
  function normalizeCustomName(raw) {
    return String(raw ?? '').replace(/[\r\n\t]/g, ' ').trim().replace(/ +/g, ' ');
  }
  function validateCustomAddon(nameRaw, amountRaw) {
    const name = normalizeCustomName(nameRaw);
    const amountText = String(amountRaw ?? '').trim();
    const fail = (error) => ({ ok: false, include: false, name, amount: 0, error, banner: '自訂加購尚未計入總價' });
    if (!name && !amountText) return { ok: true, include: false, name: '', amount: 0, error: '', banner: '' };
    if (Array.from(name).length > 30) return fail('品項名稱最多 30 個字');
    if (!name) return fail('請輸入品項名稱');
    if (!/^[0-9]+$/.test(amountText)) return fail('金額請輸入 1 到 999999 的整數');
    const amount = Number(amountText);
    if (amount < 1 || amount > 999999) return fail('金額請輸入 1 到 999999 的整數');
    return { ok: true, include: true, name, amount, error: '', banner: '' };
  }
  function quoteSummary(state) {
    const items = [];
    let total = 0;
    const flower = state.hasFlower390 ? 390 : (state.customFlowerPrice || 0);
    if (flower > 0) { items.push(`花束$${flower}`); total += flower; }
    if (state.hasBag) { items.push('提袋$40'); total += 40; }
    if (state.cakePrice > 0) { items.push(`蛋糕$${state.cakePrice}`); total += state.cakePrice; }
    ADDON_KEY_ORDER.forEach(key => {
      const count = state.addons[key] || 0;
      if (!count) return;
      const price = count * ADDON_CATALOG[key].price;
      items.push(count === 1 ? `${ADDON_CATALOG[key].name}$${price}` : `${ADDON_CATALOG[key].name}x${count}$${price}`);
      total += price;
    });
    if (state.hasIceBag) { items.push('保冰袋$100'); total += 100; }
    const custom = validateCustomAddon(state.customName, state.customAmount);
    if (custom.include) { items.push(`${custom.name}$${custom.amount}`); total += custom.amount; }
    return { items, total, custom, blocked: !custom.ok };
  }
  function shouldPaste(ancestorTags) {
    return !ancestorTags.some(tag => PASTE_BLOCK.has(String(tag).toLowerCase()));
  }
  function shouldStartCardDrag(ancestorTags) {
    return !ancestorTags.some(tag => String(tag).toLowerCase() === 'button');
  }

  return {
    PAGE_COUNT, MAX_STORED_SLOTS, DEFAULT_VISIBLE,
    padPage, normalizePages, serializePagesForStorage, pagesFromFlatList,
    parseVisibleSlots, hiddenNotice, pageAriaLabel, pageHasHidden, rawPageNotice,
    moveRelative, moveExtreme, swapSlots, insertSlot,
    DEFAULT_CATEGORY_ORDER, isCategoryPermutation, exportBackup, importBackup,
    applyBatchSlot, applyBatchPage, commitBatchPage, findEmptySlot,
    moveCategory, swapCategoryNeighbor, parseCategoryOrder, categoryOptions,
    ADDON_CATALOG, ADDON_KEY_ORDER, ADDON_BUTTON_IDS, cycleCount, emptyQuoteAddons,
    candleButtonText, validateCustomAddon, quoteSummary, shouldPaste, shouldStartCardDrag
  };
});
