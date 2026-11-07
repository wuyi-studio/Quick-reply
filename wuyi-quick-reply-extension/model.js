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

  return {
    PAGE_COUNT, MAX_STORED_SLOTS, DEFAULT_VISIBLE,
    padPage, normalizePages, serializePagesForStorage, pagesFromFlatList,
    parseVisibleSlots, hiddenNotice, pageAriaLabel, pageHasHidden, rawPageNotice,
    moveRelative, moveExtreme, swapSlots, insertSlot
  };
});
