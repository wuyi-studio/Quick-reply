# 梧藝客服小幫手 1.0.7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在可審閱的擴充目錄裡，讓側邊欄保留既有回覆與隱藏格，用「移動」按鈕取代長按三秒，並加上類別排序、每頁 10／15／20 格，以及數字蠟燭 $30 與一組自訂加購。

**Architecture:** 純規則放在經典腳本 `model.js`，同時可被 Node `require`。`app.js` 只負責既有 DOM 與儲存鍵，移動、備份、報價與類別順序都呼叫 `WuyiModel`。接線測試用記憶體 DOM 載入真正的 `events.js` 與 `app.js`，不以純函式結果代替按鈕行為。

**Tech Stack:** Chrome MV3 既有經典腳本、Node 22 內建 `node:test` 與 `node:vm`。不新增 npm 依賴，不新增擴充權限。

## Global Constraints

- 只改 Chrome 擴充，不改網頁版 `index.html`。
- manifest 名稱維持「梧藝客服小幫手」；`version` 從 `1.0.6` 改為 `1.0.7`。
- `permissions` 維持 `sidePanel`、`scripting`；`host_permissions` 維持 `https://chat.line.biz/*`。不新增權限。
- 不修改 `content.js`、`paste.js`、`background.js`、`window-mode.js`、圖示。
- 不重排使用者已存的頁碼與格號。不讀取真實 localStorage。測試只用合成資料。
- 不連線 LINE，不使用 `@230fpemy` 或 `@202` 當測試目標，不碰原始顧店 App。
- 貼上仍只寫進對話框，不自動傳送，不派送 Enter 或 Command+Enter。
- 數字蠟燭單價 30，是 Leon 的需求值；實作不得改成其他數字，也不得在報價句加上「未核價」。
- 既有價格維持：花束 390、提袋 40、蛋糕 760／1030／1060、2 人餐具 15、5 人餐具 30、10 人餐具 50、蠟燭 45、蠟燭 55、保冰袋 100。
- `DEFAULTS_VERSION` 維持 `1.0.2-003851d4`。
- 不重建、不取代根目錄的 `wuyi-quick-reply-extension.zip`。不合併 `main`。不發布、不上線。
- 類別字串必須與規格第 3 節的碼點完全相同。🌟 固定在最前，不進入可排序清單。
- 測試不得印出 `defaultPage1Replies`、`pagesData` 全檔或任何回覆內文。

