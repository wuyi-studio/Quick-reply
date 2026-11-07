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