**核准來源：** 規格 [docs/superpowers/specs/2026-11-07-quick-reply-extension-design.md](https://github.com/wuyi-studio/Quick-reply/blob/bcfa736741bbe075b6da2c929f15e77467c29efa/docs/superpowers/specs/2026-11-07-quick-reply-extension-design.md)。Leon 於 2026-11-07 17:34（Asia/Taipei）核准含第 14 節。1.0.6 ZIP blob 為 `0eda75cdfbb8bd19f219ebe896d82cb3a1763bc5`，`index.html` blob 為 `49b2a60a586d95c4604c808f00bbf1cb00f0f0dc`。

**範圍決定：** 這是一份計畫。頁面、移動、類別、報價共用同一個側邊欄，分開交付不能各自成為可審閱的 1.0.7。任務仍各自有測試與提交。

---

## 檔案責任

| 路徑 | 責任 |
|---|---|
| `wuyi-quick-reply-extension/model.js` | 頁面補位、隱藏格、移動與插入、備份、類別順序、報價、貼上判斷。無 DOM。 |
| `wuyi-quick-reply-extension/app.js` | 既有畫面、`localStorage` 鍵、呼叫 `WuyiModel`。不再內含格數與插入規則。 |
| `wuyi-quick-reply-extension/sidepanel.html` | 每頁格數按鈕、數字蠟燭、自訂加購欄位、類別順序區塊、先載入 `model.js`。 |
| `wuyi-quick-reply-extension/sidepanel.css` | 未顯示徽章、頁碼圓點、格數按鈕。刪除 `longPressBar`。 |
| `wuyi-quick-reply-extension/events.js` | 只在「移動」需要 `cancelBubble` 仍不夠時才改。預設不改，由 `openMoveFromCard` 設定 `event.cancelBubble`。 |
| `wuyi-quick-reply-extension/manifest.json` | 只改 `version` 為 `1.0.7`。 |
| `wuyi-quick-reply-extension/安裝說明.md` | 改掉長按三秒那一句，補上每頁格數。 |
| `wuyi-quick-reply-extension/test/harness.mjs` | 記憶體 DOM，載入真正的 `events.js` 與 `app.js`。 |
| `wuyi-quick-reply-extension/test/*.test.mjs` | Node 測試。 |
| 根目錄 `index.html`、`wuyi-quick-reply-extension.zip` | 不修改。 |

工作分支維持 `cursor/quick-reply-extension-design-57c8`。每個任務提交前執行 `git branch --show-current`，結果必須是這個分支。

## 介面

`model.js` 以 `module.exports` 匯出，並在瀏覽器把同一個物件設為 `globalThis.WuyiModel`。`app.js` 只使用下列名稱。

```javascript
WuyiModel.PAGE_COUNT === 10
WuyiModel.MAX_STORED_SLOTS === 20
WuyiModel.DEFAULT_VISIBLE === 10
WuyiModel.DEFAULTS_VERSION === '1.0.2-003851d4'
WuyiModel.DEFAULT_CATEGORY_ORDER // 長度 13 的陣列
WuyiModel.ADDON_KEY_ORDER // ['u2','u5','u10','c45','c55','c30']
WuyiModel.ADDON_CATALOG.c30 // { name: '數字蠟燭', price: 30 }
WuyiModel.ADDON_BUTTON_IDS.c30 === 'btnC30'
WuyiModel.padPage(slots) // 陣列；短於 20 則尾端補 null
WuyiModel.normalizePages(raw) // { pages, rawPages, writeBack }
WuyiModel.serializePagesForStorage(pages, rawPages) // 儲存用物件
WuyiModel.pagesFromFlatList(list) // 舊的每 10 則一頁，不改相對順序
WuyiModel.parseVisibleSlots(stored) // 10 | 15 | 20
WuyiModel.parseCategoryOrder(stored) // 13 個字串
WuyiModel.hiddenNotice(page, visibleSlots) // 字串，沒有隱藏內容時是 ''
WuyiModel.pageAriaLabel(pageNumber, page, visibleSlots)
WuyiModel.pageHasHidden(page, visibleSlots) // boolean
WuyiModel.rawPageNotice(pageNumber)
WuyiModel.moveRelative(page, index, direction, visibleSlots)
WuyiModel.moveExtreme(page, index, pos, visibleSlots) // pos: 'top' | 'bottom'
WuyiModel.swapSlots(pages, srcPage, srcSlot, dstPage, dstSlot, visibleSlots)
WuyiModel.insertSlot(pages, srcPage, srcSlot, dstPage, dstSlot, visibleSlots)
WuyiModel.findEmptySlot(pages, visibleSlots, rawPages) // { page, slot, hidden } | null；略過 rawPages 裡的頁
WuyiModel.applyBatchSlot(previous, form) // 回覆物件或 null
WuyiModel.applyBatchPage(page, forms)
WuyiModel.commitBatchPage(pages, rawPages, pageNumber, forms)
WuyiModel.moveCategory(order, from, to)
WuyiModel.swapCategoryNeighbor(order, index, direction) // direction: -1 | 1
WuyiModel.isCategoryPermutation(order)
WuyiModel.categoryOptions(order, current)
WuyiModel.shouldPaste(ancestorTags)
WuyiModel.shouldStartCardDrag(ancestorTags)
WuyiModel.cycleCount(count)
WuyiModel.candleButtonText(count)
WuyiModel.validateCustomAddon(nameRaw, amountRaw)
WuyiModel.emptyQuoteAddons()
WuyiModel.quoteSummary(state)
WuyiModel.exportBackup(state)
WuyiModel.importBackup(data, current)
```

`moveRelative` 與 `moveExtreme` 回傳 `{ page, index, changed, disabled, toast }`。`swapSlots` 與 `insertSlot` 回傳 `{ ok, pages, toasts }`。`insertSlot` 失敗時 `ok` 為 false，且 `pages` 與傳入值深度相等。`validateCustomAddon` 回傳 `{ ok, include, name, amount, error, banner }`。`quoteSummary` 回傳 `{ items, total, custom, blocked }`。

`app.js` 新增的畫面函式名稱固定為：

```javascript
function openMoveFromCard(event, page, slot)
function setVisibleSlotsFromUi(n)
function renderSlotsPerPageControl()
function renderCategoryPills()
function onCategoryPillClick(cat, el)
function onCategoryKeyDown(event)
function moveCategoryFromUi(index, direction)
function onCustomAddonInput()
function ancestorTagsFromEvent(event)
```

卡片 HTML 的移動按鈕必須是：

```html
data-on-click="openMoveFromCard(event, 1, 0)"
```

`openMoveFromCard` 設定 `event.cancelBubble = true` 後呼叫既有的 `openMoveModal(page, slot)`。

---

### Task 1: 校驗並展開 1.0.6 來源

**Files:**
- Create: `wuyi-quick-reply-extension/**`（由 ZIP 展開，本任務不改行為）
- Test: `wuyi-quick-reply-extension/test/source-guard.test.mjs`
- 不修改：`index.html`、`wuyi-quick-reply-extension.zip`

**Interfaces:**
- Consumes: 根目錄 ZIP blob `0eda75cdfbb8bd19f219ebe896d82cb3a1763bc5`
- Produces: 目錄 `wuyi-quick-reply-extension/`，內有 `manifest.json`、`app.js`、`sidepanel.html`、`events.js`、`content.js`

- [ ] **Step 1: Write the failing test**

建立 `wuyi-quick-reply-extension/test/source-guard.test.mjs`：

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const ext = path.join(repo, 'wuyi-quick-reply-extension');

test('1.0.6 zip and index.html blobs stay unchanged', () => {
  const zip = execFileSync('git', ['rev-parse', 'HEAD:wuyi-quick-reply-extension.zip'], { cwd: repo }).toString().trim();
  const html = execFileSync('git', ['rev-parse', 'HEAD:index.html'], { cwd: repo }).toString().trim();
  assert.equal(zip, '0eda75cdfbb8bd19f219ebe896d82cb3a1763bc5');
  assert.equal(html, '49b2a60a586d95c4604c808f00bbf1cb00f0f0dc');
});

test('unpacked manifest keeps the 1.0.6 permissions', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.name, '梧藝客服小幫手');
  assert.deepEqual(manifest.permissions, ['sidePanel', 'scripting']);
  assert.deepEqual(manifest.host_permissions, ['https://chat.line.biz/*']);
  assert.equal(fs.existsSync(path.join(ext, 'app.js')), true);
  assert.equal(fs.existsSync(path.join(ext, 'content.js')), true);
  assert.equal(fs.readFileSync(path.join(ext, 'content.js'), 'utf8').includes('KeyboardEvent'), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test wuyi-quick-reply-extension/test/source-guard.test.mjs`

Expected: FAIL，`manifest.json` 的 `ENOENT`。第一個 blob 測試此時應為 PASS。

- [ ] **Step 3: Write minimal implementation**

在倉庫根目錄執行：

```bash
git branch --show-current
unzip -q -o wuyi-quick-reply-extension.zip -d .
```

`git branch --show-current` 必須印出 `cursor/quick-reply-extension-design-57c8`。ZIP 內已含 `wuyi-quick-reply-extension/` 前綴，展開後得到該目錄。不要編輯展開出的檔案，不要覆蓋 ZIP。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test wuyi-quick-reply-extension/test/source-guard.test.mjs`

Expected: PASS，2 tests。

- [ ] **Step 5: Commit**

```bash
git add wuyi-quick-reply-extension/test/source-guard.test.mjs wuyi-quick-reply-extension/manifest.json wuyi-quick-reply-extension/app.js wuyi-quick-reply-extension/sidepanel.html wuyi-quick-reply-extension/sidepanel.css wuyi-quick-reply-extension/extension.css wuyi-quick-reply-extension/events.js wuyi-quick-reply-extension/content.js wuyi-quick-reply-extension/paste.js wuyi-quick-reply-extension/background.js wuyi-quick-reply-extension/window-mode.js wuyi-quick-reply-extension/安裝說明.md wuyi-quick-reply-extension/icons
git commit -m "整理 1.0.6 擴充來源為可審閱目錄"
```

---

### Task 2: 頁面補位、可見格數與未顯示提示

**Files:**
- Create: `wuyi-quick-reply-extension/model.js`
- Test: `wuyi-quick-reply-extension/test/model.test.mjs`

**Interfaces:**
- Consumes: 無
- Produces: `padPage`、`normalizePages`、`serializePagesForStorage`、`pagesFromFlatList`、`parseVisibleSlots`、`hiddenNotice`、`pageAriaLabel`、`pageHasHidden`、`rawPageNotice`

- [ ] **Step 1: Write the failing test**

建立 `wuyi-quick-reply-extension/test/model.test.mjs`：

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const M = require('../model.js');

const item = { id: 't1', category: '💐', title: '合成甲', text: '合成內文甲', catName: '保留' };

test('padPage keeps indexes 0-9 and fills 10-19 with null', () => {
  const page = M.padPage([item, null, null, null, null, null, null, null, null, null]);
  assert.equal(page.length, 20);
  assert.deepEqual(page[0], item);
  assert.deepEqual(page.slice(1), Array(19).fill(null));
});

test('visible slot changes do not move or delete items', () => {
  const original = M.padPage([item]).concat([{ id: 'tail', category: '🎂', title: '合成乙', text: '合成內文乙' }]);
  assert.equal(original.length, 21);
  const notice10 = M.hiddenNotice(original, 10);
  const notice20 = M.hiddenNotice(original, 20);
  assert.equal(notice10, '此頁有 1 則在目前未顯示的格子（21）。改選較多格即可看到，這些內容沒有被刪除。');
  assert.equal(notice20, '此頁有 1 則在目前未顯示的格子（21）。改選較多格即可看到，這些內容沒有被刪除。');
  assert.deepEqual(original[0], item);
  assert.equal(original[20].id, 'tail');
});

test('more than ten hidden numbers are truncated in the notice', () => {
  const page = Array(32).fill(null).map((_, i) => (i >= 10 ? { id: 'h' + i, category: '💐', title: '合成', text: 'x' } : null));
  const notice = M.hiddenNotice(page, 10);
  assert.match(notice, /^此頁有 22 則在目前未顯示的格子（11、12、13、14、15、16、17、18、19、20等共 22 則）/);
});

test('normalizePages pads without reordering and blocks write-back for raw pages', () => {
  const normalized = M.normalizePages({ '1': [item], '2': { kept: true } });
  assert.equal(normalized.pages['1'].length, 20);
  assert.deepEqual(normalized.pages['1'][0], item);
  assert.deepEqual(normalized.pages['2'], Array(20).fill(null));
  assert.deepEqual(normalized.rawPages['2'], { kept: true });
  assert.equal(normalized.writeBack, false);
  assert.equal(M.rawPageNotice(2), '第 2 頁的儲存格式無法顯示，尚未寫回，原資料仍在瀏覽器儲存裡。');
});

test('serializePagesForStorage writes the raw page back unchanged', () => {
  const normalized = M.normalizePages({ '2': { kept: true }, '3': [item] });
  const stored = M.serializePagesForStorage(normalized.pages, normalized.rawPages);
  assert.deepEqual(stored['2'], { kept: true });
  assert.equal(stored['3'][0].id, 't1');
  assert.equal(stored['3'].length, 20);
});

test('invalid visible slot text falls back to 10', () => {
  assert.equal(M.parseVisibleSlots(null), 10);
  assert.equal(M.parseVisibleSlots('15'), 15);
  assert.equal(M.parseVisibleSlots('12'), 10);
});

test('flat list keeps the old ten-per-page indexes', () => {
  const pages = M.pagesFromFlatList([item]);
  assert.deepEqual(pages['1'][0], item);
  assert.equal(pages['1'].length, 20);
  assert.equal(pages['2'][0], null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test wuyi-quick-reply-extension/test/model.test.mjs`

Expected: FAIL，`Cannot find module '../model.js'`。

- [ ] **Step 3: Write minimal implementation**

建立 `wuyi-quick-reply-extension/model.js`：

```javascript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test wuyi-quick-reply-extension/test/model.test.mjs`

Expected: PASS，7 tests。

- [ ] **Step 5: Commit**

```bash
git add wuyi-quick-reply-extension/model.js wuyi-quick-reply-extension/test/model.test.mjs
git commit -m "加入頁面補位與未顯示提示的純規則"
```

---

### Task 3: 移動、互換與插入不丟資料

**Files:**
- Modify: `wuyi-quick-reply-extension/model.js`
- Test: `wuyi-quick-reply-extension/test/model.test.mjs`

**Interfaces:**
- Consumes: `padPage`
- Produces: `moveRelative`、`moveExtreme`、`swapSlots`、`insertSlot`

- [ ] **Step 1: Write the failing test**

把下列測試加到 `model.test.mjs` 末尾：

```javascript
function filled(prefix, count) {
  return Array.from({ length: count }, (_, i) => ({ id: prefix + i, category: '💐', title: '合成' + i, text: '內文' + i }));
}

test('relative moves stay inside the visible window', () => {
  const page = M.padPage(filled('v', 10));
  page[12] = { id: 'hidden', category: '🎂', title: '合成藏', text: '內文藏' };
  const down = M.moveRelative(page, 9, 1, 10);
  assert.equal(down.changed, false);
  assert.equal(down.toast, '已經在最下方了！');
  assert.deepEqual(down.page, page);
  const hiddenMove = M.moveRelative(page, 12, -1, 10);
  assert.equal(hiddenMove.disabled, true);
  assert.deepEqual(hiddenMove.page, page);
  const extreme = M.moveExtreme(page, 3, 'bottom', 10);
  assert.equal(extreme.page[9].id, 'v3');
  assert.equal(extreme.page[12].id, 'hidden');
  assert.equal(extreme.index, 9);
});

test('swap with a hidden slot keeps both items', () => {
  const pages = M.pagesFromFlatList([]);
  pages['1'][0] = { id: 'a', category: '💐', title: '合成甲', text: '甲' };
  pages['1'][12] = { id: 'b', category: '🎂', title: '合成乙', text: '乙' };
  const swapped = M.swapSlots(pages, 1, 0, 1, 12, 10);
  assert.equal(swapped.ok, true);
  assert.equal(swapped.pages['1'][12].id, 'a');
  assert.equal(swapped.pages['1'][0].id, 'b');
  assert.equal(swapped.toasts[0], '已移到第 1 頁第 13 格。此格目前未顯示，改選較多的每頁格數即可看到。');
});

test('cross-page insert into a full page changes nothing', () => {
  const pages = M.pagesFromFlatList([]);
  pages['1'][0] = { id: 'src', category: '💐', title: '合成源', text: '源' };
  pages['2'] = filled('d', 20);
  const before = structuredClone(pages);
  const result = M.insertSlot(pages, 1, 0, 2, 0, 10);
  assert.equal(result.ok, false);
  assert.deepEqual(result.pages, before);
  assert.equal(result.toasts[0], '目標頁放不下這次插入，資料沒有變更。可以改用互換。');
});

test('cross-page insert keeps every non-null item when the tail is null', () => {
  const pages = M.pagesFromFlatList([]);
  pages['1'][0] = { id: 'src', category: '💐', title: '合成源', text: '源' };
  pages['2'][0] = { id: 'dst', category: '🎂', title: '合成的', text: '的' };
  const result = M.insertSlot(pages, 1, 0, 2, 0, 10);
  assert.equal(result.ok, true);
  const ids = result.pages['1'].concat(result.pages['2']).filter(Boolean).map(entry => entry.id).sort();
  assert.deepEqual(ids, ['dst', 'src']);
  assert.equal(result.pages['2'].length, 20);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern "relative moves|swap with a hidden|cross-page insert" wuyi-quick-reply-extension/test/model.test.mjs`

Expected: FAIL，`M.moveRelative is not a function`。

- [ ] **Step 3: Write minimal implementation**

在 `model.js` 的 `return {` 之前加入：

```javascript
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
    const item = visible.splice(index, 1)[0];
    if (pos === 'top') visible.unshift(item);
    else visible.push(item);
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
      const item = page.splice(srcSlot, 1)[0];
      page.splice(dstSlot, 0, item);
      const toasts = [];
      if (dstSlot >= visibleSlots) toasts.push(hiddenTargetToast(dstPage, dstSlot));
      else toasts.push(`🎉 成功移動至第 ${dstPage} 頁 - 欄位 #${dstSlot + 1}！`);
      const moved = countCrossed(before[srcKey], page, visibleSlots);
      if (moved > 0) toasts.push(`有 ${moved} 則被移到目前未顯示的格子，改選較多格即可看到，內容沒有刪除。`);
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
    const moved = countCrossed(dst, finalDst, visibleSlots);
    if (moved > 0) toasts.push(`有 ${moved} 則被移到目前未顯示的格子，改選較多格即可看到，內容沒有刪除。`);
    return { ok: true, pages: { ...before, [srcKey]: src, [dstKey]: finalDst }, toasts };
  }
```

把 `moveRelative, moveExtreme, swapSlots, insertSlot` 加進 `return` 物件。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test wuyi-quick-reply-extension/test/model.test.mjs`

Expected: PASS，11 tests。

- [ ] **Step 5: Commit**

```bash
git add wuyi-quick-reply-extension/model.js wuyi-quick-reply-extension/test/model.test.mjs
git commit -m "加入不丟資料的移動與插入規則"
```

---

### Task 4: 備份匯入匯出與批次儲存

**Files:**
- Modify: `wuyi-quick-reply-extension/model.js`
- Test: `wuyi-quick-reply-extension/test/model.test.mjs`

**Interfaces:**
- Consumes: `normalizePages`、`padPage`、`isCategoryPermutation`（本任務一并實作，Task 5 的排序函式再補操作）
- Produces: `exportBackup`、`importBackup`、`applyBatchSlot`、`applyBatchPage`、`commitBatchPage`、`findEmptySlot`、`isCategoryPermutation`、`DEFAULT_CATEGORY_ORDER`

- [ ] **Step 1: Write the failing test**

追加到 `model.test.mjs`：

```javascript
function currentState() {
  const pages = M.pagesFromFlatList([]);
  pages['1'][0] = { id: 't1', category: '💐', title: '合成甲', text: '合成內文甲', catName: '保留' };
  pages['1'][20] = { id: 'tail', category: '🎂', title: '合成尾', text: '尾' };
  return {
    pages,
    rawPages: {},
    slotsPerPage: 15,
    categoryOrder: M.DEFAULT_CATEGORY_ORDER.slice()
  };
}

test('legacy ten-slot backup keeps the item index and current settings', () => {
  const current = currentState();
  const legacy = {};
  for (let p = 1; p <= 10; p += 1) legacy[String(p)] = Array(10).fill(null);
  legacy['4'][2] = { id: 'old', category: '🌹', title: '合成舊', text: '舊', tagClass: 'tag-blue' };
  const imported = M.importBackup(legacy, current);
  assert.equal(imported.ok, true);
  assert.equal(imported.pages['4'][2].tagClass, 'tag-blue');
  assert.equal(imported.pages['4'].length, 20);
  assert.equal(imported.slotsPerPage, 15);
  assert.deepEqual(imported.categoryOrder, current.categoryOrder);
});

test('version 2 round trip keeps hidden slots, tail, order, and catName', () => {
  const current = currentState();
  const raw = M.exportBackup(current);
  const imported = M.importBackup(JSON.parse(JSON.stringify(raw)), {
    pages: M.pagesFromFlatList([]),
    rawPages: {},
    slotsPerPage: 10,
    categoryOrder: M.DEFAULT_CATEGORY_ORDER.slice().reverse()
  });
  assert.equal(imported.ok, true);
  assert.equal(imported.pages['1'][0].catName, '保留');
  assert.equal(imported.pages['1'][20].id, 'tail');
  assert.equal(imported.slotsPerPage, 15);
  assert.deepEqual(imported.categoryOrder, M.DEFAULT_CATEGORY_ORDER);
});

test('rawPages round trip stays raw until batch save', () => {
  const file = {
    format: 'wuyi-quick-reply-backup',
    formatVersion: 2,
    slotsPerPage: 10,
    categoryOrder: M.DEFAULT_CATEGORY_ORDER,
    pages: { '1': [] },
    rawPages: { '2': { kept: true } }
  };
  for (let p = 3; p <= 10; p += 1) file.pages[String(p)] = [];
  const imported = M.importBackup(file, currentState());
  assert.deepEqual(imported.rawPages['2'], { kept: true });
  const stored = M.serializePagesForStorage(imported.pages, imported.rawPages);
  assert.deepEqual(stored['2'], { kept: true });
  const forms = Array.from({ length: 20 }, () => ({ title: '', category: '💐', text: '' }));
  forms[0] = { title: '合成新', category: '💐', text: '新內文' };
  const committed = M.commitBatchPage(imported.pages, imported.rawPages, 2, forms);
  assert.equal(committed.rawPages['2'], undefined);
  assert.equal(committed.pages['2'][0].title, '合成新');
  assert.equal(committed.pages['2'][0].id, 'slot_2_0');
});

test('bad backups do not change current state', () => {
  const current = currentState();
  for (const file of [{ '1': [] }, { formatVersion: 3 }, {
    format: 'wuyi-quick-reply-backup', formatVersion: 2, slotsPerPage: 10,
    categoryOrder: M.DEFAULT_CATEGORY_ORDER.slice(0, 12).concat([M.DEFAULT_CATEGORY_ORDER[0]]),
    pages: { '1': [], '2': [], '3': [], '4': [], '5': [], '6': [], '7': [], '8': [], '9': [], '10': [] }
  }]) {
    const imported = M.importBackup(file, current);
    assert.equal(imported.ok, false);
    assert.equal(imported.error, '檔案無法匯入，目前資料沒有變更。');
    assert.deepEqual(imported.pages, current.pages);
    assert.equal(imported.slotsPerPage, 15);
  }
});

test('batch save keeps unknown fields and the tail past index 19', () => {
  const page = M.padPage([{ id: 'keep', category: '💐', title: '舊', text: '舊文', catName: '保留' }]);
  page.push({ id: 'tail', category: '🎂', title: '尾', text: '尾文' });
  const forms = Array.from({ length: 20 }, () => ({ title: '', category: '💐', text: '' }));
  forms[0] = { title: '新題', category: '🌹', text: '新文' };
  const next = M.applyBatchPage(page, forms);
  assert.equal(next[0].id, 'keep');
  assert.equal(next[0].catName, '保留');
  assert.equal(next[0].title, '新題');
  assert.equal(next[1], null);
  assert.equal(next[20].id, 'tail');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern "legacy ten-slot|version 2 round|rawPages|bad backups|batch save" wuyi-quick-reply-extension/test/model.test.mjs`

Expected: FAIL，`M.DEFAULT_CATEGORY_ORDER` 為 `undefined`。

- [ ] **Step 3: Write minimal implementation**

在 `model.js` factory 內、`return` 之前加入下面的常數與函式，並把它們放進 `return`。`DEFAULT_CATEGORY_ORDER` 的 13 個字串必須與規格相同，⭐️ 是 U+2B50 U+FE0F，‼️ 是 U+203C U+FE0F，❤️ 是 U+2764 U+FE0F。

```javascript
  const DEFAULT_CATEGORY_ORDER = ['💐', '🌹', '🎂', '🍔', '🔥', '🚗', '⭐️', '‼️', '❓', '😊', '👍', '💙', '❤️'];

  function isCategoryPermutation(order) {
    if (!Array.isArray(order) || order.length !== DEFAULT_CATEGORY_ORDER.length) return false;
    const counts = new Map();
    DEFAULT_CATEGORY_ORDER.forEach(item => counts.set(item, (counts.get(item) || 0) + 1));
    for (const item of order) {
      if (!counts.get(item)) return false;
      counts.set(item, counts.get(item) - 1);
    }
    return true;
  }

  function cloneItem(item) {
    return item && typeof item === 'object' ? { ...item } : null;
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
```

`applyBatchSlot` 的 `form.page` 由 `commitBatchPage` 寫入。Task 4 的批次測試呼叫 `applyBatchPage` 時，表單物件沒有 `page`，新物件沒有舊 id 的那一格不會出現在這個測試的 index 0（index 0 沿用 `keep`）。index 1 變成 `null`。不需要 `form.page` 也能通過該測試。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test wuyi-quick-reply-extension/test/model.test.mjs`

Expected: PASS，16 tests。

- [ ] **Step 5: Commit**

```bash
git add wuyi-quick-reply-extension/model.js wuyi-quick-reply-extension/test/model.test.mjs
git commit -m "加入備份匯入匯出與批次儲存規則"
```

---

### Task 5: 類別順序

**Files:**
- Modify: `wuyi-quick-reply-extension/model.js`
- Test: `wuyi-quick-reply-extension/test/model.test.mjs`

**Interfaces:**
- Consumes: `DEFAULT_CATEGORY_ORDER`、`isCategoryPermutation`
- Produces: `moveCategory`、`swapCategoryNeighbor`、`parseCategoryOrder`、`categoryOptions`

- [ ] **Step 1: Write the failing test**

```javascript
test('category drag inserts and alt-left swaps the following item', () => {
  const order = M.DEFAULT_CATEGORY_ORDER.slice();
  const dragged = M.moveCategory(order, 0, 2);
  assert.deepEqual(dragged.slice(0, 3), [order[1], order[2], order[0]]);
  assert.deepEqual(dragged.slice(3), order.slice(3));
  const swapped = M.swapCategoryNeighbor(dragged, 3, -1);
  assert.equal(swapped[2], dragged[3]);
  assert.equal(swapped[3], dragged[2]);
  const replies = [{ category: order[0] }];
  assert.equal(replies[0].category, order[0]);
});

test('unknown category is appended for one dropdown only', () => {
  const options = M.categoryOptions(M.DEFAULT_CATEGORY_ORDER, '合成類');
  assert.equal(options.at(-1), '合成類');
  assert.equal(M.DEFAULT_CATEGORY_ORDER.length, 13);
  assert.equal(M.parseCategoryOrder('["💐"]')[0], M.DEFAULT_CATEGORY_ORDER[0]);
  assert.equal(M.parseCategoryOrder('["💐"]').length, 13);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern "category drag|unknown category" wuyi-quick-reply-extension/test/model.test.mjs`

Expected: FAIL，`M.moveCategory is not a function`。

- [ ] **Step 3: Write minimal implementation**

```javascript
  function moveCategory(order, from, to) {
    const next = order.slice();
    const item = next.splice(from, 1)[0];
    next.splice(to, 0, item);
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
```

加入 `return`。`parseCategoryOrder` 在輸入不合法時回傳預設複本，不寫入儲存；寫入只發生在 `app.js` 的使用者操作。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test wuyi-quick-reply-extension/test/model.test.mjs`

Expected: PASS，18 tests。

- [ ] **Step 5: Commit**

```bash
git add wuyi-quick-reply-extension/model.js wuyi-quick-reply-extension/test/model.test.mjs
git commit -m "加入類別順序的插入、交換與下拉選項"
```

---

### Task 6: 報價、數字蠟燭與貼上判斷

**Files:**
- Modify: `wuyi-quick-reply-extension/model.js`
- Test: `wuyi-quick-reply-extension/test/model.test.mjs`

**Interfaces:**
- Consumes: 無
- Produces: `ADDON_CATALOG`、`ADDON_KEY_ORDER`、`ADDON_BUTTON_IDS`、`cycleCount`、`candleButtonText`、`validateCustomAddon`、`emptyQuoteAddons`、`quoteSummary`、`shouldPaste`、`shouldStartCardDrag`

- [ ] **Step 1: Write the failing test**

```javascript
test('number candle cycles 0 through 5 and stays separate from u5', () => {
  let count = 0;
  const seen = [];
  for (let i = 0; i < 6; i += 1) {
    count = M.cycleCount(count);
    seen.push(count);
  }
  assert.deepEqual(seen, [1, 2, 3, 4, 5, 0]);
  const state = {
    hasFlower390: false, customFlowerPrice: 0, hasBag: false, cakePrice: 0, hasIceBag: false,
    addons: { ...M.emptyQuoteAddons(), u5: 1, c30: 5 },
    customName: '', customAmount: ''
  };
  const summary = M.quoteSummary(state);
  assert.equal(M.ADDON_CATALOG.u5.price, 30);
  assert.equal(M.ADDON_CATALOG.c30.price, 30);
  assert.ok(summary.items.includes('5人餐具$30'));
  assert.ok(summary.items.includes('數字蠟燭x5$150'));
  assert.equal(summary.total, 180);
  assert.equal(M.candleButtonText(0), '數字蠟燭 $30');
  assert.equal(M.candleButtonText(2), '數字蠟燭 x2 +$60');
});

test('custom addon validates amount and blocks a partial line', () => {
  const good = M.quoteSummary({
    hasFlower390: false, customFlowerPrice: 0, hasBag: false, cakePrice: 0, hasIceBag: false,
    addons: M.emptyQuoteAddons(), customName: '合成蠟燭', customAmount: '30'
  });
  assert.equal(good.total, 30);
  assert.deepEqual(good.items, ['合成蠟燭$30']);
  assert.equal(good.blocked, false);
  for (const amount of ['1.5', '-1', '0', '']) {
    const bad = M.validateCustomAddon('合成蠟燭', amount);
    assert.equal(bad.include, false);
    assert.equal(bad.error, '金額請輸入 1 到 999999 的整數');
  }
  assert.equal(M.validateCustomAddon('', '30').error, '請輸入品項名稱');
  assert.equal(M.validateCustomAddon('花'.repeat(31), '30').error, '品項名稱最多 30 個字');
  assert.equal(M.validateCustomAddon('  合成   蠟燭 \n', '30').name, '合成 蠟燭');
});

test('quote reset values and paste guards', () => {
  assert.deepEqual(M.emptyQuoteAddons(), { u2: 0, u5: 0, u10: 0, c45: 0, c55: 0, c30: 0 });
  assert.equal(M.shouldPaste(['span', 'div']), true);
  assert.equal(M.shouldPaste(['span', 'button', 'div']), false);
  assert.equal(M.shouldPaste(['a']), false);
  assert.equal(M.shouldStartCardDrag(['span', 'button']), false);
  assert.equal(M.shouldStartCardDrag(['div']), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern "number candle|custom addon|quote reset" wuyi-quick-reply-extension/test/model.test.mjs`

Expected: FAIL，`M.cycleCount is not a function`。

- [ ] **Step 3: Write minimal implementation**

```javascript
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
```

加入 `return`。既有加購的按鈕零狀態文字仍由 `app.js` 原本的 `label + 單價` 產生，不要改 `u2`、`u5`、`u10`、`c45`、`c55`、保冰袋的可見字串。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test wuyi-quick-reply-extension/test/model.test.mjs`

Expected: PASS，21 tests。

- [ ] **Step 5: Commit**

```bash
git add wuyi-quick-reply-extension/model.js wuyi-quick-reply-extension/test/model.test.mjs
git commit -m "加入報價驗證與貼上判斷"
```

---

### Task 7: 記憶體 DOM 能載入真正的 app.js

**Files:**
- Create: `wuyi-quick-reply-extension/test/harness.mjs`
- Test: `wuyi-quick-reply-extension/test/wiring.test.mjs`

**Interfaces:**
- Consumes: 展開後的 `events.js`、`app.js`
- Produces: `boot(options)`、`click(ctx, el)`。`boot` 回傳的 context 上可呼叫 `buildReplyCardHtml`。

- [ ] **Step 1: Write the failing test**

建立 `wuyi-quick-reply-extension/test/wiring.test.mjs`：

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './harness.mjs';

test('harness renders a synthetic card through the real builder', () => {
  const ctx = boot({
    storage: {
      wuyi_defaults_version: '1.0.2-003851d4',
      wuyi_100_pages_data: JSON.stringify({ '1': [{ id: 't1', category: '💐', title: '合成甲', text: '合成內文甲' }] })
    }
  });
  const html = ctx.buildReplyCardHtml({ id: 't1', category: '💐', title: '合成甲', text: '合成內文甲' }, 1, 0);
  assert.match(html, /id="replyCard_1_0"/);
  assert.match(html, /合成甲/);
  assert.equal(typeof ctx.openMoveModal, 'function');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test wuyi-quick-reply-extension/test/wiring.test.mjs`

Expected: FAIL，`Cannot find module './harness.mjs'`。

- [ ] **Step 3: Write minimal implementation**

建立 `wuyi-quick-reply-extension/test/harness.mjs`：

```javascript
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function createElementClass() {
  function Element(tag) {
    this.tagName = String(tag || 'div').toUpperCase();
    this.attrs = {};
    this.children = [];
    this.parentElement = null;
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.style = {};
    const classes = new Set();
    this.classList = {
      add(...names) { names.forEach(name => classes.add(name)); },
      remove(...names) { names.forEach(name => classes.delete(name)); },
      toggle(name, force) {
        const on = force === undefined ? !classes.has(name) : !!force;
        if (on) classes.add(name); else classes.delete(name);
        return on;
      },
      contains(name) { return classes.has(name); }
    };
  }
  Element.prototype.getAttribute = function (name) { return Object.prototype.hasOwnProperty.call(this.attrs, name) ? this.attrs[name] : null; };
  Element.prototype.setAttribute = function (name, value) { this.attrs[name] = String(value); };
  Element.prototype.hasAttribute = function (name) { return Object.prototype.hasOwnProperty.call(this.attrs, name); };
  Element.prototype.closest = function (selector) {
    const tags = new Set(selector.split(',').map(part => part.trim().toLowerCase()));
    let node = this;
    while (node) {
      if (tags.has(String(node.tagName || '').toLowerCase())) return node;
      node = node.parentElement;
    }
    return null;
  };
  Element.prototype.appendChild = function (child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  };
  return Element;
}

export function boot(options = {}) {
  const Element = createElementClass();
  const elements = new Map();
  const listeners = {};
  const document = {
    getElementById(id) {
      if (!elements.has(id)) {
        const el = new Element('div');
        el.id = id;
        elements.set(id, el);
      }
      return elements.get(id);
    },
    querySelectorAll() { return []; },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    createElement(tag) { return new Element(tag); },
    body: new Element('body')
  };
  const storage = new Map(Object.entries(options.storage || {}));
  const localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  };
  const pasteLog = [];
  const context = {
    console,
    setTimeout() { return 0; },
    clearTimeout() {},
    localStorage,
    document,
    navigator: {},
    Element,
    encodeURIComponent,
    decodeURIComponent,
    confirm() { return false; },
    URL,
    URLSearchParams,
    WuyiModel: require(path.join(root, 'model.js')),
    WuyiPaste: {
      pasteToLine(text) {
        pasteLog.push(text);
        return Promise.resolve({ ok: true, appended: false });
      }
    }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(root, 'events.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context);
  context.__pasteLog = pasteLog;
  context.__listeners = listeners;
  context.__Element = Element;
  return context;
}

export function click(ctx, el) {
  const event = {
    target: el,
    cancelBubble: false,
    clientX: 0,
    clientY: 0,
    preventDefault() {},
    stopPropagation() { this.cancelBubble = true; }
  };
  for (const fn of ctx.__listeners.click || []) fn(event);
  return event;
}
```

`app.js` 在這個 DOM 上已能完成現有的載入。測試預先寫入 `wuyi_defaults_version`，避免遷移函式改寫合成頁面。不要把 `pasteLog` 或卡片 HTML 印到輸出。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test wuyi-quick-reply-extension/test/wiring.test.mjs`

Expected: PASS，1 test。

- [ ] **Step 5: Commit**

```bash
git add wuyi-quick-reply-extension/test/harness.mjs wuyi-quick-reply-extension/test/wiring.test.mjs
git commit -m "加入可載入真實側邊欄腳本的記憶體 DOM"
```

---

### Task 8: 接上儲存、每頁格數與主列表

**Files:**
- Modify: `wuyi-quick-reply-extension/sidepanel.html`（`page-nav-container` 內、script 順序）
- Modify: `wuyi-quick-reply-extension/app.js`（`loadPagesDataFromStorage`、`savePagesDataToStorage`、`renderMainPageNav`、`renderReplies`）
- Modify: `wuyi-quick-reply-extension/sidepanel.css`
- Test: `wuyi-quick-reply-extension/test/wiring.test.mjs`

**Interfaces:**
- Consumes: `normalizePages`、`serializePagesForStorage`、`parseVisibleSlots`、`hiddenNotice`、`pageAriaLabel`、`pageHasHidden`、`rawPageNotice`、`pagesFromFlatList`
- Produces: `visibleSlots`、`rawPages`、`setVisibleSlotsFromUi(n)`、`renderSlotsPerPageControl()`

- [ ] **Step 1: Write the failing test**

追加：

```javascript
test('slot control renders 10 cards and keeps a hidden item when switched', () => {
  const page = Array(21).fill(null);
  page[0] = { id: 't1', category: '💐', title: '合成甲', text: '合成內文甲' };
  page[12] = { id: 'hid', category: '🎂', title: '合成藏', text: '合成內文藏' };
  page[20] = { id: 'tail', category: '🌹', title: '合成尾', text: '合成內文尾' };
  const ctx = boot({
    storage: {
      wuyi_defaults_version: '1.0.2-003851d4',
      wuyi_100_pages_data: JSON.stringify({ '1': page })
    }
  });
  ctx.renderReplies();
  const html = ctx.document.getElementById('repliesContainer').innerHTML;
  assert.equal((html.match(/reply-card/g) || []).length, 1);
  assert.match(html, /此頁有 2 則在目前未顯示的格子（13、21）/);
  assert.match(ctx.document.getElementById('slotsPerPageControl').innerHTML, /aria-label="每頁顯示 10 格"/);
  ctx.setVisibleSlotsFromUi(20);
  const again = ctx.document.getElementById('repliesContainer').innerHTML;
  assert.match(again, /合成藏/);
  assert.equal(again.includes('replyCard_1_20'), false);
  assert.match(again, /此頁有 1 則在目前未顯示的格子（21）/);
  assert.equal(ctx.localStorage.getItem('wuyi_slots_per_page'), '20');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern "slot control" wuyi-quick-reply-extension/test/wiring.test.mjs`

Expected: FAIL，`setVisibleSlotsFromUi` 不是函式，或提示文字不存在。

- [ ] **Step 3: Write minimal implementation**

`sidepanel.html` 的 `page-nav-container` 改成：

```html
<div class="page-nav-container">
  <div class="slots-per-page" id="slotsPerPageControl" role="group" aria-label="每頁格數"></div>
  <div class="page-pills-row" id="mainPagePills"></div>
</div>
```

在 `events.js` 那一行之前加入 `<script src="model.js"></script>`。

`sidepanel.css` 加入：

```css
.slots-per-page { display: flex; gap: 4px; align-items: center; font-size: 11px; font-weight: 700; }
.slots-per-page button.active { background: #0f172a; color: #fff; }
.page-num-btn .hidden-dot { width: 5px; height: 5px; border-radius: 50%; background: #0284c7; display: inline-block; margin-left: 2px; }
.hidden-slot-badge { font-size: 10px; color: #0284c7; font-weight: 700; }
```

在 `app.js` 以 `WuyiModel` 重寫載入與儲存：

```javascript
let rawPages = {};
let visibleSlots = WuyiModel.parseVisibleSlots(localStorage.getItem('wuyi_slots_per_page'));

function loadPagesDataFromStorage() {
  const saved = localStorage.getItem('wuyi_100_pages_data');
  if (saved) {
    let parsed = null;
    try { parsed = JSON.parse(saved); } catch (e) { parsed = null; }
    const normalized = WuyiModel.normalizePages(parsed || {});
    rawPages = normalized.rawPages;
    if (normalized.writeBack) {
      localStorage.setItem('wuyi_100_pages_data', JSON.stringify(WuyiModel.serializePagesForStorage(normalized.pages, normalized.rawPages)));
    }
    return normalized.pages;
  }
  const oldSaved = localStorage.getItem('wuyi_custom_replies');
  let oldList = defaultPage1Replies;
  if (oldSaved) {
    try {
      const parsedOld = JSON.parse(oldSaved);
      if (Array.isArray(parsedOld) && parsedOld.length > 0) oldList = parsedOld;
    } catch (e) {}
  }
  oldList.forEach(item => {
    if (item) item.category = legacyCategoryMap[item.category] || item.category || '⭐️';
  });
  rawPages = {};
  return WuyiModel.pagesFromFlatList(oldList);
}

function savePagesDataToStorage() {
  localStorage.setItem('wuyi_100_pages_data', JSON.stringify(WuyiModel.serializePagesForStorage(pagesData, rawPages)));
}
```

`renderMainPageNav` 的頁碼按鈕使用 `WuyiModel.pageAriaLabel(p, pagesData[p], visibleSlots)`。有隱藏內容時在按鈕內加 `<span class="hidden-dot"></span>`。頁碼 dragover 仍呼叫 `changeMainPage(p)`，不要改成跨頁插入。

`renderReplies` 的一般模式只畫索引 `0` 到 `visibleSlots - 1`。若 `rawPages[currentPage]` 存在，列表前顯示 `WuyiModel.rawPageNotice(currentPage)`。否則顯示 `WuyiModel.hiddenNotice(pagesData[currentPage], visibleSlots)`。篩選與搜尋走訪每一頁的全部已儲存索引；`slotIdx >= visibleSlots` 的卡片呼叫 `buildReplyCardHtml(item, p, slotIdx, true)`。

```javascript
function renderSlotsPerPageControl() {
  const host = document.getElementById('slotsPerPageControl');
  if (!host) return;
  host.innerHTML = `<span>每頁格數</span>` + [10, 15, 20].map(n =>
    `<button type="button" class="${n === visibleSlots ? 'active' : ''}" data-on-click="setVisibleSlotsFromUi(${n})" aria-label="每頁顯示 ${n} 格">${n}</button>`
  ).join('');
}

function setVisibleSlotsFromUi(n) {
  visibleSlots = n;
  localStorage.setItem('wuyi_slots_per_page', String(n));
  renderSlotsPerPageControl();
  renderMainPageNav();
  renderReplies();
}
```

在檔案最後的 `renderMainPageNav(); renderReplies();` 之前呼叫 `renderSlotsPerPageControl();`。

`migrateOfficialDefaults` 內所有 `new Array(SLOTS_PER_PAGE)` 改成 `Array(WuyiModel.MAX_STORED_SLOTS).fill(null)`。槽迴圈 `s < SLOTS_PER_PAGE` 改成 `s < pagesData[p].length`。不要改 `DEFAULTS_VERSION` 那一行。不要把官方預設內文貼進測試或提交訊息。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test wuyi-quick-reply-extension/test/wiring.test.mjs wuyi-quick-reply-extension/test/model.test.mjs`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add wuyi-quick-reply-extension/app.js wuyi-quick-reply-extension/sidepanel.html wuyi-quick-reply-extension/sidepanel.css wuyi-quick-reply-extension/test/wiring.test.mjs
git commit -m "接上每頁格數與不刪除隱藏格的列表"
```

---

### Task 9: 移動按鈕與取消長按

**Files:**
- Modify: `wuyi-quick-reply-extension/app.js`（`buildReplyCardHtml`、長按函式、`moveSlotRelative`、`moveSlotToExtremes`、`executeMove`、`handleDragStart`、`openMoveModal`）
- Modify: `wuyi-quick-reply-extension/sidepanel.css`（刪除 `.reply-card.pressing::after` 與 `@keyframes longPressBar`）
- Modify: `wuyi-quick-reply-extension/安裝說明.md`
- Test: `wuyi-quick-reply-extension/test/wiring.test.mjs`

**Interfaces:**
- Consumes: `moveRelative`、`moveExtreme`、`swapSlots`、`insertSlot`、`shouldStartCardDrag`、`openMoveModal`
- Produces: `openMoveFromCard(event, page, slot)`、`ancestorTagsFromEvent(event)`

- [ ] **Step 1: Write the failing test**

```javascript
把檔案開頭的 import 改成 `import { boot, click } from './harness.mjs';`。不要再寫第二個 import。然後追加：

```javascript
function cardContext() {
  const page = Array(20).fill(null);
  page[0] = { id: 't1', category: '💐', title: '合成甲', text: '合成內文甲' };
  return boot({
    storage: {
      wuyi_defaults_version: '1.0.2-003851d4',
      wuyi_100_pages_data: JSON.stringify({ '1': page })
    }
  });
}

test('move, edit, and copy buttons do not paste; card body pastes once', () => {
  const ctx = cardContext();
  ctx.renderReplies();
  const html = ctx.document.getElementById('repliesContainer').innerHTML;
  assert.match(html, /data-on-click="openMoveFromCard\(event, 1, 0\)"/);
  assert.match(html, />移動</);
  assert.equal(html.includes('startLongPress'), false);
  assert.equal(html.includes('3000'), false);
  const card = new ctx.__Element('div');
  card.setAttribute('data-on-click', 'handleCardClick(event, 1, 0)');
  const button = new ctx.__Element('button');
  button.setAttribute('data-on-click', 'openMoveFromCard(event, 1, 0)');
  const span = new ctx.__Element('span');
  button.appendChild(span);
  card.appendChild(button);
  click(ctx, span);
  assert.equal(ctx.__pasteLog.length, 0);
  assert.equal(ctx.document.getElementById('moveModal').classList.contains('show'), true);
  const title = new ctx.__Element('span');
  card.appendChild(title);
  click(ctx, title);
  assert.equal(ctx.__pasteLog.length, 1);
});

test('search shows a hidden card with its slot label', () => {
  const page = Array(20).fill(null);
  page[12] = { id: 'hid', category: '🎂', title: '合成藏', text: '合成內文藏' };
  const ctx = boot({
    storage: {
      wuyi_defaults_version: '1.0.2-003851d4',
      wuyi_100_pages_data: JSON.stringify({ '1': page })
    }
  });
  ctx.document.getElementById('searchInput').value = '合成藏';
  ctx.filterReplies();
  const filtered = ctx.document.getElementById('repliesContainer').innerHTML;
  assert.match(filtered, /未顯示/);
  assert.match(filtered, /第 1 頁第 13 格/);
  assert.equal(filtered.includes('draggable="true"'), false);
});
```

`openMoveModal` 既有最後一行已是 `document.getElementById('moveModal')?.classList.add('show')`。不要改這行。harness 的 `classList` 在 Task 7 已經會記錄 `show`。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern "move, edit, and copy" wuyi-quick-reply-extension/test/wiring.test.mjs`

Expected: FAIL，HTML 仍含 `startLongPress`，沒有 `openMoveFromCard`。

- [ ] **Step 3: Write minimal implementation**

`buildReplyCardHtml(item, pageNum, slotIdx, hidden)` 的卡片屬性只留 `data-on-click="handleCardClick(...)"`、`draggable`、拖曳四個屬性。`hidden === true` 時 `draggable="false"`，並且不輸出 drag 屬性。`title` 改為 `點一下貼進 LINE 對話框（「移動」可換頁或換格；也可拖曳換位）`。右側第一個按鈕是：

```html
<button type="button" class="btn-card-move" data-on-click="openMoveFromCard(event, ${pageNum}, ${slotIdx})" aria-label="移動欄位與更換頁數"><span>移動</span></button>
```

其後維持既有 ✏️ 與 📋。隱藏卡片在標題旁加 `<span class="hidden-slot-badge">未顯示</span>` 與文字 `第 ${pageNum} 頁第 ${slotIdx + 1} 格`。

刪除 `startLongPress`、`cancelLongPress`、`handleTouchStart`、`handleTouchMove`、`longPressTimer`。刪除 CSS 的 `longPressBar`。

```javascript
function ancestorTagsFromEvent(event) {
  const tags = [];
  let node = event.target;
  while (node && node.tagName) {
    tags.push(node.tagName);
    node = node.parentElement;
  }
  return tags;
}

function openMoveFromCard(event, page, slot) {
  if (event) event.cancelBubble = true;
  openMoveModal(page, slot);
}

function handleDragStart(e, pageNum, slotIdx) {
  if (!WuyiModel.shouldStartCardDrag(ancestorTagsFromEvent(e))) {
    e.preventDefault();
    return;
  }
  cardClickSuppressed = true;
  draggedCoord = { page: pageNum, slot: slotIdx };
  e.dataTransfer.effectAllowed = 'move';
  document.getElementById(`replyCard_${pageNum}_${slotIdx}`)?.classList.add('dragging');
}
```

`moveSlotRelative`、`moveSlotToExtremes`、`executeMove` 改為取 `WuyiModel` 的回傳值，寫回 `pagesData`、呼叫 `savePagesDataToStorage` 與 `renderReplies`。`disabled === true` 時不寫入，並在視窗顯示「此格目前未顯示。請用下方的目標格，或先把每頁格數調大。」把四個相對按鈕設為 `disabled`。`insertSlot` 回傳 `ok: false` 時不寫入，只顯示它的 toast。

`updateTargetSlotOptions` 的迴圈改為 `s < pagesData[targetP].length`。索引大於等於 `visibleSlots` 的選項文字以 `未顯示` 結尾。

`handleCardClick` 保留 `closest('button, a, input, textarea, select, label')`。

`安裝說明.md` 使用步驟第 4 點的長按句改為：

```markdown
   - 卡片上的「移動」可打開移動欄位與換頁視窗；滑鼠拖曳仍可換位。這兩種操作都不會貼上。沒有長按三秒選單。
   - 每頁格數可選 10、15 或 20 格。改少時，多出來的格子只是不顯示，不會刪除。
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test wuyi-quick-reply-extension/test/wiring.test.mjs`

Expected: PASS。`安裝說明.md` 不再含「長按卡片 3 秒」。

- [ ] **Step 5: Commit**

```bash
git add wuyi-quick-reply-extension/app.js wuyi-quick-reply-extension/sidepanel.css wuyi-quick-reply-extension/安裝說明.md wuyi-quick-reply-extension/test/harness.mjs wuyi-quick-reply-extension/test/wiring.test.mjs
git commit -m "以移動按鈕取代長按三秒"
```

---

### Task 10: 類別拖曳、鍵盤與下拉同步

**Files:**
- Modify: `wuyi-quick-reply-extension/sidepanel.html`（`.category-pills` 改為空的 `#categoryPills`；管理視窗加 `#categoryOrderEditor`）
- Modify: `wuyi-quick-reply-extension/app.js`
- Test: `wuyi-quick-reply-extension/test/wiring.test.mjs`

**Interfaces:**
- Consumes: `moveCategory`、`swapCategoryNeighbor`、`parseCategoryOrder`、`categoryOptions`
- Produces: `renderCategoryPills`、`onCategoryKeyDown`、`moveCategoryFromUi`、`categoryOrder`

- [ ] **Step 1: Write the failing test**

```javascript
test('category alt-left reorders pills and both dropdowns', () => {
  const ctx = boot({ storage: { wuyi_defaults_version: '1.0.2-003851d4', wuyi_100_pages_data: JSON.stringify({ '1': [] }) } });
  ctx.renderCategoryPills();
  const before = ctx.document.getElementById('categoryPills').innerHTML;
  assert.match(before, /selectCategory\('all'/);
  assert.match(before, /data-on-keydown="onCategoryKeyDown\(event\)"/);
  const first = ctx.WuyiModel.DEFAULT_CATEGORY_ORDER[0];
  const second = ctx.WuyiModel.DEFAULT_CATEGORY_ORDER[1];
  assert.ok(before.indexOf(first) < before.indexOf(second));
  const key = {
    key: 'ArrowLeft',
    altKey: true,
    preventDefault() {},
    target: {
      tagName: 'BUTTON',
      closest() { return this; },
      getAttribute(name) { return name === 'data-category-index' ? '1' : null; }
    }
  };
  ctx.onCategoryKeyDown(key);
  const after = ctx.document.getElementById('categoryPills').innerHTML;
  assert.ok(after.indexOf(second) < after.indexOf(first));
  assert.match(ctx.document.getElementById('newReplyCat').innerHTML, new RegExp(first));
  assert.match(ctx.document.getElementById('editReplyCat').innerHTML, new RegExp(first));
  assert.equal(ctx.localStorage.getItem('wuyi_category_order') !== null, true);
});
```

`onCategoryKeyDown` 只處理帶 `data-category-index` 的類別膠囊。🌟 沒有這個屬性，按鍵不改變順序。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern "category alt-left" wuyi-quick-reply-extension/test/wiring.test.mjs`

Expected: FAIL，`renderCategoryPills` 不是函式。

- [ ] **Step 3: Write minimal implementation**

`let categoryOrder = WuyiModel.parseCategoryOrder(localStorage.getItem('wuyi_category_order'));`

在初始化的 `renderSlotsPerPageControl();` 之後呼叫 `renderCategoryPills();`。靜態 HTML 不再留 13 顆寫死的膠囊。

`renderCategoryPills` 輸出一顆 `data-on-click="onCategoryPillClick('all', this)"` 的 🌟，不可拖曳。其餘 13 顆是：

```html
<button type="button" class="cat-pill" draggable="true" data-category-index="${index}" data-on-click="onCategoryPillClick('${cat}', this)" data-on-keydown="onCategoryKeyDown(event)" data-on-dragstart="startCategoryDrag(event, ${index})" data-on-drop="dropCategory(event, ${index})" data-on-dragover="allowCategoryDrag(event)">${cat}</button>
```

`events.js` 目前沒有把 `keydown` 的 `dataset` 傳出；`data-on-keydown` 已在 `BUBBLING` 清單。完整函式：

```javascript
let categoryDrag = null;

function renderCategoryPills() {
  const host = document.getElementById('categoryPills');
  if (!host) return;
  const all = `<button type="button" class="cat-pill" data-on-click="onCategoryPillClick('all', this)">🌟</button>`;
  const rest = categoryOrder.map((cat, index) =>
    `<button type="button" class="cat-pill" draggable="true" data-category-index="${index}" data-on-click="onCategoryPillClick('${cat}', this)" data-on-keydown="onCategoryKeyDown(event)" data-on-dragstart="startCategoryDrag(event, ${index})" data-on-drop="dropCategory(event, ${index})" data-on-dragover="allowCategoryDrag(event)">${cat}</button>`
  ).join('');
  host.innerHTML = all + rest;
  const editor = document.getElementById('categoryOrderEditor');
  if (!editor) return;
  editor.innerHTML = categoryOrder.map((cat, index) =>
    `<div><span>${cat}</span><button type="button" data-on-click="moveCategoryFromUi(${index}, -1)" ${index === 0 ? 'disabled' : ''}>上移</button><button type="button" data-on-click="moveCategoryFromUi(${index}, 1)" ${index === categoryOrder.length - 1 ? 'disabled' : ''}>下移</button></div>`
  ).join('');
}

function persistCategoryOrder() {
  localStorage.setItem('wuyi_category_order', JSON.stringify(categoryOrder));
  renderCategoryPills();
  renderCategorySelect(document.getElementById('newReplyCat'), document.getElementById('newReplyCat')?.value);
  renderCategorySelect(document.getElementById('editReplyCat'), document.getElementById('editReplyCat')?.value);
  renderModalTenSlots();
}

function renderCategorySelect(select, current) {
  if (!select) return;
  const options = WuyiModel.categoryOptions(categoryOrder, current);
  select.innerHTML = options.map(value => `<option value="${value}"${value === current ? ' selected' : ''}>${value}</option>`).join('');
}

function onCategoryKeyDown(event) {
  if (!event.altKey || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
  const host = event.target && event.target.closest ? event.target.closest('[data-category-index]') : null;
  if (!host) return;
  event.preventDefault();
  const index = Number(host.getAttribute('data-category-index'));
  categoryOrder = WuyiModel.swapCategoryNeighbor(categoryOrder, index, event.key === 'ArrowLeft' ? -1 : 1);
  persistCategoryOrder();
}

function startCategoryDrag(event, index) {
  categoryDrag = { index, x: event.clientX || 0, y: event.clientY || 0 };
  event.dataTransfer.effectAllowed = 'move';
}

function allowCategoryDrag(event) {
  event.preventDefault();
}

function dropCategory(event, to) {
  event.preventDefault();
  if (!categoryDrag) return;
  const distance = Math.hypot((event.clientX || 0) - categoryDrag.x, (event.clientY || 0) - categoryDrag.y);
  const from = categoryDrag.index;
  categoryDrag = null;
  if (distance < 8 || from === to) return;
  categoryOrder = WuyiModel.moveCategory(categoryOrder, from, to);
  persistCategoryOrder();
}

function moveCategoryFromUi(index, direction) {
  categoryOrder = WuyiModel.swapCategoryNeighbor(categoryOrder, index, direction);
  persistCategoryOrder();
}

function onCategoryPillClick(cat, el) {
  if (categoryDrag) return;
  selectCategory(cat, el);
}
```

`data-on-drop` 會收到 event。8px 以內不改順序，也不在放下時改目前篩選。Alt+左／右呼叫 `swapCategoryNeighbor`。到了兩端則回傳原陣列。成功後才寫入 `wuyi_category_order`。載入到不合法的值時，`parseCategoryOrder` 回傳預設，不要呼叫 `setItem`。

管理視窗在分頁列下方加：

```html
<div id="categoryOrderEditor"></div>
```

每一列是 emoji 加上 `data-on-click="moveCategoryFromUi(${index}, -1)"` 與 `moveCategoryFromUi(${index}, 1)`，文字是「上移」「下移」。index 0 的上移與最後一列的下移設 `disabled`。

`renderModalTenSlots` 的類別選項改為 `WuyiModel.categoryOptions(categoryOrder, item.category)`。未知值留在該下拉的最後一項且為選取，不寫進 `categoryOrder`。

載入不合法的 `wuyi_category_order` 時不呼叫 `setItem`。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern "category alt-left" wuyi-quick-reply-extension/test/wiring.test.mjs`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add wuyi-quick-reply-extension/app.js wuyi-quick-reply-extension/sidepanel.html wuyi-quick-reply-extension/test/wiring.test.mjs
git commit -m "記住類別順序並同步新增與編輯下拉"
```

---

### Task 11: 批次 20 格、單筆新增與隱藏格移動

**Files:**
- Modify: `wuyi-quick-reply-extension/app.js`（`renderModalTenSlots`、`saveCurrentModalPageSlots`、`clearCurrentModalPageSlots`、`saveSingleReply`）
- Test: `wuyi-quick-reply-extension/test/wiring.test.mjs`

**Interfaces:**
- Consumes: `applyBatchPage`、`commitBatchPage`、`findEmptySlot`
- Produces: 無新的匯出名稱；既有函式改呼叫 model

- [ ] **Step 1: Write the failing test**

```javascript
test('batch editor shows 20 rows and single add prefers a visible hole', () => {
  const page = Array(20).fill({ id: 'full', category: '💐', title: '合成滿', text: '滿' });
  page[3] = null;
  const ctx = boot({
    storage: {
      wuyi_defaults_version: '1.0.2-003851d4',
      wuyi_100_pages_data: JSON.stringify({ '1': page, '2': { kept: true } })
    }
  });
  ctx.renderModalTenSlots();
  const editor = ctx.document.getElementById('tenSlotsContainer').innerHTML;
  assert.equal((editor.match(/欄位 #/g) || []).length, 20);
  assert.match(editor, /未顯示/);
  ctx.document.getElementById('newReplyTitle').value = '合成新';
  ctx.document.getElementById('newReplyText').value = '新內文';
  ctx.document.getElementById('newReplyCat').value = '💐';
  ctx.saveSingleReply();
  const stored = JSON.parse(ctx.localStorage.getItem('wuyi_100_pages_data'));
  assert.equal(stored['1'][3].title, '合成新');
  assert.deepEqual(stored['2'], { kept: true });
});
```

`saveSingleReply` 必須找到第 1 頁索引 3。`findEmptySlot` 的第三個參數是 `rawPages`，有原值的頁不可被選成空格。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern "batch editor" wuyi-quick-reply-extension/test/wiring.test.mjs`

Expected: FAIL。現有批次編輯只畫 10 列。

- [ ] **Step 3: Write minimal implementation**

`renderModalTenSlots` 迴圈改為 `i < 20`。索引大於等於 `visibleSlots` 的列標題加「未顯示」。選項使用 `categoryOptions`。

`saveCurrentModalPageSlots` 收集 20 個表單後呼叫 `WuyiModel.commitBatchPage(pagesData, rawPages, modalPage, forms)`，再 `savePagesDataToStorage`。不要把索引 20 以後切掉。

`clearCurrentModalPageSlots` 的確認句改成規格原文：

```javascript
if (!confirm(`確定要清空第 ${modalPage} 頁畫面上的 20 格嗎？未顯示的格子也會在按下儲存後清空。索引 20 以後若有資料，不會動到。`)) return;
```

`saveSingleReply`：

```javascript
const found = WuyiModel.findEmptySlot(pagesData, visibleSlots, rawPages);
if (!found) {
  showToast('沒有空格可放入，資料沒有變更。', '⚠️');
  return;
}
pagesData[found.page][found.slot] = { id: `slot_${found.page}_${found.slot}`, category: cat || '⭐️', title, text };
savePagesDataToStorage();
if (found.hidden) showToast(`已存入第 ${found.page} 頁第 ${found.slot + 1} 格。此格目前未顯示，改選較多格即可看到。`);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test --test-name-pattern "batch editor" wuyi-quick-reply-extension/test/wiring.test.mjs`

Expected: PASS。第 2 頁的 `{ kept: true }` 仍在儲存字串裡。

- [ ] **Step 5: Commit**

```bash
git add wuyi-quick-reply-extension/app.js wuyi-quick-reply-extension/test/wiring.test.mjs
git commit -m "批次編輯保留二十格以外的資料"
```

---

### Task 12: 數字蠟燭與自訂加購接上畫面

**Files:**
- Modify: `wuyi-quick-reply-extension/sidepanel.html`（`#btnC55` 與 `#btnIce` 之間，以及加購區尾端）
- Modify: `wuyi-quick-reply-extension/app.js`（`quoteState`、`cycleAddon`、`getQuoteSummary`、`copyQuoteText`、`pasteQuoteText`、`resetQuote`）
- Test: `wuyi-quick-reply-extension/test/wiring.test.mjs`

**Interfaces:**
- Consumes: `cycleCount`、`candleButtonText`、`quoteSummary`、`emptyQuoteAddons`、`ADDON_BUTTON_IDS`
- Produces: `onCustomAddonInput()`

- [ ] **Step 1: Write the failing test**

```javascript
在 `wiring.test.mjs` 加上 `import fs from 'node:fs';`。追加：

```javascript
test('candle button and custom addon share the real quote total', () => {
  const sidepanel = fs.readFileSync(new URL('../sidepanel.html', import.meta.url), 'utf8');
  assert.match(sidepanel, /id="btnC30"[^>]*>數字蠟燭 \$30</);
  assert.match(sidepanel, /id="customAddonAmount"[^>]*inputmode="numeric"/);
  const ctx = boot({ storage: { wuyi_defaults_version: '1.0.2-003851d4', wuyi_100_pages_data: '{}' } });
  ctx.resetQuote();
  assert.equal(ctx.document.getElementById('btnC30').textContent, '數字蠟燭 $30');
  ctx.cycleAddon('c30', 30, '數字蠟燭');
  ctx.cycleAddon('c30', 30, '數字蠟燭');
  assert.equal(ctx.document.getElementById('btnC30').textContent, '數字蠟燭 x2 +$60');
  ctx.document.getElementById('customAddonName').value = '合成蠟燭';
  ctx.document.getElementById('customAddonAmount').value = '30';
  ctx.onCustomAddonInput();
  assert.match(ctx.document.getElementById('quoteTotalItems').textContent, /數字蠟燭x2\$60/);
  assert.match(ctx.document.getElementById('quoteTotalItems').textContent, /合成蠟燭\$30/);
  ctx.document.getElementById('customAddonAmount').value = '1.5';
  ctx.onCustomAddonInput();
  ctx.pasteQuoteText();
  assert.equal(ctx.__pasteLog.length, 0);
  assert.match(ctx.document.getElementById('customAddonError').textContent, /自訂加購尚未計入總價/);
  ctx.resetQuote();
  assert.equal(ctx.document.getElementById('btnC30').textContent, '數字蠟燭 $30');
  assert.equal(ctx.document.getElementById('customAddonName').value, '');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test --test-name-pattern "candle button" wuyi-quick-reply-extension/test/wiring.test.mjs`

Expected: FAIL，`#btnC30` 不存在。harness 的 `getElementById` 會自動產生空 div，所以文字斷言失敗。

- [ ] **Step 3: Write minimal implementation**

在 `#btnC55` 與 `#btnIce` 之間加入：

```html
<button type="button" class="btn-addon-cycle" id="btnC30" data-on-click="cycleAddon('c30', 30, '數字蠟燭')">數字蠟燭 $30</button>
```

加購區尾端加入：

```html
<input id="customAddonName" type="text" data-on-input="onCustomAddonInput()" placeholder="自訂品項名稱">
<input id="customAddonAmount" type="text" inputmode="numeric" data-on-input="onCustomAddonInput()" placeholder="金額">
<div id="customAddonError"></div>
```

不要加 `maxlength`，31 個字的錯誤才檢得到。

`quoteState.addons` 改為 `WuyiModel.emptyQuoteAddons()`，並加 `customName: ''`、`customAmount: ''`。

`cycleAddon` 在 `key === 'c30'` 時用 `WuyiModel.candleButtonText(count)`，其他鍵維持原本的 `` `${label} +$${unitPrice}` `` 與 `` `${label} x${count} +$${count * unitPrice}` ``。

`getQuoteSummary` 改成回傳 `WuyiModel.quoteSummary(quoteState)` 的 `{ items, total }`。`calcQuote` 另外讀 `custom`：不合格時 `#customAddonError` 的文字是 `banner + '。' + error`；合格或空白時清空該元素。

```javascript
function onCustomAddonInput() {
  quoteState.customName = document.getElementById('customAddonName').value;
  quoteState.customAmount = document.getElementById('customAddonAmount').value;
  calcQuote();
}

function copyQuoteText() {
  const summary = WuyiModel.quoteSummary(quoteState);
  if (summary.blocked) { showToast(summary.custom.error, '⚠️'); return; }
  if (!summary.items.length) { showToast('請先選擇或輸入至少一項品項金額！', '⚠️'); return; }
  performSafeCopy(buildQuoteText(), () => showToast('已複製報價文案！請直接貼到官方 LINE 對話框'));
}

function pasteQuoteText() {
  const summary = WuyiModel.quoteSummary(quoteState);
  if (summary.blocked) { showToast(summary.custom.error, '⚠️'); return; }
  if (!summary.items.length) { showToast('請先選擇或輸入至少一項品項金額！', '⚠️'); return; }
  window.WuyiPaste.pasteToLine(buildQuoteText());
}
```

`resetQuote` 把 `addons` 設回 `emptyQuoteAddons()`，清空兩個輸入與錯誤元素，`#btnC30` 文字設為 `數字蠟燭 $30`。其他加購按鈕沿用既有 `labelMap`，不要改寫。報價狀態不寫入 `localStorage`。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test wuyi-quick-reply-extension/test/model.test.mjs wuyi-quick-reply-extension/test/wiring.test.mjs`

Expected: PASS。`pasteLog` 長度為 0。

- [ ] **Step 5: Commit**

```bash
git add wuyi-quick-reply-extension/app.js wuyi-quick-reply-extension/sidepanel.html wuyi-quick-reply-extension/test/wiring.test.mjs
git commit -m "接上數字蠟燭與自訂加購"
```

---

### Task 13: 整合回歸、靜態防護與版號

**Files:**
- Modify: `wuyi-quick-reply-extension/manifest.json`（只改 version）
- Test: `wuyi-quick-reply-extension/test/release-guard.test.mjs`
- Test: `wuyi-quick-reply-extension/test/wiring.test.mjs`

**Interfaces:**
- Consumes: 前面所有畫面函式與 `WuyiModel`
- Produces: manifest `1.0.7`

- [ ] **Step 1: Write the failing test**

建立 `wuyi-quick-reply-extension/test/release-guard.test.mjs`：

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const ext = path.join(repo, 'wuyi-quick-reply-extension');

test('release stays inside the extension and does not gain permissions', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ext, 'manifest.json'), 'utf8'));
  assert.equal(manifest.version, '1.0.7');
  assert.equal(manifest.name, '梧藝客服小幫手');
  assert.deepEqual(manifest.permissions, ['sidePanel', 'scripting']);
  assert.deepEqual(manifest.host_permissions, ['https://chat.line.biz/*']);
  const diff = execFileSync('git', ['diff', '--name-only', 'dc523195102f957cc8d2a925004cd917f1df4522', 'HEAD'], { cwd: repo }).toString();
  assert.equal(diff.split('\n').includes('index.html'), false);
  assert.equal(fs.readFileSync(path.join(ext, 'content.js'), 'utf8').includes('KeyboardEvent'), false);
  assert.equal(fs.readFileSync(path.join(ext, 'app.js'), 'utf8').includes('3000'), false);
  assert.equal(fs.readFileSync(path.join(ext, 'sidepanel.css'), 'utf8').includes('longPressBar'), false);
});
```

再在 `wiring.test.mjs` 追加一個整合測試：同一個 `boot` 裡依序檢查移動按鈕不貼上、把可見格從 10 改到 20 後索引 12 的「合成藏」出現、類別下拉順序與膠囊一致、自訂金額 `1.5` 時 `pasteQuoteText` 不增加 `pasteLog`。合成物件只使用 `合成甲`、`合成藏`、`合成蠟燭`。

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test wuyi-quick-reply-extension/test/release-guard.test.mjs`

Expected: FAIL，`manifest.version` 仍是 `1.0.6`。整合測試在版號測試之前先補上，若整合斷言失敗，先修接線再改版號。

- [ ] **Step 3: Write minimal implementation**

把 manifest 的 `"version": "1.0.6"` 改成 `"version": "1.0.7"`。其他欄位不動。

整合測試只呼叫已經存在的函式。若某個斷言失敗，回到對應任務的函式修到這個測試通過，不要新增第二套規則名稱。

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test wuyi-quick-reply-extension/test/*.test.mjs`

Expected: PASS，包含 `source-guard`、`model`、`wiring`、`release-guard`。

- [ ] **Step 5: Commit**

```bash
git add wuyi-quick-reply-extension/manifest.json wuyi-quick-reply-extension/test/release-guard.test.mjs wuyi-quick-reply-extension/test/wiring.test.mjs
git commit -m "把擴充版號設為 1.0.7 並鎖上回歸檢查"
```

---

### Task 14: 審閱證據與待審 PR

**Files:**
- 不修改 ZIP、不修改 `index.html`、不修改 `main`
- 證據寫到 `/opt/cursor/artifacts/`，不把截圖放進擴充目錄

**Interfaces:**
- Consumes: Task 13 的全部測試
- Produces: 一張待審且不可合併的 PR，以及三張側邊欄截圖

- [ ] **Step 1: Write the failing test**

建立 `wuyi-quick-reply-extension/test/review-html.test.mjs`：

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('review html is rendered from the real side panel functions', () => {
  const list = fs.readFileSync('/tmp/wuyi-review/list.html', 'utf8');
  const wide = fs.readFileSync('/tmp/wuyi-review/wide.html', 'utf8');
  const quote = fs.readFileSync('/tmp/wuyi-review/quote.html', 'utf8');
  assert.match(list, /移動/);
  assert.match(list, /合成甲/);
  assert.equal(list.includes('startLongPress'), false);
  assert.match(wide, /合成藏/);
  assert.match(quote, /數字蠟燭 \$30/);
  assert.match(quote, /自訂品項名稱/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test wuyi-quick-reply-extension/test/review-html.test.mjs`

Expected: FAIL，`ENOENT` `/tmp/wuyi-review/list.html`。

- [ ] **Step 3: Write minimal implementation**

建立 `wuyi-quick-reply-extension/test/write-review-html.mjs`：

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { boot } from './harness.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const css = fs.readFileSync(path.join(root, 'sidepanel.css'), 'utf8');
const outDir = '/tmp/wuyi-review';
fs.mkdirSync(outDir, { recursive: true });

function page(title, body) {
  return `<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body>${body}</body></html>`;
}

function shell(ctx) {
  return ctx.document.getElementById('slotsPerPageControl').innerHTML
    + ctx.document.getElementById('categoryPills').innerHTML
    + ctx.document.getElementById('repliesContainer').innerHTML;
}

const stored = { '1': Array(21).fill(null) };
stored['1'][0] = { id: 't1', category: '💐', title: '合成甲', text: '合成內文甲' };
stored['1'][12] = { id: 'hid', category: '🎂', title: '合成藏', text: '合成內文藏' };
const ctx = boot({
  storage: {
    wuyi_defaults_version: '1.0.2-003851d4',
    wuyi_100_pages_data: JSON.stringify(stored)
  }
});
ctx.renderSlotsPerPageControl();
ctx.renderCategoryPills();
ctx.renderReplies();
fs.writeFileSync(path.join(outDir, 'list.html'), page('每頁 10 格', shell(ctx)));
ctx.setVisibleSlotsFromUi(20);
ctx.renderReplies();
fs.writeFileSync(path.join(outDir, 'wide.html'), page('每頁 20 格', shell(ctx)));
const sidepanel = fs.readFileSync(path.join(root, 'sidepanel.html'), 'utf8');
const start = sidepanel.indexOf('id="btnC30"');
const end = sidepanel.indexOf('id="customAddonError"');
const quoteFragment = sidepanel.slice(start, end) + 'id="customAddonError"></div>';
fs.writeFileSync(path.join(outDir, 'quote.html'), page('報價', quoteFragment));
```

執行：

```bash
node wuyi-quick-reply-extension/test/write-review-html.mjs
node --test wuyi-quick-reply-extension/test/review-html.test.mjs
```

Expected: PASS。這個 HTML 不載入 `paste.js`，不連線。

接著截圖：

```bash
BROWSER=$(command -v google-chrome || command -v google-chrome-stable || command -v chromium || command -v chromium-browser)
test -n "$BROWSER"
"$BROWSER" --headless=new --disable-gpu --screenshot=/opt/cursor/artifacts/wuyi-slots-10.png --window-size=420,900 "file:///tmp/wuyi-review/list.html"
"$BROWSER" --headless=new --disable-gpu --screenshot=/opt/cursor/artifacts/wuyi-slots-20.png --window-size=420,900 "file:///tmp/wuyi-review/wide.html"
"$BROWSER" --headless=new --disable-gpu --screenshot=/opt/cursor/artifacts/wuyi-quote.png --window-size=420,900 "file:///tmp/wuyi-review/quote.html"
test -s /opt/cursor/artifacts/wuyi-slots-10.png
test -s /opt/cursor/artifacts/wuyi-slots-20.png
test -s /opt/cursor/artifacts/wuyi-quote.png
```

找不到瀏覽器就停止並回報，不要改畫一張替代圖，也不要安裝擴充到正式設定檔。

- [ ] **Step 4: Run the full suite and save the log**

Run: `node --test wuyi-quick-reply-extension/test/*.test.mjs | tee /opt/cursor/artifacts/wuyi-test-output.txt`

Expected: PASS。

- [ ] **Step 5: Open a review-only PR and commit the writer**

先提交截圖程式與測試，不要提交 `/tmp` 產物：

```bash
git add wuyi-quick-reply-extension/test/write-review-html.mjs wuyi-quick-reply-extension/test/review-html.test.mjs
git commit -m "加入只含合成資料的審閱畫面產生器"
```

然後確認 `git branch --show-current` 是 `cursor/quick-reply-extension-design-57c8`。推這個分支。用 `ManagePullRequest` 建立 PR：`base_branch` 為 `main`，`draft` 為 true。標題使用「梧藝客服小幫手 1.0.7 待審」。內文寫明：

- 不可合併，直到 Leon 另一次書面同意。
- 沒有更新根目錄 ZIP。更新 ZIP 需要另外確認。
- 數字蠟燭 30 尚未對顧店 App 主管主表，不能發布。
- 測試沒有連線 LINE，也沒有讀取真實 localStorage。

不要執行合併，不要推 `main`，不要執行部署，不要重建 `wuyi-quick-reply-extension.zip`。

---

## 規格覆蓋

| 規格 | 任務 |
|---|---|
| 只改擴充、不改 index.html、不擴權 | Task 1、Task 13 |
| 展開 1.0.6 來源 | Task 1 |
| 補位、隱藏格、切換 10／15／20 不刪資料 | Task 2、Task 8 |
| 相對移動、互換、插入、滿頁取消 | Task 3、Task 9 |
| 第 2 版與舊版備份、rawPages、額外欄位 | Task 4、Task 11 |
| 類別拖曳插入、Alt 鍵、上移下移、下拉同步、未知類別 | Task 5、Task 10 |
| 移動按鈕、取消 3000ms、拖曳不從按鈕開始、按鈕不貼上 | Task 6、Task 7、Task 9 |
| 搜尋仍可看到未顯示卡片與徽章 | Task 9 |
| 批次 20 格、單筆先找可見空格、清空確認句 | Task 11 |
| 數字蠟燭 30、0–5 循環、自訂一列、重設清空、半套輸入不貼上 | Task 6、Task 12 |
| 版號 1.0.7、content.js 無 KeyboardEvent | Task 13 |
| 截圖與待審 PR，不更新 ZIP、不合併、不發布 | Task 14 |
| 主表核價後才可發布 | Task 14 的 PR 內文；本計畫沒有發布任務 |

## 執行交接

計畫存在 `docs/superpowers/plans/2026-11-07-quick-reply-extension.md`。下一輪才實作。兩種執行方式：

1. Subagent-Driven（建議）：每個任務一個新的 subagent，任務之間覆核。使用 `superpowers:subagent-driven-development`。
2. Inline Execution：在同一個工作階段用 `superpowers:executing-plans` 分批做，並在檢查點停下來。

這一輪到提交計畫為止。
